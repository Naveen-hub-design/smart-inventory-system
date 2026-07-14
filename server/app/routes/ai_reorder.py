from flask import Blueprint, jsonify
from app.middleware.auth import staff_required, get_current_user
from app.models.audit_log import create_audit_log
from app.services.reorder_engine import get_recommendations, get_recommendation_detail
from app.routes.settings import is_ai_feature_enabled

ai_bp = Blueprint('ai_reorder', __name__)


@ai_bp.route('/reorder-recommendations', methods=['GET'])
@staff_required
def reorder_recommendations():
    if not is_ai_feature_enabled('ai_reorder'):
        return jsonify({'error': 'AI Reorder is disabled. Enable it in Settings.'}), 403
    user = get_current_user()
    result = get_recommendations()

    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='recommendations_generated',
        module='inventory',
        description=f'AI reorder recommendations generated — {result["total_analyzed"]} variants analyzed, {len(result["high_priority"])} high priority'
    )

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
