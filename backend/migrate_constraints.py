import sqlite3

db = sqlite3.connect('backend/catering.db')
db.execute("PRAGMA foreign_keys = OFF")

# 1. Fix categories table
print("Migrating categories table...")
db.execute("""
CREATE TABLE categories_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    UNIQUE(tenant_id, name)
)
""")

db.execute("""
INSERT INTO categories_new (id, tenant_id, name, description, display_order, is_active)
SELECT id, tenant_id, name, description, display_order, is_active FROM categories
""")

db.execute("DROP TABLE categories")
db.execute("ALTER TABLE categories_new RENAME TO categories")

# 2. Fix quotations table
print("Migrating quotations table...")
db.execute("""
CREATE TABLE quotations_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER REFERENCES tenants(id),
    quotation_number TEXT NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE RESTRICT,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    guest_count INTEGER NOT NULL DEFAULT 500,
    subtotal REAL NOT NULL DEFAULT 0,
    discount_type TEXT DEFAULT 'PERCENTAGE',
    discount_value REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_percentage REAL DEFAULT 5.0,
    tax_amount REAL DEFAULT 0,
    grand_total REAL NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'DRAFT',
    terms_and_conditions TEXT,
    special_notes TEXT,
    created_by TEXT DEFAULT 'Salesperson',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, quotation_number)
)
""")

db.execute("""
INSERT INTO quotations_new (
    id, tenant_id, quotation_number, client_id, event_id, guest_count,
    subtotal, discount_type, discount_value, discount_amount, tax_percentage,
    tax_amount, grand_total, status, terms_and_conditions, special_notes,
    created_by, created_at, updated_at
)
SELECT 
    id, tenant_id, quotation_number, client_id, event_id, guest_count,
    subtotal, discount_type, discount_value, discount_amount, tax_percentage,
    tax_amount, grand_total, status, terms_and_conditions, special_notes,
    created_by, created_at, updated_at
FROM quotations
""")

db.execute("DROP TABLE quotations")
db.execute("ALTER TABLE quotations_new RENAME TO quotations")

db.execute("PRAGMA foreign_keys = ON")
db.commit()
print("Migration completed successfully!")
