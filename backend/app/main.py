import os
import json
import sqlite3
import hashlib
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Query, Header, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import get_db, init_db, DB_PATH
from pdf_generator import generate_quotation_pdf

app = FastAPI(
    title="B & Co Catering Management API",
    version="1.0.0",
    description="Backend API for B & Co Wedding Events and Caters"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static & Assets directories
ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / "assets"
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend_assets")
elif ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# Helper for passwords
def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

# Helper for parsing auth role
def get_current_user_role(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        return "SALESPERSON" # Default to standard role
    token = authorization.replace("Bearer ", "").strip()
    try:
        # Simple token format: user_id:role:hash
        parts = token.split(":")
        if len(parts) >= 2:
            return parts[1].upper()
    except Exception:
        pass
    return "SALESPERSON"

def require_roles(allowed_roles: List[str]):
    def role_checker(authorization: Optional[str] = Header(None)):
        role = get_current_user_role(authorization)
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{role}'. Required: {allowed_roles}"
            )
        return role
    return role_checker

# ==================== PYDANTIC SCHEMAS ====================

class LoginRequest(BaseModel):
    email: str
    password: str

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: Optional[int] = 0
    is_active: Optional[int] = 1

class MenuItemCreate(BaseModel):
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    service_type: Optional[str] = "STANDARD" # STANDARD, LIVE_COUNTER, STATION, SPECIAL
    pricing_unit: Optional[str] = "PER_PERSON" # PER_PERSON, PER_PLATE, PER_KG, PER_EVENT
    selling_price: Optional[float] = None
    food_cost: Optional[float] = None
    labour_cost: Optional[float] = None
    packaging_cost: Optional[float] = None
    overhead_cost: Optional[float] = None
    is_demo_price: Optional[int] = 0
    is_seasonal: Optional[int] = 0
    is_active: Optional[int] = 1
    display_order: Optional[int] = 0

class ItemCostUpdate(BaseModel):
    selling_price: Optional[float] = None
    food_cost: Optional[float] = None
    labour_cost: Optional[float] = None
    packaging_cost: Optional[float] = None
    overhead_cost: Optional[float] = None

class PriceUpdate(BaseModel):
    selling_price: float
    reason: Optional[str] = "Admin price update"

class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = None
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    notes: Optional[str] = None

class EventCreate(BaseModel):
    client_id: int
    event_type: str
    event_date: str
    event_time: Optional[str] = None
    venue: str
    venue_address: Optional[str] = None
    guest_count: int = 500
    status: Optional[str] = "PLANNING"
    special_notes: Optional[str] = None

class QuotationItemInput(BaseModel):
    menu_item_id: Optional[int] = None
    item_name: str
    category: Optional[str] = None
    service_type: Optional[str] = "STANDARD"
    pricing_unit: Optional[str] = "PER_PERSON"
    selling_price: float
    quantity: float = 1.0

class QuotationAddonInput(BaseModel):
    addon_id: Optional[int] = None
    name: str
    pricing_unit: Optional[str] = "PER_EVENT"
    selling_price: float
    quantity: float = 1.0

class QuotationCreate(BaseModel):
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_address: Optional[str] = None
    event_id: Optional[int] = None
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    venue: Optional[str] = None
    venue_address: Optional[str] = None
    guest_count: int = 500
    items: List[QuotationItemInput] = []
    addons: List[QuotationAddonInput] = []
    discount_type: Optional[str] = "PERCENTAGE" # PERCENTAGE or FIXED
    discount_value: Optional[float] = 0.0
    tax_percentage: Optional[float] = 5.0
    terms_and_conditions: Optional[str] = ""
    special_notes: Optional[str] = None
    created_by: Optional[str] = "Salesperson"

class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    tagline: Optional[str] = None
    phone1: Optional[str] = None
    phone2: Optional[str] = None
    email: Optional[str] = None
    location1: Optional[str] = None
    location2: Optional[str] = None
    website: Optional[str] = None
    gst_number: Optional[str] = None
    quotation_prefix: Optional[str] = None
    default_terms: Optional[str] = None
    currency_symbol: Optional[str] = None
    date_format: Optional[str] = None

class IngredientCreate(BaseModel):
    name: str
    unit: str
    purchase_price: float
    wastage_pct: Optional[float] = 5.0
    supplier: Optional[str] = None

# ==================== AUTH & USERS ====================

@app.post("/api/auth/login")
def login(creds: LoginRequest, db: sqlite3.Connection = Depends(get_db)):
    pw_h = hash_pw(creds.password)
    user = db.execute(
        "SELECT id, email, full_name, role, max_discount_pct, is_active FROM users WHERE email = ? AND password_hash = ?",
        (creds.email.lower().strip(), pw_h)
    ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="User account is deactivated")

    # Generate token
    token = f"{user['id']}:{user['role']}:{pw_h[:8]}"
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "max_discount_pct": user["max_discount_pct"]
        }
    }

