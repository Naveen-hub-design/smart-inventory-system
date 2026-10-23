from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);",
        "CREATE INDEX IF NOT EXISTS idx_purchases_status_date ON purchases(status, purchase_date);",
        "CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);",
        "CREATE INDEX IF NOT EXISTS idx_purchase_items_variant_id ON purchase_items(variant_id);",
        "CREATE INDEX IF NOT EXISTS idx_sale_items_variant_id ON sale_items(variant_id);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);",
        "CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);"
    ]
    
    print("Creating indexes...")
    for idx in indexes:
        try:
            db.session.execute(text(idx))
            print(f"Executed: {idx}")
        except Exception as e:
            print(f"Error executing {idx}: {e}")
            db.session.rollback()
            
    try:
        db.session.commit()
        print("All indexes committed successfully.")
    except Exception as e:
        print(f"Commit error: {e}")
