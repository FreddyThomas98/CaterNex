import os
from io import BytesIO
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
from reportlab.pdfgen import canvas

# Theme Palette: Elegant Warm Ivory, Deep Emerald, Rich Gold Accent
CREAM_BG = colors.HexColor("#FAF8F5")
EMERALD_DARK = colors.HexColor("#0D3522")
EMERALD_LIGHT = colors.HexColor("#1A5338")
GOLD_ACCENT = colors.HexColor("#A88344")
GOLD_MUTED = colors.HexColor("#D8C39D")
TEXT_DARK = colors.HexColor("#1F2923")
TEXT_MUTED = colors.HexColor("#5D6D63")
WHITE = colors.HexColor("#FFFFFF")
ROW_BG = colors.HexColor("#F3EDE2")

def resolve_logo_file(logo_path_str: str) -> Path:
    if not logo_path_str:
        return None
    # If absolute path
    p = Path(logo_path_str)
    if p.exists() and p.is_file():
        return p
    # Try frontend public
    clean = logo_path_str.lstrip("/").replace("\\", "/")
    pub_p = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / clean
    if pub_p.exists() and pub_p.is_file():
        return pub_p
    # Try assets
    asset_p = Path(__file__).resolve().parent.parent.parent / "assets" / clean
    if asset_p.exists() and asset_p.is_file():
        return asset_p
    return None

class DynamicNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(DynamicNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []
        self.company_name = getattr(self, "company_name", "Catering Services")
        self.contact_str = getattr(self, "contact_str", "")
        self.location_str = getattr(self, "location_str", "")

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Header running line
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(EMERALD_DARK)
        self.drawString(36, A4[1] - 32, self.company_name.upper())
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        if self.contact_str:
            self.drawRightString(A4[0] - 36, A4[1] - 32, self.contact_str)

        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        if self.location_str:
            self.drawString(36, 28, self.location_str)
        self.drawRightString(A4[0] - 36, 28, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def make_canvas_maker(company_settings: dict):
    comp_name = company_settings.get("company_name") or company_settings.get("name") or "Catering Services"
    p1 = company_settings.get("phone1", "")
    p2 = company_settings.get("phone2", "")
    contact_parts = [p for p in [p1, p2] if p]
    contact_str = " | ".join(contact_parts)
    
    loc1 = company_settings.get("location1", "")
    loc2 = company_settings.get("location2", "")
    loc_parts = [l for l in [loc1, loc2] if l]
    location_str = " | ".join(loc_parts)

    class CustomCanvas(DynamicNumberedCanvas):
        def __init__(self, *args, **kwargs):
            self.company_name = comp_name
            self.contact_str = contact_str
            self.location_str = location_str
            super(CustomCanvas, self).__init__(*args, **kwargs)

    return CustomCanvas

def generate_quotation_pdf(quotation_data: dict, company_settings: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=48,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=EMERALD_DARK,
        alignment=0
    )
    
    tagline_style = ParagraphStyle(
        'Tagline',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=GOLD_ACCENT,
        alignment=0
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=EMERALD_DARK,
        spaceAfter=4
    )

    cat_title_style = ParagraphStyle(
        'CatTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=GOLD_ACCENT,
        spaceBefore=8,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK
    )

    muted_style = ParagraphStyle(
        'Muted',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_MUTED
    )

    story = []

    # 1. Dynamic Header with Logo & Tenant Brand
    comp_name = company_settings.get("company_name") or company_settings.get("name") or "Catering Services"
    comp_tagline = company_settings.get("tagline") or "Events & Banquet Catering"
    logo_file = resolve_logo_file(company_settings.get("logo_path"))

    if logo_file:
        try:
            logo_img = Image(str(logo_file), width=70, height=70)
            text_cell = [
                Paragraph(comp_name, title_style),
                Paragraph(comp_tagline, tagline_style),
                Spacer(1, 4),
                Paragraph(f"<b>Quotation #:</b> {quotation_data.get('quotation_number', 'QT-0001')} | <b>Date:</b> {str(quotation_data.get('created_at', ''))[:10]}", muted_style)
            ]
            header_table = Table([[logo_img, text_cell]], colWidths=[80, 440])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(header_table)
        except Exception:
            story.append(Paragraph(comp_name, title_style))
            story.append(Paragraph(comp_tagline, tagline_style))
            story.append(Spacer(1, 4))
    else:
        story.append(Paragraph(comp_name, title_style))
        story.append(Paragraph(comp_tagline, tagline_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>Quotation #:</b> {quotation_data.get('quotation_number', 'QT-0001')} | <b>Date:</b> {str(quotation_data.get('created_at', ''))[:10]}", muted_style))

    story.append(HRFlowable(width="100%", thickness=1, color=GOLD_MUTED, spaceBefore=4, spaceAfter=8))

    # 2. Client & Event Details Box
    client = quotation_data.get("client", {}) or {}
    event = quotation_data.get("event", {}) or {}
    client_name = quotation_data.get("client_name") or client.get("name") or ""
    client_phone = quotation_data.get("client_phone") or client.get("phone") or ""
    client_address = quotation_data.get("client_address") or client.get("address") or ""
    
    event_type = quotation_data.get("event_type") or event.get("event_type") or ""
    event_date = quotation_data.get("event_date") or event.get("event_date") or ""
    venue = quotation_data.get("venue") or event.get("venue") or ""
    venue_address = quotation_data.get("venue_address") or event.get("venue_address") or ""
    guest_count = quotation_data.get("guest_count", 500)

    client_lines = []
    if client_name: client_lines.append(f"<b>CLIENT:</b> {client_name}")
    if client_phone: client_lines.append(f"<b>PHONE:</b> {client_phone}")
    if client_address: client_lines.append(f"<b>ADDRESS:</b> {client_address}")
    client_info = "<br/>".join(client_lines) if client_lines else "<b>CLIENT:</b> Valued Customer"
    
    event_lines = []
    if event_type:
        event_lines.append(f"<b>OCCASION:</b> {event_type}")
    if guest_count:
        event_lines.append(f"<b>GUEST COUNT:</b> <font color='{GOLD_ACCENT}'><b>{guest_count} Servings / Plates</b></font>")
    if event_date:
        event_lines.append(f"<b>DATE:</b> {event_date}")
    if venue:
        v_full = f"{venue}, {venue_address}" if venue_address else venue
        event_lines.append(f"<b>VENUE:</b> {v_full}")
    event_info = "<br/>".join(event_lines) if event_lines else f"<b>GUEST COUNT:</b> {guest_count} Servings"

    details_table = Table([
        [Paragraph(client_info, body_style), Paragraph(event_info, body_style)]
    ], colWidths=[260, 260])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ROW_BG),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEBEFORE', (1,0), (1,0), 0.5, GOLD_MUTED),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 10))

    # 3. Menu Items by Category
    currency = company_settings.get("currency_symbol", "₹")
    items = quotation_data.get("items", []) or []

    categories_order = []
    items_by_cat = {}
    for item in items:
        cat = item.get("category_snapshot") or item.get("category") or "Menu Selection"
        if cat not in items_by_cat:
            items_by_cat[cat] = []
            categories_order.append(cat)
        items_by_cat[cat].append(item)

    table_data = [
        [
            Paragraph("<b>#</b>", muted_style),
            Paragraph("<b>Selected Item / Dish</b>", muted_style),
            Paragraph("<b>Type</b>", muted_style),
            Paragraph("<b>Rate</b>", muted_style),
            Paragraph("<b>Total</b>", muted_style)
        ]
    ]

    item_idx = 1
    for cat in categories_order:
        table_data.append([
            "",
            Paragraph(f"<b>{cat.upper()}</b>", cat_title_style),
            "",
            "",
            ""
        ])
        for it in items_by_cat[cat]:
            name = it.get("item_name_snapshot") or it.get("item_name") or ""
            st = (it.get("service_type_snapshot") or it.get("service_type") or "STANDARD").replace("_", " ").title()
            price = it.get("selling_price_snapshot") or it.get("selling_price") or 0
            unit = it.get("pricing_unit_snapshot") or it.get("pricing_unit") or "PER_PERSON"
            line_tot = it.get("line_total") or (price * guest_count if unit == "PER_PERSON" else price * it.get("quantity", 1))

            unit_label = "/pax" if unit == "PER_PERSON" else f"/{unit.replace('PER_', '').lower()}"
            table_data.append([
                Paragraph(str(item_idx), muted_style),
                Paragraph(name, body_style),
                Paragraph(st, muted_style),
                Paragraph(f"{currency} {price:,.2f} {unit_label}", body_style),
                Paragraph(f"<b>{currency} {line_tot:,.2f}</b>", body_style)
            ])
            item_idx += 1

    menu_table = Table(table_data, colWidths=[24, 250, 75, 95, 76])
    menu_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,0), 1, EMERALD_DARK),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,1), (-1,-1), 4),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
    ]))
    story.append(menu_table)
    story.append(Spacer(1, 10))

    # 4. Financial Summary
    subtotal = quotation_data.get("subtotal", 0)
    discount_amount = quotation_data.get("discount_amount", 0)
    tax_percentage = quotation_data.get("tax_percentage", 5.0)
    tax_amount = quotation_data.get("tax_amount", 0)
    grand_total = quotation_data.get("grand_total", 0)

    summary_rows = [
        [Paragraph("<b>Subtotal:</b>", body_style), Paragraph(f"<b>{currency} {subtotal:,.2f}</b>", body_style)]
    ]
    if discount_amount > 0:
        summary_rows.append([
            Paragraph("<b>Discount:</b>", body_style),
            Paragraph(f"- {currency} {discount_amount:,.2f}", body_style)
        ])
    if tax_amount > 0:
        summary_rows.append([
            Paragraph(f"<b>Tax / GST ({tax_percentage}%):</b>", body_style),
            Paragraph(f"{currency} {tax_amount:,.2f}", body_style)
        ])
    summary_rows.append([
        Paragraph("<b>GRAND TOTAL:</b>", h2_style),
        Paragraph(f"<b>{currency} {grand_total:,.2f}</b>", h2_style)
    ])

    summary_table = Table(summary_rows, colWidths=[360, 160])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LINEABOVE', (0,-1), (-1,-1), 1, GOLD_ACCENT),
    ]))
    story.append(KeepTogether(summary_table))

    # 5. Terms & Conditions
    terms = quotation_data.get("terms_and_conditions") or company_settings.get("default_terms") or ""
    if terms:
        story.append(Spacer(1, 12))
        terms_cell = [
            Paragraph("<b>TERMS & CONDITIONS</b>", cat_title_style),
            Spacer(1, 3),
            Paragraph(terms.replace("\n", "<br/>"), muted_style)
        ]
        terms_table = Table([[terms_cell]], colWidths=[520])
        terms_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), ROW_BG),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(KeepTogether(terms_table))

    canvas_class = make_canvas_maker(company_settings)
    doc.build(story, canvasmaker=canvas_class)
    return buffer.getvalue()

