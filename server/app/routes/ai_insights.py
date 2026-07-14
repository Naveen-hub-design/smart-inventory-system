from flask import Blueprint, jsonify, request
from app.middleware.auth import staff_required
from app.services.insights_engine import get_insights
from app.routes.settings import is_ai_feature_enabled

insights_bp = Blueprint('ai_insights', __name__)


@insights_bp.route('/insights', methods=['GET'])
@staff_required
def insights():
    if not is_ai_feature_enabled('ai_enabled'):
        return jsonify({'error': 'AI is disabled. Enable it in Settings.'}), 403
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    category_id = request.args.get('category_id', type=int)
    supplier_id = request.args.get('supplier_id', type=int)

    result = get_insights(
        date_from=date_from,
        date_to=date_to,
        category_id=category_id,
        supplier_id=supplier_id,
    )
    return jsonify(result), 200
