from flask import Blueprint, jsonify, request
from app.middleware.auth import staff_required
from app.services.health_engine import get_health
from app.routes.settings import is_ai_feature_enabled

health_bp = Blueprint('ai_health', __name__)


@health_bp.route('/health', methods=['GET'])
@staff_required
def health():
    if not is_ai_feature_enabled('ai_health'):
        return jsonify({'error': 'AI Inventory Health is disabled. Enable it in Settings.'}), 403
    category_id = request.args.get('category_id', type=int)
    supplier_id = request.args.get('supplier_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    result = get_health(
        category_id=category_id,
        supplier_id=supplier_id,
        date_from=date_from,
        date_to=date_to,
    )
    return jsonify(result), 200
