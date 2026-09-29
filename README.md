# B & Co — WEDDING EVENTS AND CATERS
### Luxury Catering Management & Interactive Quotation Platform

Designed and engineered specifically for **B & Co**, a premier Kerala wedding and catering company based out of Sasthamcotta, Kollam & Trivandrum.

---

## 🌟 Product Vision & Experience

Built for live banquet discussions where a B & Co salesperson or general manager sits with wedding clients to co-create custom catering proposals interactively.

### Key Capabilities
- **Interactive Proposal Builder (`/new-quotation`)**:
  - Live guest scaling stepper (`[-] 700 [+]`) with quick pills (`100`, `250`, `500`, `700`, `1000`).
  - Preloaded with the exact **Dr Liya Zara Saji Engagement (700 Pax)** reference from the B & Co official flyer via the **"Load Official Flyer Proposal (700 Pax)"** button.
  - Visual dish cards with Live Counter flame badges, seasonal availability warnings, and multi-unit support (`PER_PERSON`, `PER_KG`, `PER_EVENT`).
  - Sticky live quotation summary calculating plate rates, subtotal, permitted discounts, catering GST, and grand total in real-time.
- **Two Distinct Business Layers**:
  1. **Sales & Quotation Engine (Customer-Facing)**: Pure selling prices, quantities, and transparent final totals. Never exposes internal costs or margins.
  2. **Internal Costing Engine (Admin & Manager Only)**: Raw ingredient bill of materials, recipe wastage %, staff labour ratios (e.g. 1 server per 25 guests), food packaging, and logistics overheads.
- **Official B & Co PDF Proposal Generator**:
  - Server-side high-resolution PDF generation using Python ReportLab.
  - Features the official B & Co gold circular emblem, warm ivory/cream background (`#FAF7F2`), dual-column menu layout, terms & conditions, and contact hotlines (`+91 790 725 4973 | +91 9072 400 824`).
- **One-Click WhatsApp Distribution**:
  - Preformatted proposal summary with direct `https://wa.me/` dispatch and shareable link.
- **100% Database-Driven**:
  - Zero hardcoding. Dishes, categories, selling prices, labour wages, packaging items, overhead rules, and company terms are completely configurable from the Admin portal.

---

## 🎨 Brand & Visual Identity
- **Logo**: Official B & Co emblem with gold border, emerald green monogram, chef's toque, and banana leaf feast element.
- **Color Palette**:
  - Canvas: `#FAF7F2` (Warm ivory/cream from flyer)
  - Surface: `#FFFFFF` and `#F5EFEB` (Parchment cards)
  - Primary Brand: `#0E3321` (Deep Kerala heritage emerald)
  - Accent Foil: `#B9924B` (Refined antique gold)
- **Typography**:
  - Headings: `Playfair Display` & `Cormorant Garamond`
  - Body / Data: `Plus Jakarta Sans` with `tabular-nums`

---

## 🔐 Administrator Access
The application is configured exclusively for **Admin Portal Access**:
- **Default Admin Email**: `admin@bandco.com`
- **Default Admin Password**: `admin123`
- Full administrative capabilities: Quotation creation, price updates, menu dish management, PDF proposal generation, and cost control.

---

## 🚀 Free Cloud Hosting Guide (Render.com)

This repository includes a multi-stage `Dockerfile` and `render.yaml` for 100% free hosting on Render:

1. **Push this folder to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "B & Co Catering Portal"
   git remote add origin https://github.com/your-username/b-and-co-catering.git
   git push -u origin main
   ```
2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and sign in for free.
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository.
   - Select **Docker** as runtime (Render will automatically detect the `Dockerfile`).
   - Select the **Free** instance type.
   - Click **Deploy Web Service**!
   - In 2-3 minutes, you will get your live link (e.g. `https://b-and-co-catering.onrender.com`).

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+) with `fastapi`, `uvicorn`, and `reportlab`

### 1. Backend Startup
```bash
cd backend/app
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- SQLite Database: `backend/catering.db`

### 2. Frontend Startup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://127.0.0.1:5173`

---

## 👤 Demo Staff Accounts

| Role | Email | Password | Scope |
|:---|:---|:---|:---|
| **Administrator** | `admin@bandco.com` | `admin123` | Full access to catalog, pricing, costing, settings |
| **General Manager** | `manager@bandco.com` | `manager123` | Proposal approvals, pricing, margins |
| **Salesperson** | `sales@bandco.com` | `sales123` | Client proposal builder, zero costing access |
| **Head Chef** | `kitchen@bandco.com` | `kitchen123` | Confirmed banquet menus & recipe requirements |
| **Accounts** | `accounts@bandco.com` | `accounts123` | Billing, payments, client proposals |

*(Note: The application includes a Quick Role Switcher in the top navigation bar to test role permissions on the fly).*
