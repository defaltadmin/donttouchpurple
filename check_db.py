import sqlite3
conn = sqlite3.connect('website/odysseus/data/app.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = cursor.fetchall()
print("Tables:", tables)

for table in tables:
    table_name = table[0]
    cursor.execute(f'PRAGMA table_info({table_name})')
    columns = cursor.fetchall()
    print(f"\nTable: {table_name}")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")

conn.close()
