import os
from io import BytesIO
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
from reportlab.pdfgen import canvas

# Palette matching B & Co flyer and logo
CREAM_BG = colors.HexColor("#FAF7F2")
EMERALD_DARK = colors.HexColor("#0E3321")
EMERALD_LIGHT = colors.HexColor("#164E32")
GOLD_ACCENT = colors.HexColor("#A88344")
GOLD_MUTED = colors.HexColor("#D8C39D")
TEXT_DARK = colors.HexColor("#1F2923")
TEXT_MUTED = colors.HexColor("#5D6D63")
WHITE = colors.HexColor("#FFFFFF")

def draw_page_background(canvas_obj, doc):
    canvas_obj.saveState()
    # Draw warm ivory/cream background behind all flowables
    canvas_obj.setFillColor(CREAM_BG)
    canvas_obj.rect(0, 0, A4[0], A4[1], fill=True, stroke=False)

    # Subtle gold outer border
    canvas_obj.setStrokeColor(GOLD_MUTED)
    canvas_obj.setLineWidth(0.8)
    canvas_obj.rect(20, 20, A4[0] - 40, A4[1] - 40, fill=False, stroke=True)
    canvas_obj.restoreState()

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

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
        # Header running line (only text, NO filled rect covering flowables)
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(EMERALD_DARK)
        self.drawString(36, A4[1] - 32, "B & Co   WEDDING EVENTS AND CATERS")
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawRightString(A4[0] - 36, A4[1] - 32, "+91 790 725 4973 | +91 9072 400 824")

        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(36, 28, "Sasthamcotta, Kollam | Trivandrum, Kerala")
        self.drawRightString(A4[0] - 36, 28, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

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
        fontSize=20,
        leading=24,
        textColor=EMERALD_DARK,
        alignment=0
    )
    
    tagline_style = ParagraphStyle(
        'Tagline',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=GOLD_ACCENT,
        alignment=0
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=EMERALD_DARK,
        spaceAfter=4
    )

    cat_title_style = ParagraphStyle(
        'CatTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
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

    # 1. Header with Logo & Brand
    logo_path = Path(__file__).resolve().parent.parent.parent / "assets" / "logo.jpg"
    
    header_data = []
    if logo_path.exists():
        logo_img = Image(str(logo_path), width=75, height=75)
        text_cell = [
            Paragraph("B & Co", title_style),
            Paragraph(company_settings.get("tagline", "WEDDING EVENTS AND CATERS"), tagline_style),
            Spacer(1, 4),
            Paragraph(f"<b>Quotation #:</b> {quotation_data.get('quotation_number', 'QT-2026-0001')} | <b>Date:</b> {quotation_data.get('created_at', '')[:10]}", muted_style)
        ]
        header_table = Table([[logo_img, text_cell]], colWidths=[85, 435])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(header_table)
    else:
        story.append(Paragraph("B & Co", title_style))
        story.append(Paragraph(company_settings.get("tagline", "WEDDING EVENTS AND CATERS"), tagline_style))
        story.append(Spacer(1, 6))

    story.append(HRFlowable(width="100%", thickness=1, color=GOLD_MUTED, spaceBefore=4, spaceAfter=8))

    # 2. Client & Event Details Box
    client = quotation_data.get("client", {})
    event = quotation_data.get("event", {})
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
    client_info = "<br/>".join(client_lines) if client_lines else "<b>CLIENT:</b> Walk-in Client"
    
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
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F5EFEB")),
        ('BOX', (0,0), (-1,-1), 0.8, GOLD_MUTED),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 10))

    # 3. Selected Menu Items grouped by Category
    story.append(Paragraph("PROPOSED EVENT MENU", h2_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=GOLD_ACCENT, spaceBefore=2, spaceAfter=6))

    items = quotation_data.get("items", [])
    # Group items by category
    categories = {}
    for item in items:
        cat_name = item.get("category_snapshot") or "Special Selection"
        if cat_name not in categories:
            categories[cat_name] = []
        categories[cat_name].append(item)

    menu_table_rows = []
    # Two-column layout for categories
    cat_keys = list(categories.keys())
    
    for i in range(0, len(cat_keys), 2):
        cell1_content = []
        cell2_content = []

        cat1 = cat_keys[i]
        cell1_content.append(Paragraph(cat1.upper(), cat_title_style))
        for item in categories[cat1]:
            live_tag = " <font color='#A88344'><b>(Live Counter)</b></font>" if item.get("service_type_snapshot") == "LIVE_COUNTER" else ""
            unit_info = f" — {item.get('pricing_unit_snapshot')}" if item.get('pricing_unit_snapshot') != 'PER_PERSON' else ""
            cell1_content.append(Paragraph(f"• {item.get('item_name_snapshot')}{live_tag}{unit_info}", body_style))
            cell1_content.append(Spacer(1, 2))

        if i + 1 < len(cat_keys):
            cat2 = cat_keys[i + 1]
            cell2_content.append(Paragraph(cat2.upper(), cat_title_style))
            for item in categories[cat2]:
                live_tag = " <font color='#A88344'><b>(Live Counter)</b></font>" if item.get("service_type_snapshot") == "LIVE_COUNTER" else ""
                unit_info = f" — {item.get('pricing_unit_snapshot')}" if item.get('pricing_unit_snapshot') != 'PER_PERSON' else ""
                cell2_content.append(Paragraph(f"• {item.get('item_name_snapshot')}{live_tag}{unit_info}", body_style))
                cell2_content.append(Spacer(1, 2))

        menu_table_rows.append([cell1_content, cell2_content])

    if menu_table_rows:
        menu_table = Table(menu_table_rows, colWidths=[260, 260])
        menu_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 4),
            ('RIGHTPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(menu_table)

    # 4. Add-ons if present
    addons = quotation_data.get("addons", [])
    if addons:
        story.append(Spacer(1, 6))
        story.append(Paragraph("ADDITIONAL LIVE STATIONS & ADD-ONS", h2_style))
        story.append(HRFlowable(width="100%", thickness=0.8, color=GOLD_ACCENT, spaceBefore=2, spaceAfter=4))
        addon_rows = []
        for a in addons:
            addon_rows.append([
                Paragraph(f"• <b>{a.get('name_snapshot')}</b> ({a.get('pricing_unit_snapshot')})", body_style),
                Paragraph(f"Rs. {a.get('selling_price_snapshot', 0):,.2f}", ParagraphStyle('Right', parent=body_style, alignment=2))
            ])
        addon_table = Table(addon_rows, colWidths=[400, 120])
        addon_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(addon_table)

    story.append(Spacer(1, 10))

    # 5. Pricing & Financial Summary (CLIENT-FACING ONLY - ZERO INTERNAL COSTS)
    subtotal = quotation_data.get("subtotal", 0)
    discount_amount = quotation_data.get("discount_amount", 0)
    tax_amount = quotation_data.get("tax_amount", 0)
    tax_pct = quotation_data.get("tax_percentage", 5.0)
    grand_total = quotation_data.get("grand_total", 0)

    # Per person effective calculation
    per_person_rate = round(subtotal / guest_count, 2) if guest_count > 0 else 0

    pricing_data = [
        [Paragraph(f"<b>Estimated Per Person Rate:</b> (for {guest_count} guests)", body_style), Paragraph(f"<b>Rs. {per_person_rate:,.2f}</b>", ParagraphStyle('R', parent=body_style, alignment=2))],
        [Paragraph("Menu & Services Subtotal:", body_style), Paragraph(f"Rs. {subtotal:,.2f}", ParagraphStyle('R', parent=body_style, alignment=2))],
    ]
    if discount_amount > 0:
        disc_label = f"Special Event Discount ({quotation_data.get('discount_value', '')}%):" if quotation_data.get('discount_type') == 'PERCENTAGE' else "Special Event Discount:"
        pricing_data.append([
            Paragraph(f"<font color='#0E3321'><b>{disc_label}</b></font>", body_style),
            Paragraph(f"<font color='#0E3321'><b>- Rs. {discount_amount:,.2f}</b></font>", ParagraphStyle('R', parent=body_style, alignment=2))
        ])
    if tax_amount > 0:
        pricing_data.append([
            Paragraph(f"Applicable Catering GST ({tax_pct}%):", body_style),
            Paragraph(f"Rs. {tax_amount:,.2f}", ParagraphStyle('R', parent=body_style, alignment=2))
        ])
    pricing_data.append([
        Paragraph("<font size='11' color='#0E3321'><b>TOTAL QUOTATION AMOUNT:</b></font>", body_style),
        Paragraph(f"<font size='12' color='#0E3321'><b>Rs. {grand_total:,.2f}</b></font>", ParagraphStyle('R', parent=body_style, alignment=2))
    ])

    summary_table = Table(pricing_data, colWidths=[360, 160])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-2), colors.HexColor("#FDFBF7")),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#EFE6D4")),
        ('BOX', (0,0), (-1,-1), 1, GOLD_ACCENT),
        ('LINEBELOW', (0,-2), (-1,-2), 1, GOLD_ACCENT),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    story.append(KeepTogether([
        Paragraph("INVESTMENT SUMMARY", h2_style),
        summary_table
    ]))

    doc.build(story, canvasmaker=NumberedCanvas, onFirstPage=draw_page_background, onLaterPages=draw_page_background)
    return buffer.getvalue()
