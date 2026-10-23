from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    query = """
    SELECT indexname, tablename, indexdef 
    FROM pg_indexes 
    WHERE tablename IN ('purchases','purchase_items','sale_items','audit_logs','suppliers','notifications') 
    AND indexname NOT LIKE '%_pkey' 
    ORDER BY tablename, indexname;
    """
    result = db.session.execute(text(query)).fetchall()
    print("--- Database Indexes ---")
    for r in result:
        print(f"Table: {r[1]}, Index: {r[0]}")
