import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "catering.db"

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 0. Multi-Tenant Table: tenants
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        tagline TEXT,
        logo_path TEXT,
        phone1 TEXT,
        phone2 TEXT,
        email TEXT,
        location1 TEXT,
        location2 TEXT,
        website TEXT,
        gst_number TEXT,
        quotation_prefix TEXT DEFAULT 'QT-',
        default_terms TEXT,
        currency_symbol TEXT DEFAULT '₹',
        date_format TEXT DEFAULT 'DD/MM/YYYY',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 1. Users & Roles (tenant_id is NULL for SUPER_ADMIN)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL, -- SUPER_ADMIN, ADMIN, MANAGER, SALESPERSON, KITCHEN, ACCOUNTS
        max_discount_pct REAL DEFAULT 5.0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 2. Clients
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        company TEXT,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        gst_number TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 3. Events
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL, -- Wedding, Engagement, Reception, Birthday, Corporate, etc.
        event_date TEXT NOT NULL,
        event_time TEXT,
        venue TEXT NOT NULL,
        venue_address TEXT,
        guest_count INTEGER NOT NULL DEFAULT 500,
        status TEXT DEFAULT 'PLANNING', -- PLANNING, CONFIRMED, COMPLETED, CANCELLED
        special_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 4. Categories
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
    );
    ''')

    # 5. Menu Items
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        service_type TEXT DEFAULT 'STANDARD', -- STANDARD, LIVE_COUNTER, STATION, SPECIAL
        pricing_unit TEXT DEFAULT 'PER_PERSON', -- PER_PERSON, PER_PLATE, PER_KG, PER_LITRE, PER_PIECE, PER_EVENT, FIXED_QUANTITY
        selling_price REAL, -- Configurable from Admin
        food_cost REAL,
        labour_cost REAL,
        packaging_cost REAL,
        overhead_cost REAL,
        is_demo_price INTEGER DEFAULT 0,
        is_seasonal INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 6. Price History
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        old_price REAL,
        new_price REAL,
        changed_by TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 7. Packages
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        default_price REAL,
        pricing_unit TEXT DEFAULT 'PER_PERSON',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 8. Package Items
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS package_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        UNIQUE(package_id, menu_item_id)
    );
    ''')

    # 9. Addons
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS addons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        service_type TEXT DEFAULT 'STATION',
        selling_price REAL NOT NULL,
        pricing_unit TEXT DEFAULT 'PER_EVENT',
        internal_cost REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1
    );
    ''')

    # 10. Ingredients Master
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Spices & Groceries', -- Meat & Poultry, Seafood, Fresh Vegetables, Dairy & Oils, Spices & Groceries, Packaging & Disposables
        unit TEXT NOT NULL, -- kg, g, litre, ml, piece, packet, box, can
        purchase_price REAL NOT NULL,
        wastage_pct REAL DEFAULT 5.0,
        effective_cost REAL,
        supplier TEXT,
        status TEXT DEFAULT 'ACTIVE',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 11. Recipes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        menu_item_id INTEGER UNIQUE REFERENCES menu_items(id) ON DELETE CASCADE,
        portion_yield INTEGER DEFAULT 100, -- e.g. batch yield per 100 portions
        instructions TEXT,
        prep_time_mins INTEGER DEFAULT 60,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 12. Recipe Ingredients
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        notes TEXT,
        UNIQUE(recipe_id, ingredient_id)
    );
    ''')

    # 13. Labour Types & Staffing Rules
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS labour_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        daily_wage REAL NOT NULL,
        hourly_wage REAL,
        working_hours REAL DEFAULT 8.0,
        staff_ratio_guests INTEGER,
        calculation_method TEXT DEFAULT 'PER_DAY',
        status TEXT DEFAULT 'ACTIVE'
    );
    ''')

    # 14. Packaging Items
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS packaging_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        unit_cost REAL NOT NULL,
        unit TEXT DEFAULT 'piece',
        default_qty_per_guest REAL DEFAULT 1.0,
        calculation_method TEXT DEFAULT 'PER_GUEST',
        status TEXT DEFAULT 'ACTIVE'
    );
    ''')

    # 15. Overhead Rules
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS overhead_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        calculation_type TEXT NOT NULL,
        value REAL NOT NULL,
        status TEXT DEFAULT 'ACTIVE'
    );
    ''')

    # 16. Profit & Margin Rules
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS profit_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        rule_type TEXT DEFAULT 'TARGET_MARGIN_PCT',
        target_pct REAL DEFAULT 30.0,
        is_active INTEGER DEFAULT 1
    );
    ''')

    # 17. Tax Rules
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tax_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        tax_percentage REAL NOT NULL DEFAULT 5.0,
        is_inclusive INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
    );
    ''')

    # 18. Quotations
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        quotation_number TEXT UNIQUE NOT NULL,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 19. Quotation Items
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS quotation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
        item_name_snapshot TEXT NOT NULL,
        category_snapshot TEXT,
        service_type_snapshot TEXT DEFAULT 'STANDARD',
        pricing_unit_snapshot TEXT DEFAULT 'PER_PERSON',
        selling_price_snapshot REAL NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        line_total REAL NOT NULL
    );
    ''')

    # 20. Quotation Addons
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS quotation_addons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
        addon_id INTEGER REFERENCES addons(id) ON DELETE SET NULL,
        name_snapshot TEXT NOT NULL,
        pricing_unit_snapshot TEXT DEFAULT 'PER_EVENT',
        selling_price_snapshot REAL NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        line_total REAL NOT NULL
    );
    ''')

    # 21. Event Procurement / Purchase Lists (saved checklists)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS event_purchase_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
        total_estimated_cost REAL DEFAULT 0,
        status TEXT DEFAULT 'PENDING', -- PENDING, PARTIALLY_PURCHASED, COMPLETED
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS event_purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_list_id INTEGER REFERENCES event_purchase_lists(id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE SET NULL,
        ingredient_name TEXT NOT NULL,
        category TEXT DEFAULT 'Spices & Groceries',
        quantity_required REAL NOT NULL,
        quantity_purchased REAL DEFAULT 0,
        unit TEXT NOT NULL,
        unit_price REAL DEFAULT 0,
        total_price REAL DEFAULT 0,
        supplier TEXT,
        is_purchased INTEGER DEFAULT 0,
        notes TEXT
    );
    ''')

    # 22. Company Settings (Fallback / active tenant profile)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS company_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        company_name TEXT DEFAULT 'Royal Feast Catering',
        tagline TEXT DEFAULT 'PREMIUM BANQUET & WEDDING CATERING',
        phone1 TEXT DEFAULT '+91 98765 43210',
        phone2 TEXT DEFAULT '+91 98765 43211',
        email TEXT DEFAULT 'contact@royalfeast.com',
        location1 TEXT DEFAULT 'City Center',
        location2 TEXT DEFAULT 'Metro Plaza',
        website TEXT DEFAULT 'www.royalfeastcatering.com',
        gst_number TEXT DEFAULT '32AAECB9876F1Z5',
        quotation_prefix TEXT DEFAULT 'QT-2026-',
        default_terms TEXT DEFAULT '1. 50% advance upon booking confirmation, balance prior to event.\n2. Final guest count must be re-confirmed at least 3 business days prior.\n3. Seasonal items subject to availability.',
        currency_symbol TEXT DEFAULT '₹',
        date_format TEXT DEFAULT 'DD/MM/YYYY',
        logo_path TEXT DEFAULT '/images/default-catering-logo.png',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
