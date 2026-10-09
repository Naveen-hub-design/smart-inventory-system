from flask import Blueprint, jsonify, g
import time
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.middleware.auth import staff_required, get_current_user
from app.models.audit_log import create_audit_log
from app.services.reorder_engine import get_recommendations, get_recommendation_detail
from app.routes.settings import is_ai_feature_enabled

ai_bp = Blueprint('ai_reorder', __name__)


@ai_bp.route('/reorder-recommendations', methods=['GET'])
def reorder_recommendations():
    g.sql_queries = []
    t_start = time.perf_counter()

    from flask_jwt_extended import get_jwt_identity
    # 1. Auth Stage
    t_auth_start = time.perf_counter()
    try:
        verify_jwt_in_request()
        claims = get_jwt()
        user_id = get_jwt_identity()
        if claims.get('role') not in ['admin', 'staff']:
            return jsonify({'error': 'Staff access required'}), 403
    except Exception as e:
        return jsonify({'error': 'Authentication failed', 'details': str(e)}), 401
    username = claims.get('username', 'system')
    role = claims.get('role', 'system')
    t_auth_ms = (time.perf_counter() - t_auth_start) * 1000.0

    # 2. Initial DB / Settings
    t_init_db_start = time.perf_counter()
    if not is_ai_feature_enabled('ai_reorder'):
        return jsonify({'error': 'AI Reorder is disabled. Enable it in Settings.'}), 403
    t_init_db_ms = (time.perf_counter() - t_init_db_start) * 1000.0

    # Execute core recommendation engine (Stages 3, 4, 5, 6, 7, 8, 9)
    result = get_recommendations()
    stage_timings = result.pop('_stage_timings', {})

    # Audit log
    t_audit_start = time.perf_counter()
    create_audit_log(
        username=username,
        role=role,
        user_id=int(user_id) if user_id else None,
        action='recommendations_generated',
        module='inventory',
        description=f'AI reorder recommendations generated — {result["total_analyzed"]} variants analyzed, {len(result["high_priority"])} high priority'
    )
    t_audit_ms = (time.perf_counter() - t_audit_start) * 1000.0

    # 10. Serialization
    t_serial_start = time.perf_counter()
    response_data = jsonify(result)
    t_serial_ms = (time.perf_counter() - t_serial_start) * 1000.0

    t_total_ms = (time.perf_counter() - t_start) * 1000.0

    # Aggregate SQL stats
    sql_queries = getattr(g, 'sql_queries', [])
    total_sql_count = len(sql_queries)
    total_db_time_ms = sum(duration for _, duration in sql_queries)
    total_python_time_ms = t_total_ms - total_db_time_ms

    debug_timing = {
        'stages': {
            '1_Auth': round(t_auth_ms, 2),
            '2_Initial_DB': round(t_init_db_ms, 2),
            '3_Product_Variant_Loading': round(stage_timings.get('product_loading_ms', 0), 2),
            '4_Sales_History_Loading': round(stage_timings.get('sales_history_ms', 0), 2),
            '5_Purchase_History_Loading': round(stage_timings.get('purchase_history_ms', 0), 2),
            '6_Forecast_Calculations': round(stage_timings.get('forecast_calc_ms', 0), 2),
            '7_Health_Calculations': round(stage_timings.get('health_calc_ms', 0), 2),
            '8_Reorder_Calculations': round(stage_timings.get('reorder_calc_ms', 0), 2),
            '9_AI_Model_Calls': round(stage_timings.get('ai_model_ms', 0), 2),
            '10_Serialization': round(t_serial_ms, 2),
            'Other_Audit_Log': round(t_audit_ms, 2),
            'TOTAL_HTTP': round(t_total_ms, 2)
        },
        'sql_stats': {
            'total_sql_queries': total_sql_count,
            'total_db_time_ms': round(total_db_time_ms, 2),
            'total_python_processing_time_ms': round(total_python_time_ms, 2)
        },
        'sql_queries_sample': [
            {'sql': stmt, 'duration_ms': round(dur, 2)} for stmt, dur in sql_queries
        ]
    }

    # Print debug table directly to Flask server log
    print("\n" + "="*80)
    print("AI REORDER RECOMMENDATIONS HIGH-RESOLUTION TIMING REPORT")
    print("="*80)
    for k, v in debug_timing['stages'].items():
        print(f"| {k:<30} | {v:>10.2f} ms |")
    print("-" * 80)
    print(f"Total SQL Queries: {total_sql_count}")
    print(f"Total DB Time: {total_db_time_ms:.2f} ms")
    print(f"Total Python Processing Time: {total_python_time_ms:.2f} ms")
    print("="*80 + "\n")

    return jsonify(result), 200


@ai_bp.route('/reorder-detail/<int:variant_id>', methods=['GET'])
@staff_required
def reorder_detail(variant_id):
    if not is_ai_feature_enabled('ai_reorder'):
        return jsonify({'error': 'AI Reorder is disabled.'}), 403
    detail = get_recommendation_detail(variant_id)
    if not detail:
        return jsonify({'error': 'Variant not found'}), 404
    return jsonify(detail), 200