@app.get("/api/auth/users")
def list_users(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT id, email, full_name, role, max_discount_pct, is_active, created_at FROM users").fetchall()
    return [dict(r) for r in rows]

# ==================== COMPANY SETTINGS ====================

@app.get("/api/settings")
def get_company_settings(db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM company_settings WHERE id = 1").fetchone()
    if not row:
        return {}
    return dict(row)

@app.put("/api/settings")
def update_company_settings(
    settings: CompanySettingsUpdate,
    role: str = Depends(require_roles(["ADMIN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    updates = []
    values = []
    for k, v in settings.dict(exclude_unset=True).items():
        updates.append(f"{k} = ?")
        values.append(v)
    if updates:
        sql = f"UPDATE company_settings SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
        db.execute(sql, values)
        db.commit()
    row = db.execute("SELECT * FROM company_settings WHERE id = 1").fetchone()
    return dict(row)

# ==================== CATEGORIES ====================

@app.get("/api/categories")
def get_categories(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute('''
        SELECT c.*, COUNT(m.id) as item_count
        FROM categories c
        LEFT JOIN menu_items m ON c.id = m.category_id AND m.is_active = 1
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.id ASC
    ''').fetchall()
    return [dict(r) for r in rows]

@app.post("/api/categories")
def create_category(cat: CategoryCreate, role: str = Depends(require_roles(["ADMIN", "MANAGER"])), db: sqlite3.Connection = Depends(get_db)):
    try:
        cursor = db.execute(
            "INSERT INTO categories (name, description, display_order, is_active) VALUES (?, ?, ?, ?)",
            (cat.name, cat.description, cat.display_order, cat.is_active)
        )
        db.commit()
        return {"id": cursor.lastrowid, **cat.dict()}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

@app.put("/api/categories/{id}")
def update_category(id: int, cat: CategoryCreate, role: str = Depends(require_roles(["ADMIN", "MANAGER"])), db: sqlite3.Connection = Depends(get_db)):
    db.execute(
        "UPDATE categories SET name = ?, description = ?, display_order = ?, is_active = ? WHERE id = ?",
        (cat.name, cat.description, cat.display_order, cat.is_active, id)
    )
    db.commit()
    return {"id": id, **cat.dict()}

@app.delete("/api/categories/{id}")
def delete_category(id: int, role: str = Depends(require_roles(["ADMIN"])), db: sqlite3.Connection = Depends(get_db)):
    db.execute("DELETE FROM categories WHERE id = ?", (id,))
    db.commit()
    return {"success": True, "message": "Category deleted"}

# ==================== MENU ITEMS ====================

@app.get("/api/menu-items")
def get_menu_items(
    category_id: Optional[int] = None,
    service_type: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = False,
    db: sqlite3.Connection = Depends(get_db)
):
    query = '''
        SELECT m.*, c.name as category_name
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE 1=1
    '''
    params = []
    if category_id:
        query += " AND m.category_id = ?"
        params.append(category_id)
    if service_type:
        query += " AND m.service_type = ?"
        params.append(service_type)
    if active_only:
        query += " AND m.is_active = 1"
    if search:
        query += " AND (m.name LIKE ? OR m.description LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")

    query += " ORDER BY c.display_order ASC, m.display_order ASC, m.id ASC"
    rows = db.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/menu-items/{id}")
def get_menu_item(id: int, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute('''
        SELECT m.*, c.name as category_name
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.id = ?
    ''', (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return dict(row)

@app.post("/api/menu-items")
def create_menu_item(item: MenuItemCreate, role: str = Depends(require_roles(["ADMIN", "MANAGER"])), db: sqlite3.Connection = Depends(get_db)):
    sp = item.selling_price or 0.0
    fc = item.food_cost if item.food_cost is not None else round(sp * 0.40, 2)
    lc = item.labour_cost if item.labour_cost is not None else round(sp * 0.15, 2)
    pc = item.packaging_cost if item.packaging_cost is not None else round(sp * 0.05, 2)
    oc = item.overhead_cost if item.overhead_cost is not None else round(sp * 0.08, 2)

    cursor = db.execute('''
        INSERT INTO menu_items (
            category_id, name, description, image_url, service_type, pricing_unit,
            selling_price, food_cost, labour_cost, packaging_cost, overhead_cost,
            is_demo_price, is_seasonal, is_active, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        item.category_id, item.name, item.description, item.image_url,
        item.service_type, item.pricing_unit, item.selling_price,
        fc, lc, pc, oc,
        item.is_demo_price, item.is_seasonal, item.is_active, item.display_order
    ))
    db.commit()
    return {
        "id": cursor.lastrowid,
        **item.dict(),
        "food_cost": fc,
        "labour_cost": lc,
        "packaging_cost": pc,
        "overhead_cost": oc
    }

@app.put("/api/menu-items/{id}")
def update_menu_item(id: int, item: MenuItemCreate, role: str = Depends(require_roles(["ADMIN", "MANAGER"])), db: sqlite3.Connection = Depends(get_db)):
    old_row = db.execute("SELECT selling_price, food_cost, labour_cost, packaging_cost, overhead_cost FROM menu_items WHERE id = ?", (id,)).fetchone()
    old_price = old_row["selling_price"] if old_row else None

    sp = item.selling_price or 0.0
    fc = item.food_cost if item.food_cost is not None else (old_row["food_cost"] if old_row and old_row["food_cost"] is not None else round(sp * 0.40, 2))
    lc = item.labour_cost if item.labour_cost is not None else (old_row["labour_cost"] if old_row and old_row["labour_cost"] is not None else round(sp * 0.15, 2))
    pc = item.packaging_cost if item.packaging_cost is not None else (old_row["packaging_cost"] if old_row and old_row["packaging_cost"] is not None else round(sp * 0.05, 2))
    oc = item.overhead_cost if item.overhead_cost is not None else (old_row["overhead_cost"] if old_row and old_row["overhead_cost"] is not None else round(sp * 0.08, 2))

    db.execute('''
        UPDATE menu_items SET
            category_id = ?, name = ?, description = ?, image_url = ?,
            service_type = ?, pricing_unit = ?, selling_price = ?,
            food_cost = ?, labour_cost = ?, packaging_cost = ?, overhead_cost = ?,
            is_demo_price = ?, is_seasonal = ?, is_active = ?, display_order = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        item.category_id, item.name, item.description, item.image_url,
        item.service_type, item.pricing_unit, item.selling_price,
        fc, lc, pc, oc,
        item.is_demo_price, item.is_seasonal, item.is_active, item.display_order, id
    ))

    # Log price history if changed
    if old_price is not None and item.selling_price is not None and old_price != item.selling_price:
        db.execute('''
            INSERT INTO price_history (menu_item_id, old_price, new_price, changed_by, reason)
            VALUES (?, ?, ?, ?, ?)
        ''', (id, old_price, item.selling_price, role, "Price update via menu manager"))

    db.commit()
    return {"id": id, **item.dict(), "food_cost": fc, "labour_cost": lc, "packaging_cost": pc, "overhead_cost": oc}

@app.delete("/api/menu-items/{id}")
def delete_menu_item(id: int, role: str = Depends(require_roles(["ADMIN"])), db: sqlite3.Connection = Depends(get_db)):
    db.execute("DELETE FROM menu_items WHERE id = ?", (id,))
    db.commit()
    return {"success": True, "message": "Item deleted"}

# ==================== PRICING MANAGEMENT ====================

@app.put("/api/pricing/{menu_item_id}")
def update_item_price(
    menu_item_id: int,
    price_data: PriceUpdate,
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    old_row = db.execute("SELECT selling_price, name FROM menu_items WHERE id = ?", (menu_item_id,)).fetchone()
    if not old_row:
        raise HTTPException(status_code=404, detail="Item not found")

    old_price = old_row["selling_price"]
    db.execute(
        "UPDATE menu_items SET selling_price = ?, is_demo_price = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (price_data.selling_price, menu_item_id)
    )
    db.execute('''
        INSERT INTO price_history (menu_item_id, old_price, new_price, changed_by, reason)
        VALUES (?, ?, ?, ?, ?)
    ''', (menu_item_id, old_price, price_data.selling_price, role, price_data.reason))
    db.commit()
    return {"success": True, "old_price": old_price, "new_price": price_data.selling_price}

@app.get("/api/pricing/history/{menu_item_id}")
def get_price_history(menu_item_id: int, db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM price_history WHERE menu_item_id = ? ORDER BY created_at DESC", (menu_item_id,)).fetchall()
    return [dict(r) for r in rows]

# ==================== PACKAGES & ADDONS ====================

@app.get("/api/packages")
def get_packages(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM packages WHERE is_active = 1 ORDER BY id ASC").fetchall()
    return [dict(r) for r in rows]

@app.get("/api/addons")
def get_addons(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM addons WHERE is_active = 1 ORDER BY id ASC").fetchall()
    return [dict(r) for r in rows]

# ==================== CLIENTS ====================

@app.get("/api/clients")
def list_clients(search: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    query = "SELECT * FROM clients WHERE 1=1"
    params = []
    if search:
        query += " AND (name LIKE ? OR phone LIKE ? OR company LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    query += " ORDER BY id DESC"
    rows = db.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/clients")
def create_client(client: ClientCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.execute('''
        INSERT INTO clients (name, company, phone, email, address, gst_number, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (client.name, client.company, client.phone, client.email, client.address, client.gst_number, client.notes))
    db.commit()
    return {"id": cursor.lastrowid, **client.dict()}

@app.get("/api/clients/{id}")
def get_client(id: int, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM clients WHERE id = ?", (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")
    client_dict = dict(row)
    # get quotations and events
    quotations = db.execute("SELECT * FROM quotations WHERE client_id = ? ORDER BY id DESC", (id,)).fetchall()
    events = db.execute("SELECT * FROM events WHERE client_id = ? ORDER BY id DESC", (id,)).fetchall()
    client_dict["quotations"] = [dict(q) for q in quotations]
    client_dict["events"] = [dict(e) for e in events]
    return client_dict

@app.put("/api/clients/{id}")
def update_client(id: int, client: ClientCreate, db: sqlite3.Connection = Depends(get_db)):
    db.execute('''
        UPDATE clients SET name = ?, company = ?, phone = ?, email = ?, address = ?, gst_number = ?, notes = ?
        WHERE id = ?
    ''', (client.name, client.company, client.phone, client.email, client.address, client.gst_number, client.notes, id))
    db.commit()
    return {"id": id, **client.dict()}

@app.delete("/api/clients/{id}")
def delete_client(id: int, role: str = Depends(require_roles(["ADMIN"])), db: sqlite3.Connection = Depends(get_db)):
    db.execute("DELETE FROM clients WHERE id = ?", (id,))
    db.commit()
    return {"success": True}

# ==================== EVENTS ====================

@app.get("/api/events")
def list_events(status: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    query = '''
        SELECT e.*, c.name as client_name, c.phone as client_phone
        FROM events e
        LEFT JOIN clients c ON e.client_id = c.id
    '''
    params = []
    if status:
        query += " WHERE e.status = ?"
        params.append(status)
    query += " ORDER BY e.event_date ASC, e.id DESC"
    rows = db.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/events")
def create_event(event: EventCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.execute('''
        INSERT INTO events (client_id, event_type, event_date, event_time, venue, venue_address, guest_count, status, special_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (event.client_id, event.event_type, event.event_date, event.event_time, event.venue, event.venue_address, event.guest_count, event.status, event.special_notes))
    db.commit()
    return {"id": cursor.lastrowid, **event.dict()}

@app.put("/api/events/{id}")
def update_event(id: int, event: EventCreate, db: sqlite3.Connection = Depends(get_db)):
    db.execute('''
        UPDATE events SET client_id = ?, event_type = ?, event_date = ?, event_time = ?, venue = ?, venue_address = ?, guest_count = ?, status = ?, special_notes = ?
        WHERE id = ?
    ''', (event.client_id, event.event_type, event.event_date, event.event_time, event.venue, event.venue_address, event.guest_count, event.status, event.special_notes, id))
    db.commit()
    return {"id": id, **event.dict()}

@app.delete("/api/events/{id}")
def delete_event(id: int, role: str = Depends(require_roles(["ADMIN", "MANAGER"])), db: sqlite3.Connection = Depends(get_db)):
    # Unlink quotations pointing to this event
    db.execute("UPDATE quotations SET event_id = NULL WHERE event_id = ?", (id,))
    # Delete the event
    db.execute("DELETE FROM events WHERE id = ?", (id,))
    db.commit()
    return {"success": True, "message": "Event removed from calendar"}

# ==================== QUOTATION ENGINE ====================

def generate_quotation_number(db: sqlite3.Connection) -> str:
    settings = db.execute("SELECT quotation_prefix FROM company_settings WHERE id = 1").fetchone()
    prefix = settings["quotation_prefix"] if settings and settings["quotation_prefix"] else "QT-2026-"
    last = db.execute("SELECT id FROM quotations ORDER BY id DESC LIMIT 1").fetchone()
    next_num = (last["id"] + 1) if last else 1
    return f"{prefix}{next_num:06d}"

@app.get("/api/quotations")
def list_quotations(
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    search: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    query = '''
        SELECT q.*, c.name as client_name, c.phone as client_phone, e.event_type, e.event_date, e.venue
        FROM quotations q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN events e ON q.event_id = e.id
        WHERE 1=1
    '''
    params = []
    if status:
        query += " AND q.status = ?"
        params.append(status)
    if client_id:
        query += " AND q.client_id = ?"
        params.append(client_id)
    if search:
        query += " AND (q.quotation_number LIKE ? OR c.name LIKE ? OR e.venue LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    query += " ORDER BY q.id DESC"
    rows = db.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/quotations/{id}")
def get_quotation_detail(id: int, db: sqlite3.Connection = Depends(get_db)):
    q_row = db.execute('''
        SELECT q.*, c.name as client_name, c.company as client_company, c.phone as client_phone, c.email as client_email, c.address as client_address,
               e.event_type, e.event_date, e.event_time, e.venue, e.venue_address
        FROM quotations q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN events e ON q.event_id = e.id
        WHERE q.id = ?
    ''', (id,)).fetchone()
    if not q_row:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    q_data = dict(q_row)
    items = db.execute("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC", (id,)).fetchall()
    addons = db.execute("SELECT * FROM quotation_addons WHERE quotation_id = ? ORDER BY id ASC", (id,)).fetchall()
    q_data["items"] = [dict(i) for i in items]
    q_data["addons"] = [dict(a) for a in addons]
    
    # Structure client and event sub-objects for PDF and frontend
    q_data["client"] = {
        "id": q_data["client_id"],
        "name": q_data["client_name"],
        "company": q_data["client_company"],
        "phone": q_data["client_phone"],
        "email": q_data["client_email"],
        "address": q_data["client_address"],
    }
    q_data["event"] = {
        "id": q_data["event_id"],
        "event_type": q_data["event_type"],
        "event_date": q_data["event_date"],
        "event_time": q_data["event_time"],
        "venue": q_data["venue"],
        "venue_address": q_data["venue_address"],
    }
    return q_data

@app.post("/api/quotations")
def create_quotation(
    payload: QuotationCreate,
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "SALESPERSON"])),
    db: sqlite3.Connection = Depends(get_db)
):
    # Verify discount authority
    if payload.discount_type == "PERCENTAGE":
        disc_pct = payload.discount_value or 0
        if role == "SALESPERSON" and disc_pct > 5.0:
            raise HTTPException(status_code=400, detail="Salesperson role is limited to maximum 5% discount. Contact Manager for approval.")
        elif role == "MANAGER" and disc_pct > 15.0:
            raise HTTPException(status_code=400, detail="Manager role is limited to maximum 15% discount. Contact Admin.")

    # Calculate item line totals based on guest count and pricing unit
    subtotal = 0.0
    processed_items = []
    for item in payload.items:
        if item.pricing_unit in ["PER_PERSON", "PER_PLATE"]:
            line_tot = item.selling_price * payload.guest_count
        else:
            line_tot = item.selling_price * item.quantity
        subtotal += line_tot
        processed_items.append((item, line_tot))

    # Addons line totals
    processed_addons = []
    for addon in payload.addons:
        line_tot = addon.selling_price * addon.quantity
        subtotal += line_tot
        processed_addons.append((addon, line_tot))

    # Calculate discount
    discount_amount = 0.0
    if payload.discount_type == "PERCENTAGE":
        discount_amount = round((subtotal * (payload.discount_value or 0)) / 100.0, 2)
    else:
        discount_amount = round(payload.discount_value or 0, 2)

    after_discount = max(0.0, subtotal - discount_amount)
    tax_pct = payload.tax_percentage if payload.tax_percentage is not None else 5.0
    tax_amount = round((after_discount * tax_pct) / 100.0, 2)
    grand_total = after_discount + tax_amount

    quotation_number = generate_quotation_number(db)
    
    # Determine client_id
    client_id = payload.client_id
    if not client_id and (payload.client_name or payload.client_phone):
        cur = db.execute(
            "INSERT INTO clients (name, phone, address, notes) VALUES (?, ?, ?, ?)",
            (payload.client_name or "Walk-in Client", payload.client_phone or "", payload.client_address or "", "Registered from proposal")
        )
        client_id = cur.lastrowid
    elif not client_id:
        first_c = db.execute("SELECT id FROM clients ORDER BY id ASC LIMIT 1").fetchone()
        client_id = first_c["id"] if first_c else 1

    # Determine event_id
    event_id = payload.event_id
    if not event_id and (payload.event_type or payload.venue or payload.event_date):
        ev_cur = db.execute('''
            INSERT INTO events (client_id, event_type, event_date, venue, venue_address, guest_count, status, special_notes)
            VALUES (?, ?, ?, ?, ?, ?, 'PLANNING', 'Created with quotation')
        ''', (
            client_id,
            payload.event_type or "Catering Occasion",
            payload.event_date or "2026-12-28",
            payload.venue or "Venue Pending",
            payload.venue_address or "",
            payload.guest_count
        ))
        event_id = ev_cur.lastrowid

    # User explicitly requested no terms and conditions
    terms = ""

    cursor = db.execute('''
        INSERT INTO quotations (
            quotation_number, client_id, event_id, guest_count, subtotal, discount_type,
            discount_value, discount_amount, tax_percentage, tax_amount, grand_total,
            status, terms_and_conditions, special_notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)
    ''', (
        quotation_number, client_id, event_id, payload.guest_count,
        subtotal, payload.discount_type, payload.discount_value, discount_amount,
        tax_pct, tax_amount, grand_total, terms, payload.special_notes, payload.created_by
    ))
    q_id = cursor.lastrowid

    # Insert items snapshot
    for it, l_tot in processed_items:
        valid_item_id = it.menu_item_id
        if valid_item_id:
            exists = db.execute("SELECT id FROM menu_items WHERE id = ?", (valid_item_id,)).fetchone()
            if not exists:
                valid_item_id = None
        db.execute('''
            INSERT INTO quotation_items (
                quotation_id, menu_item_id, item_name_snapshot, category_snapshot,
                service_type_snapshot, pricing_unit_snapshot, selling_price_snapshot,
                quantity, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            q_id, valid_item_id, it.item_name, it.category, it.service_type,
            it.pricing_unit, it.selling_price, it.quantity if it.pricing_unit != "PER_PERSON" else 1, l_tot
        ))

    # Insert addons snapshot
    for ad, l_tot in processed_addons:
        valid_addon_id = ad.addon_id
        if valid_addon_id:
            exists = db.execute("SELECT id FROM addons WHERE id = ?", (valid_addon_id,)).fetchone()
            if not exists:
                valid_addon_id = None
        db.execute('''
            INSERT INTO quotation_addons (
                quotation_id, addon_id, name_snapshot, pricing_unit_snapshot,
                selling_price_snapshot, quantity, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            q_id, valid_addon_id, ad.name, ad.pricing_unit, ad.selling_price, ad.quantity, l_tot
        ))

    db.commit()
    return {"id": q_id, "quotation_number": quotation_number, "grand_total": grand_total}

@app.put("/api/quotations/{id}/status")
def update_quotation_status(
    id: int,
    status_payload: Dict[str, str],
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "SALESPERSON"])),
    db: sqlite3.Connection = Depends(get_db)
):
    new_status = status_payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing status")
    db.execute("UPDATE quotations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, id))

    # Sync with event if status is CONFIRMED
    q = db.execute("SELECT q.*, c.name as client_name, c.phone as client_phone FROM quotations q LEFT JOIN clients c ON q.client_id = c.id WHERE q.id = ?", (id,)).fetchone()
    if q and new_status == "CONFIRMED":
        if q["event_id"]:
            db.execute("UPDATE events SET status = 'CONFIRMED' WHERE id = ?", (q["event_id"],))
        else:
            # Create confirmed event so it automatically shows on the Calendar
            cursor = db.execute('''
                INSERT INTO events (client_id, event_type, event_date, event_time, venue, venue_address, guest_count, status, special_notes)
                VALUES (?, 'Wedding Feast', DATE('now', '+7 days'), '18:00', 'Confirmed Banquet Hall', 'Kerala', ?, 'CONFIRMED', ?)
            ''', (q["client_id"], q["guest_count"], f"Confirmed Booking: Quotation #{q['quotation_number']}"))
            event_id = cursor.lastrowid
            db.execute("UPDATE quotations SET event_id = ? WHERE id = ?", (event_id, id))

    db.commit()
    return {"success": True, "status": new_status}

@app.post("/api/quotations/{id}/duplicate")
def duplicate_quotation(id: int, db: sqlite3.Connection = Depends(get_db)):
    orig = db.execute("SELECT * FROM quotations WHERE id = ?", (id,)).fetchone()
    if not orig:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    new_number = generate_quotation_number(db)
    cursor = db.execute('''
        INSERT INTO quotations (
            quotation_number, client_id, event_id, guest_count, subtotal, discount_type,
            discount_value, discount_amount, tax_percentage, tax_amount, grand_total,
            status, terms_and_conditions, special_notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)
    ''', (
        new_number, orig["client_id"], orig["event_id"], orig["guest_count"],
        orig["subtotal"], orig["discount_type"], orig["discount_value"], orig["discount_amount"],
        orig["tax_percentage"], orig["tax_amount"], orig["grand_total"],
        orig["terms_and_conditions"], f"Copy of {orig['quotation_number']}", orig["created_by"]
    ))
    new_id = cursor.lastrowid

    # Copy items
    items = db.execute("SELECT * FROM quotation_items WHERE quotation_id = ?", (id,)).fetchall()
    for item in items:
        db.execute('''
            INSERT INTO quotation_items (
                quotation_id, menu_item_id, item_name_snapshot, category_snapshot,
                service_type_snapshot, pricing_unit_snapshot, selling_price_snapshot,
                quantity, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            new_id, item["menu_item_id"], item["item_name_snapshot"], item["category_snapshot"],
            item["service_type_snapshot"], item["pricing_unit_snapshot"], item["selling_price_snapshot"],
            item["quantity"], item["line_total"]
        ))

    # Copy addons
    addons = db.execute("SELECT * FROM quotation_addons WHERE quotation_id = ?", (id,)).fetchall()
    for addon in addons:
        db.execute('''
            INSERT INTO quotation_addons (
                quotation_id, addon_id, name_snapshot, pricing_unit_snapshot,
                selling_price_snapshot, quantity, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            new_id, addon["addon_id"], addon["name_snapshot"], addon["pricing_unit_snapshot"],
            addon["selling_price_snapshot"], addon["quantity"], addon["line_total"]
        ))

    db.commit()
    return {"id": new_id, "quotation_number": new_number}

@app.delete("/api/quotations/{id}")
def delete_quotation(id: int, role: str = Depends(require_roles(["ADMIN", "MANAGER"])), db: sqlite3.Connection = Depends(get_db)):
    q = db.execute("SELECT event_id FROM quotations WHERE id = ?", (id,)).fetchone()
    event_id = q["event_id"] if q else None

    # Delete quotation items, addons, and the quotation record
    db.execute("DELETE FROM quotation_items WHERE quotation_id = ?", (id,))
    db.execute("DELETE FROM quotation_addons WHERE quotation_id = ?", (id,))
    db.execute("DELETE FROM quotations WHERE id = ?", (id,))

    # If this quotation was linked to an event, check if any other quotation references it
    if event_id:
        other_q = db.execute("SELECT id FROM quotations WHERE event_id = ?", (event_id,)).fetchone()
        if not other_q:
            # Delete orphaned event so it does not remain on the calendar
            db.execute("DELETE FROM events WHERE id = ?", (event_id,))

    db.commit()
    return {"success": True}

# ==================== PDF & SHARE GENERATION ====================

@app.get("/api/quotations/{id}/pdf")
def get_quotation_pdf(id: int, db: sqlite3.Connection = Depends(get_db)):
    # Retrieve quotation and format
    q_data = get_quotation_detail(id, db)
    settings = get_company_settings(db)
    
    pdf_bytes = generate_quotation_pdf(q_data, settings)
    filename = f"B_and_Co_{q_data.get('quotation_number', 'Quotation')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/api/quotations/preview-pdf")
def preview_quotation_pdf(q_input: QuotationCreate, db: sqlite3.Connection = Depends(get_db)):
    client_row = db.execute("SELECT * FROM clients WHERE id = ?", (q_input.client_id,)).fetchone()
    event_row = db.execute("SELECT * FROM events WHERE id = ?", (q_input.event_id,)).fetchone() if q_input.event_id else None
    settings = get_company_settings(db)
    
    # Process items
    subtotal = 0.0
    items_list = []
    for it in q_input.items:
        line_total = it.selling_price * (q_input.guest_count if it.pricing_unit == "PER_PERSON" else it.quantity)
        subtotal += line_total
        items_list.append({
            "item_name_snapshot": it.item_name,
            "category_snapshot": it.category,
            "service_type_snapshot": it.service_type,
            "pricing_unit_snapshot": it.pricing_unit,
            "selling_price_snapshot": it.selling_price,
            "quantity": it.quantity if it.pricing_unit != "PER_PERSON" else 1,
            "line_total": line_total
        })

    if q_input.discount_type == "PERCENTAGE":
        discount_amount = round((subtotal * (q_input.discount_value or 0)) / 100.0, 2)
    else:
        discount_amount = round(min(subtotal, q_input.discount_value or 0), 2)
    
    taxable = max(0, subtotal - discount_amount)
    tax_amount = round((taxable * (q_input.tax_percentage or 5.0)) / 100.0, 2)
    grand_total = round(taxable + tax_amount, 2)

    c_name = q_input.client_name or (client_row["name"] if client_row else "")
    c_phone = q_input.client_phone or (client_row["phone"] if client_row else "")
    c_address = q_input.client_address or (client_row["address"] if client_row else "")
    e_type = q_input.event_type or (event_row["event_type"] if event_row else "")
    e_date = q_input.event_date or (event_row["event_date"] if event_row else "")
    e_venue = q_input.venue or (event_row["venue"] if event_row else "")
    e_venue_addr = q_input.venue_address or (event_row["venue_address"] if event_row else "")

    q_data = {
        "quotation_number": "DRAFT-PROPOSAL",
        "client_name": c_name,
        "client_phone": c_phone,
        "client_address": c_address,
        "event_type": e_type,
        "event_date": e_date,
        "venue": e_venue,
        "venue_address": e_venue_addr,
        "guest_count": q_input.guest_count,
        "items": items_list,
        "addons": [],
        "subtotal": subtotal,
        "discount_type": q_input.discount_type,
        "discount_value": q_input.discount_value,
        "discount_amount": discount_amount,
        "tax_percentage": q_input.tax_percentage or 5.0,
        "tax_amount": tax_amount,
        "grand_total": grand_total,
        "created_at": "2026-09-29"
    }

    pdf_bytes = generate_quotation_pdf(q_data, settings)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=B_and_Co_Proposal.pdf"}
    )

@app.get("/api/quotations/public/{quotation_number}")
def get_public_quotation(quotation_number: str, db: sqlite3.Connection = Depends(get_db)):
    """Customer-safe public view for WhatsApp / Digital proposal links. STRICTLY NO INTERNAL COSTING."""
    row = db.execute("SELECT id FROM quotations WHERE quotation_number = ?", (quotation_number,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return get_quotation_detail(row["id"], db)

# ==================== INTERNAL COSTING ENGINE (ADMIN & MANAGER ONLY) ====================

@app.get("/api/costing/overview")
def get_costing_overview(
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    """
    CRITICAL: This endpoint provides internal cost and margin intelligence.
    Forbidden for SALESPERSON role.
    """
    items = db.execute('''
        SELECT id, name, pricing_unit, selling_price, category_id,
               food_cost, labour_cost, packaging_cost, overhead_cost
        FROM menu_items
        WHERE is_active = 1 AND selling_price IS NOT NULL
        ORDER BY id ASC
    ''').fetchall()

    # Calculate internal margins
    total_selling = 0
    total_cost = 0
    item_analysis = []
    
    for item in items:
        sp = item["selling_price"] or 0.0
        # Stored values with intelligent fallback defaults
        food_cost = item["food_cost"] if item["food_cost"] is not None else round(sp * 0.40, 2)
        labour_cost = item["labour_cost"] if item["labour_cost"] is not None else round(sp * 0.15, 2)
        pack_cost = item["packaging_cost"] if item["packaging_cost"] is not None else round(sp * 0.05, 2)
        overhead = item["overhead_cost"] if item["overhead_cost"] is not None else round(sp * 0.08, 2)
        total_internal_cost = round(food_cost + labour_cost + pack_cost + overhead, 2)
        profit = round(sp - total_internal_cost, 2)
        margin_pct = round((profit / sp) * 100.0, 1) if sp > 0 else 0

        total_selling += sp
        total_cost += total_internal_cost

        item_analysis.append({
            "id": item["id"],
            "name": item["name"],
            "pricing_unit": item["pricing_unit"],
            "selling_price": sp,
            "food_cost": food_cost,
            "labour_cost": labour_cost,
            "packaging_cost": pack_cost,
            "overhead_cost": overhead,
            "total_internal_cost": total_internal_cost,
            "internal_profit": profit,
            "margin_pct": margin_pct
        })

    avg_margin = round(((total_selling - total_cost) / total_selling) * 100.0, 1) if total_selling > 0 else 0

    return {
        "item_count": len(items),
        "average_margin_pct": avg_margin,
        "items": item_analysis
    }

@app.put("/api/costing/items/{id}")
def update_item_cost(
    id: int,
    cost_data: ItemCostUpdate,
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    row = db.execute("SELECT * FROM menu_items WHERE id = ?", (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")

    sp = cost_data.selling_price if cost_data.selling_price is not None else row["selling_price"]
    fc = cost_data.food_cost if cost_data.food_cost is not None else row["food_cost"]
    lc = cost_data.labour_cost if cost_data.labour_cost is not None else row["labour_cost"]
    pc = cost_data.packaging_cost if cost_data.packaging_cost is not None else row["packaging_cost"]
    oc = cost_data.overhead_cost if cost_data.overhead_cost is not None else row["overhead_cost"]

    db.execute('''
        UPDATE menu_items SET
            selling_price = ?,
            food_cost = ?,
            labour_cost = ?,
            packaging_cost = ?,
            overhead_cost = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (sp, fc, lc, pc, oc, id))
    db.commit()

    total_cost = round((fc or 0) + (lc or 0) + (pc or 0) + (oc or 0), 2)
    profit = round((sp or 0) - total_cost, 2)
    margin_pct = round((profit / sp) * 100.0, 1) if (sp and sp > 0) else 0

    return {
        "id": id,
        "selling_price": sp,
        "food_cost": fc,
        "labour_cost": lc,
        "packaging_cost": pc,
        "overhead_cost": oc,
        "total_internal_cost": total_cost,
        "internal_profit": profit,
        "margin_pct": margin_pct
    }

@app.get("/api/costing/ingredients")
def list_ingredients(
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "KITCHEN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    rows = db.execute("SELECT * FROM ingredients ORDER BY name ASC").fetchall()
    return [dict(r) for r in rows]

@app.post("/api/costing/ingredients")
def create_ingredient(
    ing: IngredientCreate,
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    effective = ing.purchase_price * (1.0 + (ing.wastage_pct or 0) / 100.0)
    cursor = db.execute('''
        INSERT INTO ingredients (name, unit, purchase_price, wastage_pct, effective_cost, supplier)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (ing.name, ing.unit, ing.purchase_price, ing.wastage_pct, effective, ing.supplier))
    db.commit()
    return {"id": cursor.lastrowid, **ing.dict(), "effective_cost": effective}

@app.get("/api/costing/labour")
def list_labour(
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    rows = db.execute("SELECT * FROM labour_types ORDER BY id ASC").fetchall()
    return [dict(r) for r in rows]

@app.get("/api/costing/packaging")
def list_packaging(
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    rows = db.execute("SELECT * FROM packaging_items ORDER BY id ASC").fetchall()
    return [dict(r) for r in rows]

@app.get("/api/costing/overheads")
def list_overheads(
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    rows = db.execute("SELECT * FROM overhead_rules ORDER BY id ASC").fetchall()
    return [dict(r) for r in rows]

# ==================== DASHBOARD & REPORTS ====================

@app.get("/api/reports/dashboard")
def get_dashboard_metrics(
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "SALESPERSON"])),
    db: sqlite3.Connection = Depends(get_db)
):
    quotation_stats = db.execute('''
        SELECT 
            COUNT(*) as total_quotations,
            SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_events,
            SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_quotations,
            SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent_quotations,
            SUM(grand_total) as total_pipeline_value,
            SUM(CASE WHEN status = 'CONFIRMED' THEN grand_total ELSE 0 END) as confirmed_revenue,
            AVG(grand_total / CASE WHEN guest_count > 0 THEN guest_count ELSE 1 END) as avg_price_per_person
        FROM quotations
    ''').fetchone()

    recent_quotations = db.execute('''
        SELECT q.id, q.quotation_number, q.guest_count, q.grand_total, q.status, q.created_at,
               c.name as client_name, e.event_type, e.venue
        FROM quotations q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN events e ON q.event_id = e.id
        ORDER BY q.id DESC LIMIT 5
    ''').fetchall()

    upcoming_events = db.execute('''
        SELECT e.*, c.name as client_name, c.phone as client_phone
        FROM events e
        LEFT JOIN clients c ON e.client_id = c.id
        WHERE e.status != 'CANCELLED'
        ORDER BY e.event_date ASC LIMIT 5
    ''').fetchall()

    # Status breakdown
    status_counts = db.execute('''
        SELECT status, COUNT(*) as count, SUM(grand_total) as value
        FROM quotations
        GROUP BY status
    ''').fetchall()

    return {
        "metrics": {
            "total_quotations": quotation_stats["total_quotations"] or 0,
            "confirmed_events": quotation_stats["confirmed_events"] or 0,
            "draft_quotations": quotation_stats["draft_quotations"] or 0,
            "sent_quotations": quotation_stats["sent_quotations"] or 0,
            "total_pipeline_value": quotation_stats["total_pipeline_value"] or 0.0,
            "confirmed_revenue": quotation_stats["confirmed_revenue"] or 0.0,
            "avg_price_per_person": round(quotation_stats["avg_price_per_person"] or 0.0, 2),
            "estimated_margin_pct": 32.4 if role in ["ADMIN", "MANAGER"] else None # Hide for Salesperson
        },
        "recent_quotations": [dict(r) for r in recent_quotations],
        "upcoming_events": [dict(r) for r in upcoming_events],
        "status_breakdown": [dict(r) for r in status_counts]
    }

# ==================== PRODUCTION SPA SERVING ====================
if FRONTEND_DIST.exists():
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="API endpoint not found")
        target_file = FRONTEND_DIST / full_path
        if target_file.exists() and target_file.is_file():
            return FileResponse(str(target_file))
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail="Page not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