def generate_purchase_list_pdf(event_data: dict, purchase_items: list, company_settings: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=48,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=EMERALD_DARK
    )
    cat_title_style = ParagraphStyle(
        'CatTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=GOLD_ACCENT,
        spaceBefore=6,
        spaceAfter=2
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK
    )
    muted_style = ParagraphStyle(
        'Muted',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=TEXT_MUTED
    )

    story = []
    comp_name = company_settings.get("company_name") or company_settings.get("name") or "Catering Services"
    currency = company_settings.get("currency_symbol", "₹")

    story.append(Paragraph(f"{comp_name.upper()} - KITCHEN PROCUREMENT & PURCHASE ORDER", title_style))
    story.append(Spacer(1, 4))

    ev_type = event_data.get("event_type", "Catering Event")
    ev_date = event_data.get("event_date", "")
    guests = event_data.get("guest_count", 0)
    venue = event_data.get("venue", "")
    ev_info = f"<b>Event:</b> {ev_type} | <b>Date:</b> {ev_date} | <b>Headcount:</b> {guests} Guests | <b>Venue:</b> {venue}"
    story.append(Paragraph(ev_info, muted_style))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD_MUTED, spaceBefore=4, spaceAfter=8))

    # Group items by category
    items_by_cat = {}
    for it in purchase_items:
        cat = it.get("category", "General Groceries")
        if cat not in items_by_cat:
            items_by_cat[cat] = []
        items_by_cat[cat].append(it)

    table_data = [
        [
            Paragraph("<b>Check</b>", muted_style),
            Paragraph("<b>Raw Material / Ingredient</b>", muted_style),
            Paragraph("<b>Required Qty</b>", muted_style),
            Paragraph("<b>Unit Price</b>", muted_style),
            Paragraph("<b>Est. Cost</b>", muted_style),
            Paragraph("<b>Supplier / Notes</b>", muted_style)
        ]
    ]

    total_est = 0
    for cat, c_items in items_by_cat.items():
        table_data.append([
            "",
            Paragraph(f"<b>{cat.upper()}</b>", cat_title_style),
            "", "", "", ""
        ])
        for item in c_items:
            name = item.get("ingredient_name", "")
            qty = item.get("quantity_required", 0)
            unit = item.get("unit", "")
            price = item.get("unit_price", 0)
            cost = item.get("total_price", qty * price)
            total_est += cost
            supplier = item.get("supplier") or ""

            table_data.append([
                Paragraph("[  ]", body_style),
                Paragraph(name, body_style),
                Paragraph(f"<b>{qty:,.2f} {unit}</b>", body_style),
                Paragraph(f"{currency} {price:,.2f}", muted_style),
                Paragraph(f"{currency} {cost:,.2f}", body_style),
                Paragraph(supplier, muted_style)
            ])

    t = Table(table_data, colWidths=[36, 170, 85, 65, 75, 89])
    t.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,0), 1, EMERALD_DARK),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (4,-1), 'RIGHT'),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    summary_t = Table([
        [Paragraph(f"<b>Total Estimated Procurement Cost:</b>", title_style), Paragraph(f"<b>{currency} {total_est:,.2f}</b>", title_style)]
    ], colWidths=[360, 160])
    summary_t.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEABOVE', (0,0), (-1,-1), 1, GOLD_ACCENT),
    ]))
    story.append(summary_t)

    canvas_class = make_canvas_maker(company_settings)
    doc.build(story, canvasmaker=canvas_class)
    return buffer.getvalue()
