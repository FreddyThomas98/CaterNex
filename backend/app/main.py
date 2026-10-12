import os
import re
import json
import sqlite3
import hashlib
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Query, Header, Response, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import get_db, init_db, DB_PATH
from pdf_generator import generate_quotation_pdf, generate_purchase_list_pdf

app = FastAPI(
    title="CateringOS Multi-Tenant ERP & Procurement API",
    version="2.0.0",
    description="White-Label Multi-Tenant SaaS Platform for Catering Services & Banquet Operations"
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
FRONTEND_PUBLIC = Path(__file__).resolve().parent.parent.parent / "frontend" / "public"

UPLOADS_DISHES = FRONTEND_PUBLIC / "images" / "dishes"
UPLOADS_LOGOS = FRONTEND_PUBLIC / "images" / "logos"
UPLOADS_DISHES.mkdir(parents=True, exist_ok=True)
UPLOADS_LOGOS.mkdir(parents=True, exist_ok=True)

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend_assets")
elif ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "images").exists():
    app.mount("/images", StaticFiles(directory=str(FRONTEND_DIST / "images")), name="dist_images")
elif (FRONTEND_PUBLIC / "images").exists():
    app.mount("/images", StaticFiles(directory=str(FRONTEND_PUBLIC / "images")), name="public_images")

# Helper for passwords
def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    clean_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', file.filename.lower())
    target_path = UPLOADS_DISHES / clean_name
    content = await file.read()
    with open(target_path, "wb") as buffer:
        buffer.write(content)
    if FRONTEND_DIST.exists() and (FRONTEND_DIST / "images" / "dishes").exists():
        dist_path = FRONTEND_DIST / "images" / "dishes" / clean_name
        with open(dist_path, "wb") as buffer:
            buffer.write(content)
    return {"url": f"/images/dishes/{clean_name}", "filename": clean_name}

@app.post("/api/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    clean_name = f"logo_{re.sub(r'[^a-zA-Z0-9_\.-]', '_', file.filename.lower())}"
    target_path = UPLOADS_LOGOS / clean_name
    content = await file.read()
    with open(target_path, "wb") as buffer:
        buffer.write(content)
    if FRONTEND_DIST.exists() and (FRONTEND_DIST / "images" / "logos").exists():
        dist_path = FRONTEND_DIST / "images" / "logos" / clean_name
        with open(dist_path, "wb") as buffer:
            buffer.write(content)
    return {"url": f"/images/logos/{clean_name}", "filename": clean_name}

# ==================== AUTH & TENANT CONTEXT ====================

def get_current_user_context(
    authorization: Optional[str] = Header(None),
    x_tenant_id: Optional[str] = Header(None),
    db: sqlite3.Connection = Depends(get_db)
) -> dict:
    user_id = None
    user_role = "ADMIN"
    tenant_id = 1

    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        parts = token.split(":")
        if len(parts) >= 2:
            try:
                user_id = int(parts[0])
                u_row = db.execute("SELECT id, role, tenant_id, is_active FROM users WHERE id = ?", (user_id,)).fetchone()
                if u_row:
                    user_role = u_row["role"]
                    if user_role == "SUPER_ADMIN":
                        # Super admin can switch tenant via header or defaults to 1
                        if x_tenant_id:
                            try:
                                tenant_id = int(x_tenant_id)
                            except Exception:
                                tenant_id = 1
                        else:
                            tenant_id = 1
                    else:
                        tenant_id = u_row["tenant_id"] or 1
            except Exception:
                pass

    return {
        "user_id": user_id,
        "role": user_role,
        "tenant_id": tenant_id
    }

def require_roles(allowed_roles: List[str]):
    def role_checker(ctx: dict = Depends(get_current_user_context)):
        role = ctx["role"]
        if role != "SUPER_ADMIN" and role != "ADMIN" and role not in allowed_roles:
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

class TenantCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    tagline: Optional[str] = None
    logo_path: Optional[str] = "/images/default-catering-logo.png"
    phone1: Optional[str] = None
    phone2: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    location1: Optional[str] = None
    location2: Optional[str] = None
    gst_number: Optional[str] = None
    quotation_prefix: Optional[str] = "QT-"
    default_terms: Optional[str] = None
    currency_symbol: Optional[str] = "₹"
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None
    admin_password: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    logo_path: Optional[str] = None
    phone1: Optional[str] = None
    phone2: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    location1: Optional[str] = None
    location2: Optional[str] = None
    gst_number: Optional[str] = None
    quotation_prefix: Optional[str] = None
    default_terms: Optional[str] = None
    currency_symbol: Optional[str] = None
    is_active: Optional[int] = None

class TenantAdminUserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "ADMIN"

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
    service_type: Optional[str] = "STANDARD"
    pricing_unit: Optional[str] = "PER_PERSON"
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
    discount_type: Optional[str] = "PERCENTAGE"
    discount_value: Optional[float] = 0.0
    tax_percentage: Optional[float] = 5.0
    terms_and_conditions: Optional[str] = ""
    special_notes: Optional[str] = None
    created_by: Optional[str] = "Salesperson"

class IngredientCreate(BaseModel):
    name: str
    category: Optional[str] = "Spices & Groceries"
    unit: str
    purchase_price: float
    wastage_pct: Optional[float] = 5.0
    supplier: Optional[str] = None

class RecipeIngredientInput(BaseModel):
    ingredient_id: int
    quantity: float
    unit: str
    notes: Optional[str] = None

class RecipeCreate(BaseModel):
    menu_item_id: int
    portion_yield: int = 100
    instructions: Optional[str] = None
    prep_time_mins: Optional[int] = 60
    ingredients: List[RecipeIngredientInput] = []

class PurchaseItemStatusUpdate(BaseModel):
    ingredient_id: int
    is_purchased: int
    quantity_purchased: Optional[float] = None
    notes: Optional[str] = None

class SavePurchaseListRequest(BaseModel):
    notes: Optional[str] = None
    items: List[PurchaseItemStatusUpdate] = []

# ==================== AUTH & LOGIN ====================

@app.post("/api/auth/login")
def login(creds: LoginRequest, db: sqlite3.Connection = Depends(get_db)):
    pw_h = hash_pw(creds.password)
    user = db.execute(
        "SELECT id, email, full_name, role, max_discount_pct, is_active, tenant_id FROM users WHERE email = ? AND password_hash = ?",
        (creds.email.lower().strip(), pw_h)
    ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="User account is deactivated")

    tenant_info = None
    if user["role"] == "SUPER_ADMIN":
        # Super admin token
        token = f"{user['id']}:SUPER_ADMIN:{pw_h[:8]}"
        # Provide default tenant info
        first_t = db.execute("SELECT * FROM tenants ORDER BY id ASC LIMIT 1").fetchone()
        if first_t:
            tenant_info = dict(first_t)
    else:
        t_id = user["tenant_id"] or 1
        t_row = db.execute("SELECT * FROM tenants WHERE id = ?", (t_id,)).fetchone()
        if not t_row:
            # Fallback to company_settings
            s_row = db.execute("SELECT * FROM company_settings WHERE id = 1").fetchone()
            tenant_info = dict(s_row) if s_row else None
        else:
            tenant_info = dict(t_row)
        token = f"{user['id']}:{user['role']}:{pw_h[:8]}"

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "max_discount_pct": user["max_discount_pct"],
            "tenant_id": user["tenant_id"]
        },
        "tenant": tenant_info
    }

