import time
import json
from app import create_app
from app.services.reorder_engine import get_recommendations

app = create_app()
with app.app_context():
    res = get_recommendations()
    print(json.dumps(res['_stage_timings'], indent=2))
