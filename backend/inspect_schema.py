import sqlite3

db = sqlite3.connect('backend/catering.db')
for r in db.execute("SELECT name, sql FROM sqlite_master WHERE type='table'").fetchall():
    if r[1] and 'UNIQUE' in r[1].upper():
        print(f"Table: {r[0]}")
        print(r[1])
        print("-" * 50)