@app.get("/api/auth/users")
def list_users(
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    if ctx["role"] == "SUPER_ADMIN":
        rows = db.execute('''
            SELECT u.id, u.email, u.full_name, u.role, u.max_discount_pct, u.is_active, u.created_at, u.tenant_id, t.name as tenant_name
            FROM users u
            LEFT JOIN tenants t ON u.tenant_id = t.id
            ORDER BY u.id ASC
        ''').fetchall()
    else:
        rows = db.execute('''
            SELECT id, email, full_name, role, max_discount_pct, is_active, created_at, tenant_id
            FROM users
            WHERE tenant_id = ?
            ORDER BY id ASC
        ''', (ctx["tenant_id"],)).fetchall()
    return [dict(r) for r in rows]

# ==================== SUPER ADMIN TENANT PORTAL ====================

@app.get("/api/tenants")
def list_tenants(
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    require_roles(["SUPER_ADMIN"])(ctx)
    rows = db.execute('''
        SELECT t.*,
               (SELECT COUNT(*) FROM menu_items WHERE tenant_id = t.id) as item_count,
               (SELECT COUNT(*) FROM quotations WHERE tenant_id = t.id) as quotation_count,
               (SELECT COUNT(*) FROM events WHERE tenant_id = t.id) as event_count,
               (SELECT email FROM users WHERE tenant_id = t.id AND role = 'ADMIN' LIMIT 1) as admin_email
        FROM tenants t
        ORDER BY t.id ASC
    ''').fetchall()
    return [dict(r) for r in rows]

@app.post("/api/tenants")
def create_tenant(
    payload: TenantCreate,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    require_roles(["SUPER_ADMIN"])(ctx)
    slug = payload.slug or re.sub(r'[^a-zA-Z0-9-]', '-', payload.name.lower().strip())
    
    # Check slug uniqueness
    existing = db.execute("SELECT id FROM tenants WHERE slug = ?", (slug,)).fetchone()
    if existing:
        slug = f"{slug}-{int(os.urandom(2).hex(), 16)}"

    cursor = db.execute('''
        INSERT INTO tenants (
            name, slug, tagline, logo_path, phone1, phone2, email, website,
            location1, location2, gst_number, quotation_prefix, default_terms,
            currency_symbol, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ''', (
        payload.name, slug, payload.tagline, payload.logo_path,
        payload.phone1, payload.phone2, payload.email, payload.website,
        payload.location1, payload.location2, payload.gst_number,
        payload.quotation_prefix or "QT-", payload.default_terms,
        payload.currency_symbol or "₹"
    ))
    new_tenant_id = cursor.lastrowid

    # Create admin user if provided
    admin_user = None
    if payload.admin_email and payload.admin_password:
        p_hash = hash_pw(payload.admin_password)
        a_name = payload.admin_name or f"{payload.name} Admin"
        try:
            u_cur = db.execute('''
                INSERT INTO users (tenant_id, email, password_hash, full_name, role, max_discount_pct, is_active)
                VALUES (?, ?, ?, ?, 'ADMIN', 100.0, 1)
            ''', (new_tenant_id, payload.admin_email.lower().strip(), p_hash, a_name))
            admin_user = {"id": u_cur.lastrowid, "email": payload.admin_email, "full_name": a_name}
        except sqlite3.IntegrityError:
            pass

    # Clone base starter categories from tenant 1 if exists
    base_cats = db.execute("SELECT name, description, display_order FROM categories WHERE tenant_id = 1").fetchall()
    if base_cats:
        for c in base_cats:
            db.execute(
                "INSERT INTO categories (tenant_id, name, description, display_order, is_active) VALUES (?, ?, ?, ?, 1)",
                (new_tenant_id, c["name"], c["description"], c["display_order"])
            )
    else:
        # Default starter categories
        starter = [
            ("Beverages", "Welcome refreshments & juices", 1),
            ("Starters & Appetizers", "Hot & cold finger foods", 2),
            ("Main Course", "Biriyani, curries & roasts", 3),
            ("Breads & Rice", "Breads and flavored rice varieties", 4),
            ("Desserts", "Sweets & special dessert counter", 5),
        ]
        for name, desc, o in starter:
            db.execute("INSERT INTO categories (tenant_id, name, description, display_order, is_active) VALUES (?, ?, ?, ?, 1)",
                       (new_tenant_id, name, desc, o))

    # Clone basic starter ingredients from tenant 1 so recipes are easy to build
    base_ings = db.execute("SELECT name, category, unit, purchase_price, wastage_pct, supplier FROM ingredients WHERE tenant_id = 1").fetchall()
    for ing in base_ings:
        db.execute('''
            INSERT INTO ingredients (tenant_id, name, category, unit, purchase_price, wastage_pct, effective_cost, supplier)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (new_tenant_id, ing["name"], ing["category"], ing["unit"], ing["purchase_price"], ing["wastage_pct"],
              ing["purchase_price"] * (1 + (ing["wastage_pct"] or 5)/100.0), ing["supplier"]))

    db.commit()

    t_row = db.execute("SELECT * FROM tenants WHERE id = ?", (new_tenant_id,)).fetchone()
    res = dict(t_row)
    res["admin_user"] = admin_user
    return res

@app.get("/api/tenants/{id}")
def get_tenant(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    require_roles(["SUPER_ADMIN"])(ctx)
    row = db.execute("SELECT * FROM tenants WHERE id = ?", (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Tenant not found")
    t_data = dict(row)
    t_data["users"] = [dict(u) for u in db.execute("SELECT id, email, full_name, role, is_active FROM users WHERE tenant_id = ?", (id,)).fetchall()]
    return t_data

@app.put("/api/tenants/{id}")
def update_tenant(
    id: int,
    payload: TenantUpdate,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    # Only super admin or tenant's own admin can update
    if ctx["role"] != "SUPER_ADMIN" and ctx["tenant_id"] != id:
        raise HTTPException(status_code=403, detail="Forbidden")

    updates = []
    vals = []
    for k, v in payload.dict(exclude_unset=True).items():
        if v is not None:
            updates.append(f"{k} = ?")
            vals.append(v)
    if updates:
        vals.append(id)
        db.execute(f"UPDATE tenants SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", vals)
        db.commit()

    row = db.execute("SELECT * FROM tenants WHERE id = ?", (id,)).fetchone()
    return dict(row)

@app.post("/api/tenants/{id}/admin-user")
def create_tenant_admin(
    id: int,
    user_data: TenantAdminUserCreate,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    require_roles(["SUPER_ADMIN"])(ctx)
    pw_h = hash_pw(user_data.password)
    try:
        cursor = db.execute('''
            INSERT INTO users (tenant_id, email, password_hash, full_name, role, max_discount_pct, is_active)
            VALUES (?, ?, ?, ?, ?, 100.0, 1)
        ''', (id, user_data.email.lower().strip(), pw_h, user_data.full_name, user_data.role or "ADMIN"))
        db.commit()
        return {"id": cursor.lastrowid, "email": user_data.email, "full_name": user_data.full_name, "role": user_data.role}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

# ==================== TENANT SETTINGS ====================

@app.get("/api/settings")
def get_company_settings(
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    row = db.execute("SELECT * FROM tenants WHERE id = ?", (t_id,)).fetchone()
    if row:
        d = dict(row)
        d["company_name"] = d["name"]
        return d
    # Fallback to company_settings
    s = db.execute("SELECT * FROM company_settings WHERE id = 1").fetchone()
    return dict(s) if s else {}

@app.put("/api/settings")
def update_company_settings(
    settings: Dict[str, Any],
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    fields = ["name", "tagline", "phone1", "phone2", "email", "website", "location1", "location2", "gst_number", "quotation_prefix", "default_terms", "currency_symbol", "logo_path"]
    updates = []
    values = []
    for f in fields:
        val = settings.get(f) or (settings.get("company_name") if f == "name" else None)
        if val is not None:
            updates.append(f"{f} = ?")
            values.append(val)
    if updates:
        values.append(t_id)
        db.execute(f"UPDATE tenants SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", values)
        db.commit()

    row = db.execute("SELECT * FROM tenants WHERE id = ?", (t_id,)).fetchone()
    if row:
        d = dict(row)
        d["company_name"] = d["name"]
        return d
    return {}

# ==================== CATEGORIES ====================

@app.get("/api/categories")
def get_categories(
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    rows = db.execute('''
        SELECT c.*, COUNT(m.id) as item_count
        FROM categories c
        LEFT JOIN menu_items m ON c.id = m.category_id AND m.is_active = 1
        WHERE c.tenant_id = ?
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.id ASC
    ''', (t_id,)).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/categories")
def create_category(
    cat: CategoryCreate,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    cursor = db.execute(
        "INSERT INTO categories (tenant_id, name, description, display_order, is_active) VALUES (?, ?, ?, ?, ?)",
        (t_id, cat.name, cat.description, cat.display_order, cat.is_active)
    )
    db.commit()
    return {"id": cursor.lastrowid, **cat.dict()}

@app.put("/api/categories/{id}")
def update_category(
    id: int,
    cat: CategoryCreate,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute(
        "UPDATE categories SET name = ?, description = ?, display_order = ?, is_active = ? WHERE id = ? AND tenant_id = ?",
        (cat.name, cat.description, cat.display_order, cat.is_active, id, ctx["tenant_id"])
    )
    db.commit()
    return {"id": id, **cat.dict()}

@app.delete("/api/categories/{id}")
def delete_category(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute("DELETE FROM categories WHERE id = ? AND tenant_id = ?", (id, ctx["tenant_id"]))
    db.commit()
    return {"success": True, "message": "Category deleted"}

# ==================== MENU ITEMS ====================

@app.get("/api/menu-items")
def get_menu_items(
    category_id: Optional[int] = None,
    service_type: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = False,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    query = '''
        SELECT m.*, c.name as category_name,
               (SELECT COUNT(*) FROM recipe_ingredients ri JOIN recipes r ON ri.recipe_id = r.id WHERE r.menu_item_id = m.id) as ingredient_count
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.tenant_id = ?
    '''
    params = [t_id]
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
def get_menu_item(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    row = db.execute('''
        SELECT m.*, c.name as category_name
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.id = ? AND m.tenant_id = ?
    ''', (id, ctx["tenant_id"])).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return dict(row)

@app.post("/api/menu-items")
def create_menu_item(
    item: MenuItemCreate,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    sp = item.selling_price or 0.0
    fc = item.food_cost if item.food_cost is not None else round(sp * 0.40, 2)
    lc = item.labour_cost if item.labour_cost is not None else round(sp * 0.15, 2)
    pc = item.packaging_cost if item.packaging_cost is not None else round(sp * 0.05, 2)
    oc = item.overhead_cost if item.overhead_cost is not None else round(sp * 0.08, 2)

    cursor = db.execute('''
        INSERT INTO menu_items (
            tenant_id, category_id, name, description, image_url, service_type, pricing_unit,
            selling_price, food_cost, labour_cost, packaging_cost, overhead_cost,
            is_demo_price, is_seasonal, is_active, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        t_id, item.category_id, item.name, item.description, item.image_url,
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
def update_menu_item(
    id: int,
    item: MenuItemCreate,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    old_row = db.execute("SELECT selling_price, food_cost, labour_cost, packaging_cost, overhead_cost FROM menu_items WHERE id = ? AND tenant_id = ?", (id, t_id)).fetchone()
    if not old_row:
        raise HTTPException(status_code=404, detail="Item not found")

    sp = item.selling_price or 0.0
    fc = item.food_cost if item.food_cost is not None else (old_row["food_cost"] or round(sp * 0.40, 2))
    lc = item.labour_cost if item.labour_cost is not None else (old_row["labour_cost"] or round(sp * 0.15, 2))
    pc = item.packaging_cost if item.packaging_cost is not None else (old_row["packaging_cost"] or round(sp * 0.05, 2))
    oc = item.overhead_cost if item.overhead_cost is not None else (old_row["overhead_cost"] or round(sp * 0.08, 2))

    db.execute('''
        UPDATE menu_items SET
            category_id = ?, name = ?, description = ?, image_url = ?,
            service_type = ?, pricing_unit = ?, selling_price = ?,
            food_cost = ?, labour_cost = ?, packaging_cost = ?, overhead_cost = ?,
            is_demo_price = ?, is_seasonal = ?, is_active = ?, display_order = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
    ''', (
        item.category_id, item.name, item.description, item.image_url,
        item.service_type, item.pricing_unit, item.selling_price,
        fc, lc, pc, oc,
        item.is_demo_price, item.is_seasonal, item.is_active, item.display_order, id, t_id
    ))
    db.commit()
    return {"id": id, **item.dict(), "food_cost": fc, "labour_cost": lc, "packaging_cost": pc, "overhead_cost": oc}

@app.delete("/api/menu-items/{id}")
def delete_menu_item(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    db.execute("DELETE FROM price_history WHERE menu_item_id = ?", (id,))
    db.execute("DELETE FROM package_items WHERE menu_item_id = ?", (id,))
    db.execute("DELETE FROM recipes WHERE menu_item_id = ?", (id,))
    db.execute("UPDATE quotation_items SET menu_item_id = NULL WHERE menu_item_id = ?", (id,))
    db.execute("DELETE FROM menu_items WHERE id = ? AND tenant_id = ?", (id, t_id))
    db.commit()
    return {"success": True, "message": "Item deleted"}

# ==================== RECIPE MANAGEMENT ====================

@app.get("/api/recipes")
def list_recipes(
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    recipes = db.execute('''
        SELECT r.*, m.name as dish_name, m.selling_price, m.pricing_unit, c.name as category_name
        FROM recipes r
        JOIN menu_items m ON r.menu_item_id = m.id
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE r.tenant_id = ?
        ORDER BY m.name ASC
    ''', (t_id,)).fetchall()

    result = []
    for r in recipes:
        r_dict = dict(r)
        # Fetch ingredients
        ings = db.execute('''
            SELECT ri.*, i.name as ingredient_name, i.category as ingredient_category, i.purchase_price, i.wastage_pct, i.supplier
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = ?
            ORDER BY ri.id ASC
        ''', (r["id"],)).fetchall()
        
        # Calculate raw food cost per portion
        total_batch_cost = 0
        ing_list = []
        for ing in ings:
            ing_dict = dict(ing)
            eff_rate = ing["purchase_price"] * (1.0 + (ing["wastage_pct"] or 5.0) / 100.0)
            cost = ing["quantity"] * eff_rate
            total_batch_cost += cost
            ing_dict["line_cost"] = round(cost, 2)
            ing_list.append(ing_dict)

        yield_val = r["portion_yield"] if r["portion_yield"] > 0 else 100
        r_dict["total_batch_cost"] = round(total_batch_cost, 2)
        r_dict["cost_per_portion"] = round(total_batch_cost / yield_val, 2)
        r_dict["ingredients"] = ing_list
        result.append(r_dict)

    return result

@app.get("/api/recipes/item/{menu_item_id}")
def get_recipe_by_menu_item(
    menu_item_id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    r = db.execute('''
        SELECT r.*, m.name as dish_name, m.selling_price, m.pricing_unit, c.name as category_name
        FROM recipes r
        JOIN menu_items m ON r.menu_item_id = m.id
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE r.menu_item_id = ? AND r.tenant_id = ?
    ''', (menu_item_id, t_id)).fetchone()

    if not r:
        # Return empty template for this menu item
        m = db.execute("SELECT id, name, selling_price, pricing_unit FROM menu_items WHERE id = ? AND tenant_id = ?", (menu_item_id, t_id)).fetchone()
        if not m:
            raise HTTPException(status_code=404, detail="Menu item not found")
        return {
            "menu_item_id": menu_item_id,
            "dish_name": m["name"],
            "portion_yield": 100,
            "instructions": "",
            "prep_time_mins": 60,
            "ingredients": []
        }

    r_dict = dict(r)
    ings = db.execute('''
        SELECT ri.*, i.name as ingredient_name, i.category as ingredient_category, i.purchase_price, i.wastage_pct, i.supplier
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?
        ORDER BY ri.id ASC
    ''', (r["id"],)).fetchall()

    total_batch_cost = 0
    ing_list = []
    for ing in ings:
        ing_dict = dict(ing)
        eff_rate = ing["purchase_price"] * (1.0 + (ing["wastage_pct"] or 5.0) / 100.0)
        cost = ing["quantity"] * eff_rate
        total_batch_cost += cost
        ing_dict["line_cost"] = round(cost, 2)
        ing_list.append(ing_dict)

    yield_val = r["portion_yield"] if r["portion_yield"] > 0 else 100
    r_dict["total_batch_cost"] = round(total_batch_cost, 2)
    r_dict["cost_per_portion"] = round(total_batch_cost / yield_val, 2)
    r_dict["ingredients"] = ing_list
    return r_dict

@app.post("/api/recipes")
def save_recipe(
    recipe_data: RecipeCreate,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "KITCHEN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    # Check if recipe already exists for this menu_item_id
    existing = db.execute("SELECT id FROM recipes WHERE menu_item_id = ? AND tenant_id = ?", (recipe_data.menu_item_id, t_id)).fetchone()
    
    if existing:
        recipe_id = existing["id"]
        db.execute('''
            UPDATE recipes SET portion_yield = ?, instructions = ?, prep_time_mins = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (recipe_data.portion_yield, recipe_data.instructions, recipe_data.prep_time_mins, recipe_id))
        # Clear existing ingredients
        db.execute("DELETE FROM recipe_ingredients WHERE recipe_id = ?", (recipe_id,))
    else:
        cursor = db.execute('''
            INSERT INTO recipes (tenant_id, menu_item_id, portion_yield, instructions, prep_time_mins)
            VALUES (?, ?, ?, ?, ?)
        ''', (t_id, recipe_data.menu_item_id, recipe_data.portion_yield, recipe_data.instructions, recipe_data.prep_time_mins))
        recipe_id = cursor.lastrowid

    # Insert ingredients
    total_batch_cost = 0
    for ing in recipe_data.ingredients:
        db.execute('''
            INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (recipe_id, ing.ingredient_id, ing.quantity, ing.unit, ing.notes))

        # Get cost for calculating plate food_cost
        i_row = db.execute("SELECT purchase_price, wastage_pct FROM ingredients WHERE id = ?", (ing.ingredient_id,)).fetchone()
        if i_row:
            eff = i_row["purchase_price"] * (1.0 + (i_row["wastage_pct"] or 5.0)/100.0)
            total_batch_cost += ing.quantity * eff

    # Auto update menu_item food_cost based on recipe!
    yield_val = recipe_data.portion_yield if recipe_data.portion_yield > 0 else 100
    plate_food_cost = round(total_batch_cost / yield_val, 2)
    db.execute("UPDATE menu_items SET food_cost = ? WHERE id = ?", (plate_food_cost, recipe_data.menu_item_id))

    db.commit()
    return {"success": True, "recipe_id": recipe_id, "cost_per_portion": plate_food_cost}

@app.delete("/api/recipes/{id}")
def delete_recipe(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute("DELETE FROM recipe_ingredients WHERE recipe_id = ?", (id,))
    db.execute("DELETE FROM recipes WHERE id = ? AND tenant_id = ?", (id, ctx["tenant_id"]))
    db.commit()
    return {"success": True}

# ==================== INGREDIENTS MASTER ====================

@app.get("/api/ingredients")
def list_ingredients(
    category: Optional[str] = None,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    query = "SELECT * FROM ingredients WHERE tenant_id = ?"
    params = [t_id]
    if category:
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY category ASC, name ASC"
    rows = db.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/ingredients")
def create_ingredient(
    ing: IngredientCreate,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "KITCHEN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    effective = round(ing.purchase_price * (1.0 + (ing.wastage_pct or 0) / 100.0), 2)
    cursor = db.execute('''
        INSERT INTO ingredients (tenant_id, name, category, unit, purchase_price, wastage_pct, effective_cost, supplier)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (t_id, ing.name, ing.category or "Spices & Groceries", ing.unit, ing.purchase_price, ing.wastage_pct, effective, ing.supplier))
    db.commit()
    return {"id": cursor.lastrowid, **ing.dict(), "effective_cost": effective}

@app.put("/api/ingredients/{id}")
def update_ingredient(
    id: int,
    ing: IngredientCreate,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "KITCHEN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    effective = round(ing.purchase_price * (1.0 + (ing.wastage_pct or 0) / 100.0), 2)
    db.execute('''
        UPDATE ingredients SET name = ?, category = ?, unit = ?, purchase_price = ?, wastage_pct = ?, effective_cost = ?, supplier = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
    ''', (ing.name, ing.category, ing.unit, ing.purchase_price, ing.wastage_pct, effective, ing.supplier, id, ctx["tenant_id"]))
    db.commit()
    return {"id": id, **ing.dict(), "effective_cost": effective}

@app.delete("/api/ingredients/{id}")
def delete_ingredient(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute("DELETE FROM ingredients WHERE id = ? AND tenant_id = ?", (id, ctx["tenant_id"]))
    db.commit()
    return {"success": True}

# ==================== AUTOMATED EVENT PURCHASE LIST GENERATOR ====================

def calculate_purchase_requirements(
    guest_count: int,
    dishes_list: List[dict],
    tenant_id: int,
    db: sqlite3.Connection
) -> dict:
    aggregated_ingredients: Dict[int, dict] = {}
    missing_recipes = []

    for item in dishes_list:
        menu_item_id = item.get("menu_item_id")
        dish_name = item.get("item_name") or item.get("item_name_snapshot") or "Dish"
        item_qty = float(item.get("quantity", 1.0))
        pricing_unit = item.get("pricing_unit") or item.get("pricing_unit_snapshot") or "PER_PERSON"

        if not menu_item_id:
            # Try to find by name
            m_find = db.execute("SELECT id FROM menu_items WHERE name = ? AND tenant_id = ?", (dish_name, tenant_id)).fetchone()
            if m_find:
                menu_item_id = m_find["id"]

        if not menu_item_id:
            missing_recipes.append({"dish_name": dish_name, "reason": "Dish not linked to menu catalog"})
            continue

        recipe = db.execute("SELECT id, portion_yield FROM recipes WHERE menu_item_id = ? AND tenant_id = ?", (menu_item_id, tenant_id)).fetchone()
        if not recipe:
            missing_recipes.append({"dish_name": dish_name, "reason": "No recipe formula defined yet"})
            continue

        portion_yield = float(recipe["portion_yield"] or 100.0)
        # Scaling multiplier
        if pricing_unit == "PER_PERSON" or pricing_unit == "PER_PLATE":
            scale_mult = float(guest_count) / portion_yield
        else:
            scale_mult = item_qty / portion_yield

        # Query ingredients in recipe
        recipe_ings = db.execute('''
            SELECT ri.quantity, ri.unit, ri.notes, i.id as ing_id, i.name as ing_name, i.category as ing_cat, i.purchase_price, i.wastage_pct, i.supplier
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = ?
        ''', (recipe["id"],)).fetchall()

        for ri in recipe_ings:
            ing_id = ri["ing_id"]
            base_qty = float(ri["quantity"])
            wastage = float(ri["wastage_pct"] or 5.0)
            scaled_qty = round(scale_mult * base_qty * (1.0 + wastage / 100.0), 2)
            unit_price = float(ri["purchase_price"])

            if ing_id not in aggregated_ingredients:
                aggregated_ingredients[ing_id] = {
                    "ingredient_id": ing_id,
                    "ingredient_name": ri["ing_name"],
                    "category": ri["ing_cat"] or "Spices & Groceries",
                    "unit": ri["unit"],
                    "unit_price": unit_price,
                    "quantity_required": scaled_qty,
                    "total_price": round(scaled_qty * unit_price, 2),
                    "supplier": ri["supplier"] or "",
                    "dishes_used_in": [dish_name],
                    "is_purchased": 0,
                    "quantity_purchased": 0
                }
            else:
                aggregated_ingredients[ing_id]["quantity_required"] = round(aggregated_ingredients[ing_id]["quantity_required"] + scaled_qty, 2)
                aggregated_ingredients[ing_id]["total_price"] = round(aggregated_ingredients[ing_id]["quantity_required"] * unit_price, 2)
                if dish_name not in aggregated_ingredients[ing_id]["dishes_used_in"]:
                    aggregated_ingredients[ing_id]["dishes_used_in"].append(dish_name)

    # Sort and group by category
    items_list = list(aggregated_ingredients.values())
    items_list.sort(key=lambda x: (x["category"], x["ingredient_name"]))

    categories_grouped: Dict[str, list] = {}
    total_estimated_cost = 0.0

    for it in items_list:
        cat = it["category"]
        if cat not in categories_grouped:
            categories_grouped[cat] = []
        categories_grouped[cat].append(it)
        total_estimated_cost += it["total_price"]

    return {
        "total_estimated_cost": round(total_estimated_cost, 2),
        "total_items_count": len(items_list),
        "categories_grouped": categories_grouped,
        "items": items_list,
        "missing_recipes": missing_recipes
    }

@app.get("/api/events/{id}/purchase-list")
def get_event_purchase_list(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    event = db.execute("SELECT * FROM events WHERE id = ? AND tenant_id = ?", (id, t_id)).fetchone()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Find quotation for this event
    quote = db.execute("SELECT id, guest_count FROM quotations WHERE event_id = ? AND tenant_id = ? ORDER BY id DESC LIMIT 1", (id, t_id)).fetchone()
    guest_count = quote["guest_count"] if quote else event["guest_count"]
    
    dishes = []
    if quote:
        dishes = db.execute("SELECT * FROM quotation_items WHERE quotation_id = ?", (quote["id"],)).fetchall()
        dishes = [dict(d) for d in dishes]

    calc = calculate_purchase_requirements(guest_count, dishes, t_id, db)
    
    # Check if saved checklist exists
    saved_list = db.execute("SELECT id, status, notes FROM event_purchase_lists WHERE event_id = ?", (id,)).fetchone()
    if saved_list:
        saved_items = db.execute("SELECT * FROM event_purchase_items WHERE purchase_list_id = ?", (saved_list["id"],)).fetchall()
        saved_map = {si["ingredient_id"]: dict(si) for si in saved_items}
        for it in calc["items"]:
            if it["ingredient_id"] in saved_map:
                it["is_purchased"] = saved_map[it["ingredient_id"]]["is_purchased"]
                it["quantity_purchased"] = saved_map[it["ingredient_id"]]["quantity_purchased"]
                it["notes"] = saved_map[it["ingredient_id"]]["notes"]

    return {
        "event": dict(event),
        "guest_count": guest_count,
        **calc
    }

@app.get("/api/quotations/{id}/purchase-list")
def get_quotation_purchase_list(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    quote = db.execute("SELECT * FROM quotations WHERE id = ? AND tenant_id = ?", (id, t_id)).fetchone()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")

    dishes = db.execute("SELECT * FROM quotation_items WHERE quotation_id = ?", (id,)).fetchall()
    calc = calculate_purchase_requirements(quote["guest_count"], [dict(d) for d in dishes], t_id, db)

    return {
        "quotation": dict(quote),
        "guest_count": quote["guest_count"],
        **calc
    }

@app.post("/api/events/{id}/save-purchase-list")
def save_event_purchase_list(
    id: int,
    payload: SavePurchaseListRequest,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "KITCHEN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    existing = db.execute("SELECT id FROM event_purchase_lists WHERE event_id = ?", (id,)).fetchone()
    if existing:
        list_id = existing["id"]
        db.execute("UPDATE event_purchase_lists SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (payload.notes, list_id))
    else:
        cursor = db.execute("INSERT INTO event_purchase_lists (tenant_id, event_id, notes) VALUES (?, ?, ?)", (t_id, id, payload.notes))
        list_id = cursor.lastrowid

    for item in payload.items:
        db.execute('''
            INSERT OR REPLACE INTO event_purchase_items (purchase_list_id, ingredient_id, ingredient_name, quantity_required, quantity_purchased, unit, is_purchased, notes)
            VALUES (?, ?, '', 0, ?, '', ?, ?)
        ''', (list_id, item.ingredient_id, item.quantity_purchased or 0, item.is_purchased, item.notes))

    db.commit()
    return {"success": True, "list_id": list_id}

@app.get("/api/events/{id}/purchase-list/pdf")
def export_purchase_list_pdf(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    event = db.execute("SELECT * FROM events WHERE id = ? AND tenant_id = ?", (id, t_id)).fetchone()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    quote = db.execute("SELECT id, guest_count FROM quotations WHERE event_id = ? AND tenant_id = ? ORDER BY id DESC LIMIT 1", (id, t_id)).fetchone()
    guest_count = quote["guest_count"] if quote else event["guest_count"]
    dishes = db.execute("SELECT * FROM quotation_items WHERE quotation_id = ?", (quote["id"],)).fetchall() if quote else []
    calc = calculate_purchase_requirements(guest_count, [dict(d) for d in dishes], t_id, db)

    # Tenant company settings
    tenant = db.execute("SELECT * FROM tenants WHERE id = ?", (t_id,)).fetchone()
    tenant_dict = dict(tenant) if tenant else {}

    pdf_bytes = generate_purchase_list_pdf(dict(event), calc["items"], tenant_dict)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Purchase_List_Event_{id}.pdf"}
    )

# ==================== CLIENTS ====================

@app.get("/api/clients")
def list_clients(
    search: Optional[str] = None,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    query = "SELECT * FROM clients WHERE tenant_id = ?"
    params = [t_id]
    if search:
        query += " AND (name LIKE ? OR phone LIKE ? OR company LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    query += " ORDER BY id DESC"
    rows = db.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/clients")
def create_client(
    client: ClientCreate,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    cursor = db.execute('''
        INSERT INTO clients (tenant_id, name, company, phone, email, address, gst_number, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (t_id, client.name, client.company, client.phone, client.email, client.address, client.gst_number, client.notes))
    db.commit()
    return {"id": cursor.lastrowid, **client.dict()}

@app.get("/api/clients/{id}")
def get_client(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    row = db.execute("SELECT * FROM clients WHERE id = ? AND tenant_id = ?", (id, t_id)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")
    client_dict = dict(row)
    quotations = db.execute("SELECT * FROM quotations WHERE client_id = ? AND tenant_id = ? ORDER BY id DESC", (id, t_id)).fetchall()
    events = db.execute("SELECT * FROM events WHERE client_id = ? AND tenant_id = ? ORDER BY id DESC", (id, t_id)).fetchall()
    client_dict["quotations"] = [dict(q) for q in quotations]
    client_dict["events"] = [dict(e) for e in events]
    return client_dict

@app.put("/api/clients/{id}")
def update_client(
    id: int,
    client: ClientCreate,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute('''
        UPDATE clients SET name = ?, company = ?, phone = ?, email = ?, address = ?, gst_number = ?, notes = ?
        WHERE id = ? AND tenant_id = ?
    ''', (client.name, client.company, client.phone, client.email, client.address, client.gst_number, client.notes, id, ctx["tenant_id"]))
    db.commit()
    return {"id": id, **client.dict()}

@app.delete("/api/clients/{id}")
def delete_client(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN"])),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute("DELETE FROM clients WHERE id = ? AND tenant_id = ?", (id, ctx["tenant_id"]))
    db.commit()
    return {"success": True}

# ==================== EVENTS ====================

@app.get("/api/events")
def list_events(
    status: Optional[str] = None,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    query = '''
        SELECT e.*, c.name as client_name, c.phone as client_phone
        FROM events e
        LEFT JOIN clients c ON e.client_id = c.id
        WHERE e.tenant_id = ?
    '''
    params = [t_id]
    if status:
        query += " AND e.status = ?"
        params.append(status)
    query += " ORDER BY e.event_date ASC, e.id DESC"
    rows = db.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/events")
def create_event(
    event: EventCreate,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    cursor = db.execute('''
        INSERT INTO events (tenant_id, client_id, event_type, event_date, event_time, venue, venue_address, guest_count, status, special_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (t_id, event.client_id, event.event_type, event.event_date, event.event_time, event.venue, event.venue_address, event.guest_count, event.status, event.special_notes))
    db.commit()
    return {"id": cursor.lastrowid, **event.dict()}

@app.put("/api/events/{id}")
def update_event(
    id: int,
    event: EventCreate,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute('''
        UPDATE events SET client_id = ?, event_type = ?, event_date = ?, event_time = ?, venue = ?, venue_address = ?, guest_count = ?, status = ?, special_notes = ?
        WHERE id = ? AND tenant_id = ?
    ''', (event.client_id, event.event_type, event.event_date, event.event_time, event.venue, event.venue_address, event.guest_count, event.status, event.special_notes, id, ctx["tenant_id"]))
    db.commit()
    return {"id": id, **event.dict()}

@app.delete("/api/events/{id}")
def delete_event(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute("UPDATE quotations SET event_id = NULL WHERE event_id = ?", (id,))
    db.execute("DELETE FROM events WHERE id = ? AND tenant_id = ?", (id, ctx["tenant_id"]))
    db.commit()
    return {"success": True, "message": "Event removed"}

# ==================== QUOTATIONS ====================

def generate_quotation_number(tenant_id: int, db: sqlite3.Connection) -> str:
    tenant = db.execute("SELECT quotation_prefix FROM tenants WHERE id = ?", (tenant_id,)).fetchone()
    prefix = tenant["quotation_prefix"] if tenant and tenant["quotation_prefix"] else "QT-2026-"
    last = db.execute("SELECT id FROM quotations WHERE tenant_id = ? ORDER BY id DESC LIMIT 1", (tenant_id,)).fetchone()
    next_num = (last["id"] + 1) if last else 1
    return f"{prefix}{next_num:06d}"

@app.get("/api/quotations")
def list_quotations(
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    search: Optional[str] = None,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    query = '''
        SELECT q.*, c.name as client_name, c.phone as client_phone, e.event_type, e.event_date, e.venue
        FROM quotations q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN events e ON q.event_id = e.id
        WHERE q.tenant_id = ?
    '''
    params = [t_id]
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
def get_quotation_detail(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    q_row = db.execute('''
        SELECT q.*, c.name as client_name, c.company as client_company, c.phone as client_phone, c.email as client_email, c.address as client_address,
               e.event_type, e.event_date, e.event_time, e.venue, e.venue_address
        FROM quotations q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN events e ON q.event_id = e.id
        WHERE q.id = ? AND q.tenant_id = ?
    ''', (id, t_id)).fetchone()
    if not q_row:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    q_data = dict(q_row)
    items = db.execute("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC", (id,)).fetchall()
    addons = db.execute("SELECT * FROM quotation_addons WHERE quotation_id = ? ORDER BY id ASC", (id,)).fetchall()
    q_data["items"] = [dict(i) for i in items]
    q_data["addons"] = [dict(a) for a in addons]
    
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
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER", "SALESPERSON"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    client_id = payload.client_id
    if not client_id and payload.client_name:
        cur = db.execute(
            "INSERT INTO clients (tenant_id, name, phone, address) VALUES (?, ?, ?, ?)",
            (t_id, payload.client_name, payload.client_phone or "", payload.client_address or "")
        )
        client_id = cur.lastrowid

    event_id = payload.event_id
    if not event_id and payload.event_type:
        cur = db.execute(
            "INSERT INTO events (tenant_id, client_id, event_type, event_date, venue, venue_address, guest_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (t_id, client_id, payload.event_type, payload.event_date or "", payload.venue or "", payload.venue_address or "", payload.guest_count)
        )
        event_id = cur.lastrowid

    # Calculate subtotal
    subtotal = 0.0
    for it in payload.items:
        if it.pricing_unit == "PER_PERSON" or it.pricing_unit == "PER_PLATE":
            subtotal += (it.selling_price * payload.guest_count)
        else:
            subtotal += (it.selling_price * it.quantity)
    for ad in payload.addons:
        subtotal += (ad.selling_price * ad.quantity)

    # Discount
    discount_amount = 0.0
    if payload.discount_type == "PERCENTAGE":
        discount_amount = (subtotal * (payload.discount_value or 0)) / 100.0
    else:
        discount_amount = payload.discount_value or 0.0

    discounted_subtotal = max(0.0, subtotal - discount_amount)
    tax_pct = payload.tax_percentage if payload.tax_percentage is not None else 5.0
    tax_amount = round((discounted_subtotal * tax_pct) / 100.0, 2)
    grand_total = discounted_subtotal + tax_amount

    quotation_number = generate_quotation_number(t_id, db)
    cursor = db.execute('''
        INSERT INTO quotations (
            tenant_id, quotation_number, client_id, event_id, guest_count, subtotal,
            discount_type, discount_value, discount_amount, tax_percentage, tax_amount, grand_total,
            status, terms_and_conditions, special_notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)
    ''', (
        t_id, quotation_number, client_id, event_id, payload.guest_count, subtotal,
        payload.discount_type, payload.discount_value, discount_amount, tax_pct, tax_amount, grand_total,
        payload.terms_and_conditions, payload.special_notes, payload.created_by or "Staff"
    ))
    new_q_id = cursor.lastrowid

    # Items
    for it in payload.items:
        line_tot = (it.selling_price * payload.guest_count) if (it.pricing_unit in ["PER_PERSON", "PER_PLATE"]) else (it.selling_price * it.quantity)
        db.execute('''
            INSERT INTO quotation_items (
                quotation_id, menu_item_id, item_name_snapshot, category_snapshot,
                service_type_snapshot, pricing_unit_snapshot, selling_price_snapshot,
                quantity, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (new_q_id, it.menu_item_id, it.item_name, it.category, it.service_type, it.pricing_unit, it.selling_price, it.quantity, line_tot))

    # Addons
    for ad in payload.addons:
        line_tot = ad.selling_price * ad.quantity
        db.execute('''
            INSERT INTO quotation_addons (
                quotation_id, addon_id, name_snapshot, pricing_unit_snapshot,
                selling_price_snapshot, quantity, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (new_q_id, ad.addon_id, ad.name, ad.pricing_unit, ad.selling_price, ad.quantity, line_tot))

    db.commit()
    return {"id": new_q_id, "quotation_number": quotation_number, "grand_total": grand_total}

@app.put("/api/quotations/{id}/status")
def update_quotation_status(
    id: int,
    status_update: Dict[str, str],
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    new_status = status_update.get("status", "DRAFT")
    db.execute("UPDATE quotations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?", (new_status, id, ctx["tenant_id"]))
    db.commit()
    return {"success": True, "status": new_status}

@app.delete("/api/quotations/{id}")
def delete_quotation(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    db.execute("DELETE FROM quotation_items WHERE quotation_id = ?", (id,))
    db.execute("DELETE FROM quotation_addons WHERE quotation_id = ?", (id,))
    db.execute("DELETE FROM quotations WHERE id = ? AND tenant_id = ?", (id, ctx["tenant_id"]))
    db.commit()
    return {"success": True}

# ==================== PDF GENERATION ====================

@app.get("/api/quotations/{id}/pdf")
def get_quotation_pdf(
    id: int,
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    q_row = db.execute('''
        SELECT q.*, c.name as client_name, c.company as client_company, c.phone as client_phone, c.email as client_email, c.address as client_address,
               e.event_type, e.event_date, e.venue, e.venue_address
        FROM quotations q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN events e ON q.event_id = e.id
        WHERE q.id = ? AND q.tenant_id = ?
    ''', (id, t_id)).fetchone()
    if not q_row:
        raise HTTPException(status_code=404, detail="Quotation not found")

    q_data = dict(q_row)
    q_data["items"] = [dict(i) for i in db.execute("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC", (id,)).fetchall()]
    q_data["addons"] = [dict(a) for a in db.execute("SELECT * FROM quotation_addons WHERE quotation_id = ? ORDER BY id ASC", (id,)).fetchall()]
    q_data["client"] = {"name": q_data["client_name"], "phone": q_data["client_phone"], "address": q_data["client_address"]}
    q_data["event"] = {"event_type": q_data["event_type"], "event_date": q_data["event_date"], "venue": q_data["venue"]}

    # Tenant details
    tenant = db.execute("SELECT * FROM tenants WHERE id = ?", (t_id,)).fetchone()
    tenant_dict = dict(tenant) if tenant else {}

    pdf_bytes = generate_quotation_pdf(q_data, tenant_dict)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={q_data['quotation_number']}.pdf"}
    )

# ==================== COSTING & PROFITABILITY ====================

@app.get("/api/costing/overview")
def get_costing_overview(
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    items = db.execute('''
        SELECT id, name, pricing_unit, selling_price, category_id,
               food_cost, labour_cost, packaging_cost, overhead_cost
        FROM menu_items
        WHERE tenant_id = ? AND is_active = 1 AND selling_price IS NOT NULL
        ORDER BY id ASC
    ''', (t_id,)).fetchall()

    total_selling = 0
    total_cost = 0
    item_analysis = []
    
    for item in items:
        sp = item["selling_price"] or 0.0
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
    ctx: dict = Depends(get_current_user_context),
    role: str = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
    row = db.execute("SELECT * FROM menu_items WHERE id = ? AND tenant_id = ?", (id, t_id)).fetchone()
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
        WHERE id = ? AND tenant_id = ?
    ''', (sp, fc, lc, pc, oc, id, t_id))
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

# ==================== DASHBOARD & METRICS ====================

@app.get("/api/reports/dashboard")
def get_dashboard_metrics(
    ctx: dict = Depends(get_current_user_context),
    db: sqlite3.Connection = Depends(get_db)
):
    t_id = ctx["tenant_id"]
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
        WHERE tenant_id = ?
    ''', (t_id,)).fetchone()

    recent_quotations = db.execute('''
        SELECT q.id, q.quotation_number, q.guest_count, q.grand_total, q.status, q.created_at,
               c.name as client_name, e.event_type, e.venue
        FROM quotations q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN events e ON q.event_id = e.id
        WHERE q.tenant_id = ?
        ORDER BY q.id DESC LIMIT 5
    ''', (t_id,)).fetchall()

    upcoming_events = db.execute('''
        SELECT e.*, c.name as client_name, c.phone as client_phone
        FROM events e
        LEFT JOIN clients c ON e.client_id = c.id
        WHERE e.tenant_id = ? AND e.status != 'CANCELLED'
        ORDER BY e.event_date ASC LIMIT 5
    ''', (t_id,)).fetchall()

    status_counts = db.execute('''
        SELECT status, COUNT(*) as count, SUM(grand_total) as value
        FROM quotations
        WHERE tenant_id = ?
        GROUP BY status
    ''', (t_id,)).fetchall()

    return {
        "metrics": {
            "total_quotations": quotation_stats["total_quotations"] or 0,
            "confirmed_events": quotation_stats["confirmed_events"] or 0,
            "draft_quotations": quotation_stats["draft_quotations"] or 0,
            "sent_quotations": quotation_stats["sent_quotations"] or 0,
            "total_pipeline_value": quotation_stats["total_pipeline_value"] or 0.0,
            "confirmed_revenue": quotation_stats["confirmed_revenue"] or 0.0,
            "avg_price_per_person": round(quotation_stats["avg_price_per_person"] or 0.0, 2),
            "estimated_margin_pct": 32.4
        },
        "recent_quotations": [dict(r) for r in recent_quotations],
        "upcoming_events": [dict(r) for r in upcoming_events],
        "status_breakdown": [dict(r) for r in status_counts]
    }

# ==================== SPA ROUTING ====================

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
