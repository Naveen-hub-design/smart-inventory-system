import time
import json
from app import create_app, db
from app.services.reorder_engine import get_recommendations
from sqlalchemy import event
from sqlalchemy.engine import Engine

app = create_app()

query_count = 0
@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    global query_count
    query_count += 1

with app.app_context():
    # Warmup
    get_recommendations()
    
    query_count = 0
    t0 = time.perf_counter()
    res = get_recommendations()
    t1 = time.perf_counter()
    
    print(f"Total time: {(t1-t0)*1000:.2f} ms")
    print(f"Total queries: {query_count}")
    print(json.dumps(res['_stage_timings'], indent=2))
