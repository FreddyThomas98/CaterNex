import sqlite3
import hashlib
from pathlib import Path

DB_PATH = Path("C:/Users/Admin/.gemini/antigravity-ide/scratch/b-and-co-catering/backend/catering.db")

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = OFF;")

    # 1. Create tenants table
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

    # 2. Check if default tenant exists, if not insert generic tenant
    tenant = cursor.execute("SELECT id FROM tenants WHERE id = 1").fetchone()
    if not tenant:
        cursor.execute('''
        INSERT INTO tenants (
            id, name, slug, tagline, logo_path, phone1, phone2, email,
            location1, location2, website, gst_number, quotation_prefix,
            default_terms, currency_symbol, date_format, is_active
        ) VALUES (
            1,
            'Royal Feast Catering',
            'royal-feast',
            'Premium Banquet & Event Catering Services',
            '/images/default-catering-logo.png',
            '+91 98765 43210',
            '+91 98765 43211',
            'contact@royalfeast.com',
            'Central Avenue, City Center',
            'Metro Station Road',
            'www.royalfeastcatering.com',
            '32AAECB9876F1Z5',
            'RF-2026-',
            '1. 50% advance upon booking confirmation, balance prior to event.\n2. Final guest count must be re-confirmed at least 3 business days prior to the event.\n3. Seasonal items subject to market availability.',
            '₹',
            'DD/MM/YYYY',
            1
        );
        ''')
        print("Created default tenant 1: Royal Feast Catering")

    # 3. Add tenant_id column to existing tables if missing
    tables_to_migrate = [
        "users", "categories", "menu_items", "price_history", "packages",
        "addons", "ingredients", "recipes", "labour_types", "packaging_items",
        "overhead_rules", "profit_rules", "tax_rules", "clients", "events", "quotations"
    ]

    for table in tables_to_migrate:
        # Check columns
        cursor.execute(f"PRAGMA table_info({table});")
        columns = [col[1] for col in cursor.fetchall()]
        if "tenant_id" not in columns:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);")
                print(f"Added tenant_id to {table}")
            except Exception as e:
                print(f"Error adding tenant_id to {table}: {e}")
        # Update existing records to tenant_id = 1
        cursor.execute(f"UPDATE {table} SET tenant_id = 1 WHERE tenant_id IS NULL;")

    # 4. Add category column to ingredients if missing
    cursor.execute("PRAGMA table_info(ingredients);")
    ing_cols = [col[1] for col in cursor.fetchall()]
    if "category" not in ing_cols:
        cursor.execute("ALTER TABLE ingredients ADD COLUMN category TEXT DEFAULT 'Spices & Groceries';")
        print("Added category column to ingredients")

    # Update ingredient categories with realistic classifications
    cursor.execute("UPDATE ingredients SET category = 'Meat & Poultry' WHERE name LIKE '%Mutton%' OR name LIKE '%Chicken%' OR name LIKE '%Duck%' OR name LIKE '%Beef%';")
    cursor.execute("UPDATE ingredients SET category = 'Seafood' WHERE name LIKE '%Fish%' OR name LIKE '%Prawns%' OR name LIKE '%Crab%';")
    cursor.execute("UPDATE ingredients SET category = 'Fresh Vegetables' WHERE name LIKE '%Onion%' OR name LIKE '%Mango%' OR name LIKE '%Mint%' OR name LIKE '%Ginger%' OR name LIKE '%Garlic%';")
    cursor.execute("UPDATE ingredients SET category = 'Dairy & Oils' WHERE name LIKE '%Ghee%' OR name LIKE '%Oil%' OR name LIKE '%Curd%' OR name LIKE '%Milk%' OR name LIKE '%Cheese%';")
    cursor.execute("UPDATE ingredients SET category = 'Spices & Groceries' WHERE category IS NULL OR category = 'Spices & Groceries';")

    # 5. Add Super Admin user
    super_admin = cursor.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN'").fetchone()
    if not super_admin:
        cursor.execute('''
        INSERT INTO users (email, password_hash, full_name, role, max_discount_pct, is_active, tenant_id)
        VALUES (?, ?, ?, 'SUPER_ADMIN', 100.0, 1, NULL)
        ''', ('superadmin@cateringos.com', hash_pw('admin123'), 'Platform Super Admin'))
        print("Created Super Admin: superadmin@cateringos.com")

    # Ensure admin user for tenant 1
    t1_admin = cursor.execute("SELECT id FROM users WHERE tenant_id = 1 AND role = 'ADMIN'").fetchone()
    if not t1_admin:
        cursor.execute('''
        INSERT INTO users (email, password_hash, full_name, role, max_discount_pct, is_active, tenant_id)
        VALUES (?, ?, ?, 'ADMIN', 100.0, 1, 1)
        ''', ('admin@royalfeast.com', hash_pw('admin123'), 'Royal Feast Admin'))
        print("Created Tenant 1 Admin: admin@royalfeast.com")
    else:
        # Update existing admin to generic name
        cursor.execute("UPDATE users SET full_name = 'Catering Business Admin' WHERE id = ? AND full_name LIKE '%B & Co%'", (t1_admin[0],))

    # 6. Update company_settings table to remove B & Co defaults
    cursor.execute('''
    UPDATE company_settings SET
        company_name = 'Royal Feast Catering',
        tagline = 'PREMIUM BANQUET & WEDDING CATERING',
        phone1 = '+91 98765 43210',
        phone2 = '+91 98765 43211',
        email = 'contact@royalfeast.com',
        location1 = 'City Center',
        location2 = 'Metro Plaza',
        website = 'www.royalfeastcatering.com',
        gst_number = '32AAECB9876F1Z5',
        quotation_prefix = 'RF-2026-',
        logo_path = '/images/default-catering-logo.png'
    WHERE id = 1;
    ''')

    # 7. Check / Seed Sample Recipes for menu items
    existing_recipes = cursor.execute("SELECT count(*) FROM recipes").fetchone()[0]
    if existing_recipes == 0:
        print("Seeding sample dish recipes...")
        # Get ingredients
        ing_rows = cursor.execute("SELECT id, name, unit FROM ingredients").fetchall()
        ing_dict = {r[1]: (r[0], r[2]) for r in ing_rows}

        # Get menu items
        menu_rows = cursor.execute("SELECT id, name FROM menu_items").fetchall()
        menu_dict = {r[1]: r[0] for r in menu_rows}

        # Define recipes (per 100 pax)
        recipes_spec = [
            {
                "dish": "Mutton Biriyani (with raita, pickle and pappad)",
                "portion_yield": 100,
                "instructions": "Marinate mutton with spices and yogurt. Layer parboiled Kaima rice with mutton gravy, pure ghee, fried onions, and mint. Dum cook for 45 mins.",
                "ingredients": [
                    ("Bone-in Tender Mutton", 20.0, "kg"),
                    ("Jeerakasala / Kaima Rice", 15.0, "kg"),
                    ("Pure Cow Ghee", 2.5, "litre"),
                    ("Refined Cooking Oil", 2.0, "litre"),
                    ("Onions & Shallots", 8.0, "kg"),
                    ("Ginger & Garlic Paste", 2.0, "kg"),
                    ("Kerala Whole Garam Spices", 0.5, "kg"),
                    ("Fresh Mint & Coriander", 1.5, "kg"),
                    ("Thick Curd / Yogurt", 3.0, "kg"),
                ]
            },
            {
                "dish": "Duck Mappas / Roast / Pepper / Kuttanadan",
                "portion_yield": 100,
                "instructions": "Slow cook Kuttanadan country duck with roasted spices, shallots, and thick coconut milk gravy until tender and fragrant.",
                "ingredients": [
                    ("Kuttanadan Country Duck", 18.0, "kg"),
                    ("Onions & Shallots", 6.0, "kg"),
                    ("Ginger & Garlic Paste", 1.5, "kg"),
                    ("Refined Cooking Oil", 2.0, "litre"),
                    ("Pure Cow Ghee", 0.8, "litre"),
                    ("Kerala Whole Garam Spices", 0.4, "kg"),
                    ("Fresh Mint & Coriander", 0.8, "kg"),
                ]
            },
            {
                "dish": "Fish Tawa Fry (King Fish)",
                "portion_yield": 100,
                "instructions": "Marinate King Fish steaks with Kashmiri chili, turmeric, ginger garlic paste, and lemon juice. Shallow fry on heavy cast iron tawa.",
                "ingredients": [
                    ("King Fish (Neymeen)", 14.0, "kg"),
                    ("Ginger & Garlic Paste", 1.2, "kg"),
                    ("Refined Cooking Oil", 3.0, "litre"),
                    ("Fresh Mint & Coriander", 0.5, "kg"),
                ]
            },
            {
                "dish": "Passion Fruit Mojito",
                "portion_yield": 100,
                "instructions": "Muddle fresh passion fruit pulp with crushed mint leaves, lime slices, and sugar syrup. Top with chilled club soda and crushed ice.",
                "ingredients": [
                    ("Fresh Passion Fruit & Mint", 5.0, "kg"),
                    ("Fresh Mint & Coriander", 0.8, "kg"),
                ]
            },
            {
                "dish": "Kunaffa",
                "portion_yield": 100,
                "instructions": "Crisp kataifi pastry layered with sweet melted cheese and cream, baked until golden, soaked with rose-cardamom sugar syrup and crushed pistachios.",
                "ingredients": [
                    ("Kataifi Pastry & Cheese for Kunaffa", 10.0, "kg"),
                    ("Pure Cow Ghee", 2.0, "litre"),
                ]
            }
        ]

        for spec in recipes_spec:
            dish_name = spec["dish"]
            menu_id = menu_dict.get(dish_name)
            if not menu_id:
                # Try partial match
                for name, mid in menu_dict.items():
                    if dish_name.split()[0].lower() in name.lower() and dish_name.split()[1].lower() in name.lower():
                        menu_id = mid
                        break
            if menu_id:
                cursor.execute('''
                INSERT INTO recipes (tenant_id, menu_item_id, portion_yield, instructions)
                VALUES (1, ?, ?, ?)
                ''', (menu_id, spec["portion_yield"], spec["instructions"]))
                recipe_id = cursor.lastrowid
                for ing_name, qty, unit in spec["ingredients"]:
                    ing_info = ing_dict.get(ing_name)
                    if ing_info:
                        ing_id = ing_info[0]
                        cursor.execute('''
                        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
                        VALUES (?, ?, ?, ?)
                        ''', (recipe_id, ing_id, qty, unit))
                print(f"Created recipe for '{dish_name}' with {len(spec['ingredients'])} ingredients")

    conn.commit()
    cursor.execute("PRAGMA foreign_keys = ON;")
    conn.close()
    print("Database migration completed successfully!")

if __name__ == "__main__":
    migrate()
