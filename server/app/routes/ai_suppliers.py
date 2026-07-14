from flask import Blueprint, jsonify, request
from app.middleware.auth import staff_required
from app.services.supplier_intel_engine import get_supplier_intelligence
from app.routes.settings import is_ai_feature_enabled

supplier_intel_bp = Blueprint('ai_suppliers', __name__)


@supplier_intel_bp.route('/suppliers-intel', methods=['GET'])
@staff_required
def supplier_intel():
    if not is_ai_feature_enabled('ai_supplier_intel'):
        return jsonify({'error': 'AI Supplier Intelligence is disabled. Enable it in Settings.'}), 403
    supplier_id = request.args.get('supplier_id', type=int)
    category_id = request.args.get('category_id', type=int)
    product_id = request.args.get('product_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    performance_level = request.args.get('performance_level')

    result = get_supplier_intelligence(
        supplier_id=supplier_id, category_id=category_id, product_id=product_id,
        date_from=date_from, date_to=date_to, performance_level=performance_level,
    )
    return jsonify(result), 200
