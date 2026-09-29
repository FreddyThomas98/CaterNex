import sqlite3
import hashlib
from pathlib import Path
from database import DB_PATH, init_db

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def seed_database():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Clear existing data
    cursor.execute("DELETE FROM quotation_addons")
    cursor.execute("DELETE FROM quotation_items")
    cursor.execute("DELETE FROM quotations")
    cursor.execute("DELETE FROM recipe_ingredients")
    cursor.execute("DELETE FROM recipes")
    cursor.execute("DELETE FROM ingredients")
    cursor.execute("DELETE FROM package_items")
    cursor.execute("DELETE FROM packages")
    cursor.execute("DELETE FROM addons")
    cursor.execute("DELETE FROM menu_items")
    cursor.execute("DELETE FROM categories")
    cursor.execute("DELETE FROM labour_types")
    cursor.execute("DELETE FROM packaging_items")
    cursor.execute("DELETE FROM overhead_rules")
    cursor.execute("DELETE FROM profit_rules")
    cursor.execute("DELETE FROM tax_rules")
    cursor.execute("DELETE FROM events")
    cursor.execute("DELETE FROM clients")
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM company_settings")

    # 1. Company Settings
    cursor.execute('''
    INSERT INTO company_settings (
        id, company_name, tagline, phone1, phone2, email, location1, location2,
        website, gst_number, quotation_prefix, default_terms, currency_symbol, date_format, logo_path
    ) VALUES (
        1,
        'B & Co',
        'WEDDING EVENTS AND CATERS',
        '+91 790 725 4973',
        '+91 9072 400 824',
        'events@bandco.com',
        'Sasthamcotta, Kollam',
        'Trivandrum, Kerala',
        'www.bandcoevents.com',
        '32AAECB1234F1Z9',
        'QT-2026-',
        'Seasonal items like specific fish, fruits are subjected to their availability.',
        '₹',
        'DD/MM/YYYY',
        '/assets/logo.jpg'
    )
    ''')

    # 2. Users & Roles
    users_data = [
        ('admin@bandco.com', hash_pw('admin123'), 'B & Co Admin', 'ADMIN', 100.0),
        ('manager@bandco.com', hash_pw('manager123'), 'Sujith Kumar', 'MANAGER', 15.0),
        ('sales@bandco.com', hash_pw('sales123'), 'Ananya Nair', 'SALESPERSON', 5.0),
        ('kitchen@bandco.com', hash_pw('kitchen123'), 'Chef Mohanraj Pillai', 'KITCHEN', 0.0),
        ('accounts@bandco.com', hash_pw('accounts123'), 'Deepa Krishnan', 'ACCOUNTS', 0.0),
    ]
    cursor.executemany('''
    INSERT INTO users (email, password_hash, full_name, role, max_discount_pct)
    VALUES (?, ?, ?, ?, ?)
    ''', users_data)

    # 3. Categories matching the brochure exactly
    categories_data = [
        ('Cold Beverages', 'Welcome cold refreshments from brochure', 1),
        ('Snacks', 'Starters from brochure', 2),
        ('Soup', 'Starter course soups from brochure', 3),
        ('First Course', 'Breads, roasts, and duck specialities from brochure', 4),
        ('Salads', 'Fresh salads from brochure', 5),
        ('Main Course', 'Biriyani, tawa fry, and meats from brochure', 6),
        ('Vegetarian Options', 'Vegetarian choices from brochure', 7),
        ('Desserts', 'Desserts from brochure', 8),
        ('Hot Beverages', 'Tea and coffee selections from brochure', 9),
        ('For Beverages', 'Kilogram bulk and special accompaniments from brochure', 10)
    ]
    cursor.executemany('''
    INSERT INTO categories (name, description, display_order)
    VALUES (?, ?, ?)
    ''', categories_data)

    cat_map = {}
    for row in cursor.execute("SELECT id, name FROM categories").fetchall():
        cat_map[row[1]] = row[0]

    # 4. ONLY items from the B & Co brochure (is_demo_price = 0)
    items_data = [
        # Cold beverages
        (cat_map['Cold Beverages'], 'Passion Fruit Mojito', '', 'STANDARD', 'PER_PERSON', 45.0, 0, 0, 1),
        (cat_map['Cold Beverages'], 'Lemon Juice', '', 'LIVE_COUNTER', 'PER_PERSON', 35.0, 0, 0, 2),
        (cat_map['Cold Beverages'], 'Pineapple Juice', '', 'LIVE_COUNTER', 'PER_PERSON', 40.0, 0, 0, 3),
        (cat_map['Cold Beverages'], 'Grape Crush', '', 'STANDARD', 'PER_PERSON', 40.0, 0, 0, 4),
        (cat_map['Cold Beverages'], 'Water Melon Juice', '', 'STANDARD', 'PER_PERSON', 35.0, 0, 0, 5),

        # Snacks
        (cat_map['Snacks'], 'Chicken Momos', '', 'STANDARD', 'PER_PERSON', 45.0, 0, 0, 1),
        (cat_map['Snacks'], 'Chicken Nuggets', '', 'STANDARD', 'PER_PERSON', 40.0, 0, 0, 2),
        (cat_map['Snacks'], 'Samosa', '', 'LIVE_COUNTER', 'PER_PERSON', 30.0, 0, 0, 3),
        (cat_map['Snacks'], 'Pazhampori', '', 'LIVE_COUNTER', 'PER_PERSON', 30.0, 0, 0, 4),

        # Soup
        (cat_map['Soup'], 'Mutton Soup', '', 'STANDARD', 'PER_PERSON', 55.0, 0, 0, 1),
        (cat_map['Soup'], 'Cream of Mushroom', '', 'STANDARD', 'PER_PERSON', 45.0, 0, 0, 2),

        # First Course
        (cat_map['First Course'], 'Croissant / Breads', '', 'STANDARD', 'PER_PERSON', 35.0, 0, 0, 1),
        (cat_map['First Course'], 'Palappam', '', 'LIVE_COUNTER', 'PER_PERSON', 25.0, 0, 0, 2),
        (cat_map['First Course'], 'Nool Porotta', '', 'LIVE_COUNTER', 'PER_PERSON', 30.0, 0, 0, 3),
        (cat_map['First Course'], 'Rumali Roti', '', 'STANDARD', 'PER_PERSON', 25.0, 0, 0, 4),
        (cat_map['First Course'], 'Duck Mappas / Roast / Pepper / Kuttanadan', '', 'STANDARD', 'PER_PERSON', 85.0, 0, 0, 5),

        # Salads
        (cat_map['Salads'], 'Raw Mango Salad', '', 'STANDARD', 'PER_PERSON', 25.0, 0, 0, 1),
        (cat_map['Salads'], 'Irani Salad', '', 'STANDARD', 'PER_PERSON', 25.0, 0, 0, 2),
        (cat_map['Salads'], 'Veg & Fruit Mix Salad', '', 'STANDARD', 'PER_PERSON', 30.0, 0, 0, 3),
        (cat_map['Salads'], 'Italian Chopped Salad', '', 'STANDARD', 'PER_PERSON', 35.0, 0, 0, 4),
        (cat_map['Salads'], 'Smashed Chicken Salad', '', 'STANDARD', 'PER_PERSON', 45.0, 0, 0, 5),
        (cat_map['Salads'], 'Egg White Green Salad', '', 'STANDARD', 'PER_PERSON', 30.0, 0, 0, 6),

        # Main Course
        (cat_map['Main Course'], 'Mutton Biriyani (with raita, pickle and pappad)', '', 'STANDARD', 'PER_PERSON', 175.0, 0, 0, 1),
        (cat_map['Main Course'], 'Fish Tawa Fry (King Fish)', '', 'LIVE_COUNTER', 'PER_PERSON', 110.0, 0, 1, 2),
        (cat_map['Main Course'], 'Prawns Tawa Fry', '', 'LIVE_COUNTER', 'PER_PERSON', 120.0, 0, 1, 3),
        (cat_map['Main Course'], 'Squid Tawa (Roll)', '', 'LIVE_COUNTER', 'PER_PERSON', 95.0, 0, 1, 4),
        (cat_map['Main Course'], 'Variety of Chicken Kebab (Tikka, Hariyali, Malai)', '', 'LIVE_COUNTER', 'PER_PERSON', 80.0, 0, 0, 5),
        (cat_map['Main Course'], 'Beef Tengakothu Ularthu', '', 'STANDARD', 'PER_PERSON', 75.0, 0, 0, 6),
        (cat_map['Main Course'], 'Chicken (Chilly / Hyderabadi / Masala)', '', 'STANDARD', 'PER_PERSON', 65.0, 0, 0, 7),

        # Vegetarian Options
        (cat_map['Vegetarian Options'], 'Veg Pulao / Ghee Rice', '', 'STANDARD', 'PER_PERSON', 45.0, 0, 0, 1),
        (cat_map['Vegetarian Options'], 'Paneer Butter Masala', '', 'STANDARD', 'PER_PERSON', 55.0, 0, 0, 2),

        # Desserts
        (cat_map['Desserts'], 'Cheese Cake', '', 'STANDARD', 'PER_PERSON', 55.0, 0, 0, 1),
        (cat_map['Desserts'], 'Carrot Halwa', '', 'STANDARD', 'PER_PERSON', 35.0, 0, 0, 2),
        (cat_map['Desserts'], 'Puddings', '', 'STANDARD', 'PER_PERSON', 35.0, 0, 0, 3),
        (cat_map['Desserts'], 'Brownies', '', 'STANDARD', 'PER_PERSON', 45.0, 0, 0, 4),
        (cat_map['Desserts'], 'Ice Creams', '', 'STANDARD', 'PER_PERSON', 30.0, 0, 0, 5),
        (cat_map['Desserts'], 'Kunaffa', '', 'LIVE_COUNTER', 'PER_PERSON', 65.0, 0, 0, 6),

        # Hot Beverages
        (cat_map['Hot Beverages'], 'Herbal Tea (Lemon / Mint / Ginger)', '', 'LIVE_COUNTER', 'PER_PERSON', 20.0, 0, 0, 1),
        (cat_map['Hot Beverages'], 'Tea, Coffee', '', 'STANDARD', 'PER_PERSON', 20.0, 0, 0, 2),

        # For Beverages
        (cat_map['For Beverages'], '15 kg Beef Pepper Fry', 'Accompaniment for beverages', 'SPECIAL', 'PER_KG', 650.0, 0, 0, 1),
        (cat_map['For Beverages'], '10 kg Chicken 65', 'Accompaniment for beverages', 'SPECIAL', 'PER_KG', 520.0, 0, 0, 2),
        (cat_map['For Beverages'], 'Varieties of 2 Salad', 'Accompaniment for beverages', 'SPECIAL', 'PER_EVENT', 4500.0, 0, 0, 3),
    ]

    cursor.executemany('''
    INSERT INTO menu_items (
        category_id, name, description, service_type, pricing_unit, selling_price, is_demo_price, is_seasonal, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', items_data)

    # 5. Client & Event from brochure
    cursor.execute('''
    INSERT INTO clients (name, company, phone, email, address, notes)
    VALUES (
        'Dr Liya Zara Saji',
        '',
        '7736094757',
        'liya.zara@example.com',
        'Trivandrum',
        'Client from brochure'
    )
    ''')
    client_id = cursor.lastrowid

    cursor.execute('''
    INSERT INTO events (
        client_id, event_type, event_date, event_time, venue, venue_address, guest_count, status, special_notes
    ) VALUES (
        ?,
        'Engagement',
        '2026-12-28',
        '18:00',
        'CONTOUR Backwaters Convention Centre',
        'Changanasery',
        700,
        'CONFIRMED',
        'Serves 700 people'
    )
    ''', (client_id,))
    event_id = cursor.lastrowid

    # 6. Internal Costing Data
    ingredients_data = [
        ('Boneless Chicken', 'kg', 240.0, 5.0, 252.6, 'Kollam Poultry Hub'),
        ('Bone-in Tender Mutton', 'kg', 780.0, 8.0, 847.8, 'Trivandrum Halal Meat Co'),
        ('King Fish (Neymeen)', 'kg', 950.0, 10.0, 1055.5, 'Neendakara Coastal Harbor'),
        ('Tiger Prawns (Cleaned)', 'kg', 820.0, 12.0, 931.8, 'Kollam Sea Harvest'),
        ('Kuttanadan Country Duck', 'kg', 420.0, 8.0, 456.5, 'Alappuzha Farms'),
        ('Jeerakasala / Kaima Rice', 'kg', 115.0, 2.0, 117.3, 'Malabar Agro Mills'),
        ('Pure Cow Ghee', 'litre', 620.0, 1.0, 626.2, 'Milma Kerala'),
        ('Refined Cooking Oil', 'litre', 135.0, 1.0, 136.3, 'Fortune Foods'),
        ('Onions & Shallots', 'kg', 35.0, 6.0, 37.2, 'Marthandam Wholesale'),
        ('Ginger & Garlic Paste', 'kg', 160.0, 4.0, 166.6, 'Local Spice Market'),
        ('Kerala Whole Garam Spices', 'kg', 900.0, 2.0, 918.3, 'Kumily Spices'),
        ('Fresh Mint & Coriander', 'kg', 60.0, 10.0, 66.6, 'Green Leaf Vendors'),
        ('Thick Curd / Yogurt', 'kg', 70.0, 2.0, 71.4, 'Milma Kerala'),
        ('Kataifi Pastry & Cheese for Kunaffa', 'kg', 480.0, 3.0, 494.8, 'Arabian Gourmet Imports'),
        ('Fresh Passion Fruit & Mint', 'kg', 180.0, 15.0, 211.7, 'Wayanad Orchards'),
    ]
    cursor.executemany('''
    INSERT INTO ingredients (name, unit, purchase_price, wastage_pct, effective_cost, supplier)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', ingredients_data)

    labour_data = [
        ('Executive Head Chef', 2000.0, 250.0, 8.0, None, 'PER_DAY'),
        ('Sous Chef / Specialist Cook', 1400.0, 175.0, 8.0, None, 'PER_DAY'),
        ('Live Counter Chef (Tawa/Appam)', 1200.0, 150.0, 8.0, None, 'PER_DAY'),
        ('Uniformed Banquet Server', 700.0, 90.0, 8.0, 25, 'PER_GUEST_RATIO'),
        ('Kitchen Helper / Dishwasher', 550.0, 70.0, 8.0, 50, 'PER_GUEST_RATIO'),
        ('Transport & Logistics Driver', 850.0, 100.0, 8.0, None, 'PER_DAY'),
    ]
    cursor.executemany('''
    INSERT INTO labour_types (title, daily_wage, hourly_wage, working_hours, staff_ratio_guests, calculation_method)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', labour_data)

    packaging_data = [
        ('Eco Banana Leaf Serving Liners & Plates', 4.5, 'piece', 1.0, 'PER_GUEST'),
        ('Heavy Duty Clear Dessert & Beverage Cups', 2.8, 'piece', 2.0, 'PER_GUEST'),
        ('Stainless Look Cutlery & Linen Feel Tissue', 3.2, 'set', 1.0, 'PER_GUEST'),
        ('Sealed Mineral Water Bottles (250ml)', 6.0, 'bottle', 1.5, 'PER_GUEST'),
        ('Thermal Food Transport Insulated Boxes', 450.0, 'box', 0.02, 'PER_EVENT')
    ]
    cursor.executemany('''
    INSERT INTO packaging_items (name, unit_cost, unit, default_qty_per_guest, calculation_method)
    VALUES (?, ?, ?, ?, ?)
    ''', packaging_data)

    overhead_data = [
        ('Refrigerated Transport & Venue Logistics', 'FIXED_PER_EVENT', 4500.0),
        ('Commercial Kitchen Gas & Utilities', 'PCT_OF_FOOD_COST', 6.0),
        ('Buffet Warmers & Table Linens Setup', 'FIXED_PER_EVENT', 3500.0),
        ('Supervision & Quality Assurance', 'PCT_OF_TOTAL', 4.0),
    ]
    cursor.executemany('''
    INSERT INTO overhead_rules (name, calculation_type, value)
    VALUES (?, ?, ?)
    ''', overhead_data)

    cursor.execute("INSERT INTO profit_rules (name, rule_type, target_pct) VALUES ('Banquet Target Margin', 'TARGET_MARGIN_PCT', 32.0)")
    cursor.execute("INSERT INTO tax_rules (name, tax_percentage, is_inclusive) VALUES ('Catering GST', 5.0, 0)")

    # 7. Seed Official Brochure Quotation
    selected_items_flyer = [
        ('Passion Fruit Mojito', 45.0, 'PER_PERSON', 700),
        ('Lemon Juice', 35.0, 'PER_PERSON', 700),
        ('Chicken Momos', 45.0, 'PER_PERSON', 700),
        ('Samosa', 30.0, 'PER_PERSON', 700),
        ('Mutton Soup', 55.0, 'PER_PERSON', 700),
        ('Palappam', 25.0, 'PER_PERSON', 700),
        ('Nool Porotta', 30.0, 'PER_PERSON', 700),
        ('Duck Mappas / Roast / Pepper / Kuttanadan', 85.0, 'PER_PERSON', 700),
        ('Raw Mango Salad', 25.0, 'PER_PERSON', 700),
        ('Irani Salad', 25.0, 'PER_PERSON', 700),
        ('Mutton Biriyani (with raita, pickle and pappad)', 175.0, 'PER_PERSON', 700),
        ('Fish Tawa Fry (King Fish)', 110.0, 'PER_PERSON', 700),
        ('Cheese Cake', 55.0, 'PER_PERSON', 700),
        ('Kunaffa', 65.0, 'PER_PERSON', 700),
        ('Herbal Tea (Lemon / Mint / Ginger)', 20.0, 'PER_PERSON', 700),
        ('15 kg Beef Pepper Fry', 650.0, 'PER_KG', 15),
        ('10 kg Chicken 65', 520.0, 'PER_KG', 10),
    ]

    per_person_sum = sum(p for n, p, u, q in selected_items_flyer if u == 'PER_PERSON')
    bulk_sum = sum(p * q for n, p, u, q in selected_items_flyer if u != 'PER_PERSON')
    subtotal = (per_person_sum * 700) + bulk_sum
    discount_val = 0.0
    discount_amt = 0.0
    tax_amt = round((subtotal * 5.0) / 100.0, 2)
    grand_total = subtotal + tax_amt

    cursor.execute('''
    INSERT INTO quotations (
        quotation_number, client_id, event_id, guest_count, subtotal, discount_type,
        discount_value, discount_amount, tax_percentage, tax_amount, grand_total, status,
        terms_and_conditions, special_notes, created_by
    ) VALUES (
        'QT-2026-000001', ?, ?, 700, ?, 'PERCENTAGE', 0.0, 0.0, 5.0, ?, ?, 'CONFIRMED',
        'Seasonal items like specific fish, fruits are subjected to their availability.',
        'Official 700 pax Engagement proposal from B & Co flyer',
        'B & Co Admin'
    )
    ''', (client_id, event_id, subtotal, tax_amt, grand_total))
    quotation_id = cursor.lastrowid

    for name, price, unit, qty in selected_items_flyer:
        line_total = price * 700 if unit == 'PER_PERSON' else price * qty
        item_row = cursor.execute("SELECT id, service_type FROM menu_items WHERE name = ?", (name,)).fetchone()
        m_id = item_row[0] if item_row else None
        st = item_row[1] if item_row else 'STANDARD'
        cursor.execute('''
        INSERT INTO quotation_items (
            quotation_id, menu_item_id, item_name_snapshot, category_snapshot,
            service_type_snapshot, pricing_unit_snapshot, selling_price_snapshot,
            quantity, line_total
        ) VALUES (?, ?, ?, 'Brochure Selection', ?, ?, ?, ?, ?)
        ''', (quotation_id, m_id, name, st, unit, price, qty if unit != 'PER_PERSON' else 1, line_total))

    conn.commit()
    conn.close()
    print("Brochure seed data populated successfully!")

if __name__ == "__main__":
    seed_database()
