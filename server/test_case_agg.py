import time
from app import create_app, db
from app.models.sale import Sale, SaleItem
from sqlalchemy import func, case
from datetime import datetime, timedelta

app = create_app()
with app.app_context():
    now = datetime.utcnow()
    lookback_date = now - timedelta(days=90)
    midpoint = lookback_date + (now - lookback_date) / 2

    # WARMUP
    db.session.query(SaleItem.id).first()

    t0 = time.perf_counter()
    rows = db.session.query(
        SaleItem.variant_id,
        func.sum(case((Sale.sale_date < midpoint, SaleItem.quantity), else_=0)).label('older_qty'),
        func.sum(case((Sale.sale_date >= midpoint, SaleItem.quantity), else_=0)).label('recent_qty')
    ).join(Sale).filter(
        SaleItem.variant_id.isnot(None),
        Sale.status == 'completed',
        Sale.sale_date >= lookback_date,
        Sale.sale_date <= now
    ).group_by(SaleItem.variant_id).all()
    t1 = time.perf_counter()
    
    print(f"Single Query Time: {(t1-t0)*1000:.2f} ms")
    print(f"Returned {len(rows)} rows.")
