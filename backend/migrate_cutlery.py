import sqlite3

db = sqlite3.connect('backend/catering.db')
db.execute("PRAGMA foreign_keys = ON")

# 1. Create cutlery_master table
db.execute("""
CREATE TABLE IF NOT EXISTS cutlery_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Plates & Dinnerware',
    calculation_type TEXT DEFAULT 'PER_GUEST', -- PER_GUEST or FIXED
    default_ratio REAL DEFAULT 1.0, -- e.g. 1.05 plates per guest, or 10 chafing dishes fixed
    default_unit_cost REAL DEFAULT 0.0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

# 2. Create quotation_cutlery table
db.execute("""
CREATE TABLE IF NOT EXISTS quotation_cutlery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    cutlery_name TEXT NOT NULL,
    category TEXT DEFAULT 'Dinnerware',
    quantity REAL NOT NULL DEFAULT 1,
    unit_cost REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    is_included INTEGER DEFAULT 1, -- 1 = included in package, 0 = extra charge
    notes TEXT
)
""")

# 3. Seed default cutlery items for every tenant if not already present
tenants = db.execute("SELECT id FROM tenants").fetchall()
default_cutlery = [
    ("Porcelain Dinner Plates (Full)", "Plates & Dinnerware", "PER_GUEST", 1.05, 5.0),
    ("Quarter / Snack Plates", "Plates & Dinnerware", "PER_GUEST", 1.0, 3.5),
    ("Dessert Bowls (Katori)", "Plates & Dinnerware", "PER_GUEST", 1.0, 2.5),
    ("Stainless Steel Dinner Spoons", "Cutlery", "PER_GUEST", 1.1, 1.5),
    ("Stainless Steel Forks", "Cutlery", "PER_GUEST", 0.9, 1.5),
    ("Dessert Spoons", "Cutlery", "PER_GUEST", 1.0, 1.5),
    ("Water / Beverage Glass Tumblers", "Glassware", "PER_GUEST", 1.2, 2.0),
    ("Soup Bowls & Spoons", "Plates & Dinnerware", "PER_GUEST", 0.6, 3.0),
    ("Buffet Chafing Dishes (Roll Top)", "Buffet Equipment", "FIXED", 8.0, 150.0),
    ("Service Ladles & Tongs", "Buffet Equipment", "FIXED", 14.0, 25.0),
    ("Table Linen & Cloth Napkins", "Linen & Setup", "PER_GUEST", 1.0, 4.0),
]

for t in tenants:
    t_id = t[0]
    count = db.execute("SELECT COUNT(*) FROM cutlery_master WHERE tenant_id = ?", (t_id,)).fetchone()[0]
    if count == 0:
        for name, cat, calc_type, ratio, cost in default_cutlery:
            db.execute("""
                INSERT INTO cutlery_master (tenant_id, name, category, calculation_type, default_ratio, default_unit_cost, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (t_id, name, cat, calc_type, ratio, cost))
        print(f"Seeded default cutlery items for tenant {t_id}")

db.commit()
print("Cutlery migration successfully completed!")
