from flask import Blueprint, jsonify, request
from app.middleware.auth import staff_required
from app.services.forecast_engine import get_forecasts
from app.routes.settings import is_ai_feature_enabled

forecast_bp = Blueprint('ai_forecast', __name__)


@forecast_bp.route('/forecast', methods=['GET'])
@staff_required
def forecast():
    if not is_ai_feature_enabled('ai_forecasting'):
        return jsonify({'error': 'AI Forecasting is disabled. Enable it in Settings.'}), 403
    category_id = request.args.get('category_id', type=int)
    product_id = request.args.get('product_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    result = get_forecasts(
        category_id=category_id,
        product_id=product_id,
        date_from=date_from,
        date_to=date_to,
    )
    return jsonify(result), 200
