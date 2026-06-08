import sqlite3
import json

conn = sqlite3.connect('website/odysseus/data/app.db')
cursor = conn.cursor()
cursor.execute('SELECT id, name, base_url, hidden_models, cached_models FROM model_endpoints')
rows = cursor.fetchall()

for row in rows:
    eid, name, url, hidden, cached = row
    hidden_list = json.loads(hidden) if hidden else []
    cached_list = json.loads(cached) if cached else []
    print(f"Endpoint: {name} (ID: {eid})")
    print(f"  URL: {url}")
    print(f"  Total cached models: {len(cached_list)}")
    print(f"  Hidden models: {len(hidden_list)}")
    if cached_list:
        print(f"  Samples: {cached_list[:3]}")

conn.close()
