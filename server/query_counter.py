from app import create_app, db
from sqlalchemy import event
from sqlalchemy.engine import Engine
import time

app = create_app()

query_count = 0

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    global query_count
    query_count += 1

def measure_function(name, func, *args, **kwargs):
    global query_count
    query_count = 0
    start = time.time()
    func(*args, **kwargs)
    duration = time.time() - start
    print(f"| {name} | {duration:.3f}s | {query_count} queries |")

with app.app_context():
    from app.services.forecast_engine import get_forecasts
    from app.services.health_engine import get_health
    from app.services.reorder_engine import generate_reorder_recommendations
    
    print("--- QUERY COUNT BENCHMARK ---")
    measure_function("Forecast AI", get_forecasts)
    measure_function("Health AI", get_health)
    measure_function("Reorder AI", generate_reorder_recommendations)
