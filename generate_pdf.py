#!/usr/bin/env python3
"""Generate DocsSearch architecture + flowchart PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable,
)
import math

W, H = A4
# Page frame: leftMargin=rightMargin=15mm, topMargin=15mm, bottomMargin=20mm
FRAME_W = W - 30*mm          # = 180mm exactly
FRAME_H = H - 35*mm          # ≈257mm  ← max height any Flowable can occupy

BLUE   = colors.HexColor("#4361ee")
LBLUE  = colors.HexColor("#eef2ff")
GREEN  = colors.HexColor("#166534")
LGREEN = colors.HexColor("#f0fdf4")
AMBER  = colors.HexColor("#92400e")
LAMBER = colors.HexColor("#fffbeb")
GRAY   = colors.HexColor("#6b7280")
LGRAY  = colors.HexColor("#f3f4f6")
DARK   = colors.HexColor("#1a1a2e")
WHITE  = colors.white
RED    = colors.HexColor("#991b1b")
LRED   = colors.HexColor("#fef2f2")
PURPLE = colors.HexColor("#7c3aed")
LPURPLE= colors.HexColor("#f5f3ff")


class CanvasDrawing(Flowable):
    def __init__(self, width, height, draw_fn):
        super().__init__()
        self.width = width
        self.height = height
        self._draw_fn = draw_fn

    def draw(self):
        self._draw_fn(self.canv, self.width, self.height)


# ── shared canvas helpers ──────────────────────────────────────────────────

def rbox(c, x, y, w, h, fill, stroke=None, label="", sub="",
         r=4, lc=None, sc=None, fs=8, ss=7):
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke or DARK)
    c.setLineWidth(0.7)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1)
    if label:
        c.setFillColor(lc or stroke or DARK)
        c.setFont("Helvetica-Bold", fs)
        c.drawCentredString(x + w/2, y + h/2 + (3 if sub else -2.5), label)
    if sub:
        c.setFillColor(sc or GRAY)
        c.setFont("Helvetica", ss)
        c.drawCentredString(x + w/2, y + h/2 - 7, sub)
    c.restoreState()


def arr(c, x1, y1, x2, y2, color=None, lbl="", lx=None, ly=None):
    color = color or GRAY
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(0.9)
    c.line(x1, y1, x2, y2)
    a = math.atan2(y2 - y1, x2 - x1)
    sz = 4.5
    p = c.beginPath()
    p.moveTo(x2, y2)
    p.lineTo(x2 - sz*math.cos(a-0.4), y2 - sz*math.sin(a-0.4))
    p.lineTo(x2 - sz*math.cos(a+0.4), y2 - sz*math.sin(a+0.4))
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    if lbl:
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 6)
        c.drawCentredString(lx or (x1+x2)/2, (ly or (y1+y2)/2) + 3.5, lbl)
    c.restoreState()


# ── Page 1: Title ─────────────────────────────────────────────────────────

def draw_title(c, w, h):
    # header bar
    c.setFillColor(BLUE)
    c.rect(0, h - 95*mm, w, 95*mm, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 34)
    c.drawCentredString(w/2, h - 44*mm, "DocsSearch")

    c.setFillColor(colors.HexColor("#c7d2fe"))
    c.setFont("Helvetica", 13)
    c.drawCentredString(w/2, h - 58*mm,
                        "Technische Architektur & Programmablaufplan")

    c.setFillColor(colors.HexColor("#e0e7ff"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(w/2, h - 70*mm, "Version 2.0  ·  Mai 2026")

    # four pillars
    pills = [
        ("📱 React Native",   "Expo SDK 54 · iOS"),
        ("⚡ Next.js API",    "Railway · SQLite"),
        ("✉️  Mail Client",   "Node.js · Resend"),
        ("🤖 KI-Integration", "GPT-4o-mini"),
    ]
    bw, bh2 = 36*mm, 20*mm
    gap = 4*mm
    total = len(pills) * bw + (len(pills)-1) * gap
    sx = (w - total) / 2
    by = h - 120*mm
    for i, (title, sub) in enumerate(pills):
        rbox(c, sx + i*(bw+gap), by, bw, bh2, LBLUE, BLUE,
             label=title, sub=sub, r=6, lc=BLUE, sc=GRAY, fs=8.5, ss=7)

    # body text sections
    sections = [
        ("Arzt-Suche", "Fachgebiet, Ort und Versicherungsart als Filter. "
         "Ergebnisse aus öffentlichen Quellen werden konsolidiert."),
        ("E-Mail-Workflow", "GPT-4o-mini generiert einen personalisierten Anfragetext. "
         "Patient kann den Text vor dem Versand bearbeiten."),
        ("Terminverwaltung", "Arzt antwortet per E-Mail. Cloudflare-Worker leitet an "
         "den Backend-Webhook weiter. Patient erhält Push-Benachrichtigung."),
        ("Kommunikationshistorie", "Alle gesendeten & empfangenen E-Mails werden in "
         "SQLite gespeichert und im Profil angezeigt."),
    ]
    sy2 = by - 8*mm
    cols = 2
    sw = (w - 6*mm) / cols
    for i, (title, text) in enumerate(sections):
        col = i % cols
        row = i // cols
        sx2 = col * (sw + 6*mm)
        sy3 = sy2 - row * 30*mm
        rbox(c, sx2, sy3 - 26*mm, sw, 26*mm, LGRAY, colors.HexColor("#e0e0e0"),
             r=5, fs=8)
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(sx2 + 4*mm, sy3 - 8*mm, title)
        c.setFillColor(DARK)
        c.setFont("Helvetica", 7.5)
        # simple word wrap
        words = text.split()
        line, lines = [], []
        for word in words:
            line.append(word)
            if len(" ".join(line)) > 48:
                lines.append(" ".join(line[:-1]))
                line = [word]
        if line:
            lines.append(" ".join(line))
        for j, ln in enumerate(lines[:3]):
            c.drawString(sx2 + 4*mm, sy3 - 16*mm - j*9, ln)

    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(w/2, 15*mm, "Erstellt mit Claude Code  ·  Anthropic  ·  Mai 2026")


# ── Page 2: System Architecture ───────────────────────────────────────────

def draw_arch(c, w, h):
    # 3 columns × 57mm + 2 × 4.5mm gap = 180mm total
    bw, bh, gap = 57*mm, 13*mm, 4.5*mm
    col1 = 0
    col2 = bw + gap
    col3 = 2 * (bw + gap)

    # column headers
    for cx, lbl, fill, stroke in [
        (col1, "Expo App (iOS)",        LBLUE,  BLUE),
        (col2, "Next.js API (Railway)", LGREEN, GREEN),
        (col3, "Externe Dienste",       LAMBER, AMBER),
    ]:
        rbox(c, cx, h - 12*mm, bw, 10*mm, fill, stroke,
             label=lbl, r=4, lc=stroke, fs=8)

    app_items = [
        ("SearchScreen",      "Arztsuche"),
        ("ResultsScreen",     "Ergebnisse + E-Mail-Preview"),
        ("RequestsScreen",    "Anfragen (5s-Poll)"),
        ("AppointmentModal",  "Terminverwaltung"),
        ("ProfileScreen",     "Profil + Verlauf"),
    ]
    api_items = [
        ("/api/search",        "POST · Arztsuche"),
        ("/api/contact",       "POST · Anfrage senden"),
        ("/api/reply",         "POST · Antwort senden"),
        ("/api/requests",      "GET/DELETE"),
        ("/api/inbound-email", "POST · Eingehende Mail"),
        ("/api/email-log",     "GET · Mail-Verlauf"),
        ("/api/push-token",    "POST · Push registrieren"),
    ]
    ext_items = [
        ("Resend",             "E-Mail-Versand"),
        ("OpenAI GPT-4o-mini", "Datums-Extraktion"),
        ("Expo Push",          "Push-Benachrichtigung"),
        ("SQLite (Railway)",   "Datenbank"),
        ("Cloudflare Worker",  "E-Mail → Webhook"),
        ("Google Maps",        "Navigation"),
    ]

    app_y = [h - 28*mm - i*(bh+gap) for i in range(len(app_items))]
    api_y = [h - 28*mm - i*(bh+gap) for i in range(len(api_items))]
    ext_y = [h - 28*mm - i*(bh+gap) for i in range(len(ext_items))]

    for i, (nm, sub) in enumerate(app_items):
        rbox(c, col1, app_y[i], bw, bh, LBLUE, BLUE,
             label=nm, sub=sub, r=4, lc=BLUE, fs=7.5, ss=6.5)
    for i, (nm, sub) in enumerate(api_items):
        rbox(c, col2, api_y[i], bw, bh, LGREEN, GREEN,
             label=nm, sub=sub, r=4, lc=GREEN, fs=7.5, ss=6.5)
    for i, (nm, sub) in enumerate(ext_items):
        rbox(c, col3, ext_y[i], bw, bh, LAMBER, AMBER,
             label=nm, sub=sub, r=4, lc=AMBER, fs=7.5, ss=6.5)

    for ai, bi in [(0,0),(1,1),(2,3),(3,2),(4,5)]:
        arr(c, col1+bw, app_y[ai]+bh/2, col2, api_y[bi]+bh/2, BLUE)

    drawn = set()
    for ai, bi in [(1,0),(1,2),(4,1),(4,4),(0,3),(1,3),(2,3),(3,3),(4,3),(5,3)]:
        if (ai, bi) in drawn or ai >= len(api_y) or bi >= len(ext_y):
            continue
        drawn.add((ai, bi))
        arr(c, col2+bw, api_y[ai]+bh/2, col3, ext_y[bi]+bh/2, GREEN)


# ── Page 3: Data Flow ─────────────────────────────────────────────────────

def draw_dataflow(c, w, h):
    # 3 boxes × 55mm + 2 × 7.5mm gap = 180mm total
    bw, bh, r = 55*mm, 12*mm, 4
    c1, c2, c3 = 0, 62.5*mm, 125*mm

    rows = [
        (h - 15*mm, [
            (c1, LBLUE,  BLUE,  "Patient (App)",     "Kontaktdaten"),
            (c2, LGREEN, GREEN, "Arzt auswählen",    "via Suche"),
            (c3, LAMBER, AMBER, "E-Mail Preview",    "GPT-generiert"),
        ]),
        (h - 38*mm, [
            (c1, LGREEN, GREEN, "Anfrage gesendet",  "/api/contact"),
            (c2, LAMBER, AMBER, "Resend → Arzt",     "facharzt-kontakt.org"),
            (c3, LBLUE,  BLUE,  "SQLite gespeichert","requests + email_log"),
        ]),
        (h - 61*mm, [
            (c1, LAMBER, AMBER, "Arzt antwortet",    "reply+ID@domain"),
            (c2, LGREEN, GREEN, "Cloudflare Worker", "→ /api/inbound-email"),
            (c3, LBLUE,  BLUE,  "Push + Forward",    "Expo + E-Mail"),
        ]),
        (h - 84*mm, [
            (c1, LBLUE,  BLUE,  "Patient reagiert",  "Bestätigen/Ablehnen"),
            (c2, LGREEN, GREEN, "/api/reply",        "confirm/counter/cancel"),
            (c3, LAMBER, AMBER, "E-Mail an Arzt",    "reply-to: reply+ID@"),
        ]),
    ]

    h_labels = [
        ["sucht", "generiert"],
        ["sendet E-Mail", "loggt"],
        ["weiterleitet", "benachrichtigt"],
        ["sendet", "E-Mail"],
    ]

    for ri, (ry, cols) in enumerate(rows):
        for bx, f, s, lbl, sub in cols:
            rbox(c, bx, ry, bw, bh, f, s, label=lbl, sub=sub, r=r, lc=s, fs=8, ss=6.5)
        cy = ry + bh/2
        for j in range(len(cols)-1):
            lbl2 = h_labels[ri][j] if ri < len(h_labels) else ""
            arr(c, cols[j][0]+bw, cy, cols[j+1][0], cy, cols[j+1][2], lbl2)
        # vertical arrow to next row (from right col of this to left col of next)
        if ri < len(rows)-1:
            next_ry = rows[ri+1][0]
            mid_x = cols[-1][0] + bw/2
            arr(c, mid_x, ry, mid_x, next_ry + bh, cols[-1][2])


# ── Page 3: DB Schema ─────────────────────────────────────────────────────

def draw_db(c, w, h):
    # 3 columns × 56mm + 2 × 6mm = 180mm
    tw = 56*mm
    c1, c2, c3 = 0, 62*mm, 124*mm

    tables = [
        ("requests",     c1, h-14*mm, [
            "id TEXT  PK", "userEmail TEXT", "doctorId TEXT",
            "doctorName TEXT", "specialty TEXT", "city TEXT",
            "problem TEXT", "status TEXT", "suggestedAt TEXT",
            "appointmentAt TEXT", "createdAt TEXT",
        ]),
        ("users",        c2, h-14*mm, [
            "id INTEGER  PK", "email TEXT UNIQUE",
            "firstName TEXT", "lastName TEXT",
            "phone TEXT", "birthDate TEXT", "insuranceType TEXT",
        ]),
        ("email_log",    c3, h-14*mm, [
            "id INTEGER  PK", "request_id TEXT  FK",
            "direction TEXT", "subject TEXT",
            "body TEXT", "from_addr TEXT",
            "to_addr TEXT", "sent_at TEXT",
        ]),
        ("push_tokens",  c1, h-82*mm, [
            "id INTEGER  PK", "email TEXT",
            "token TEXT UNIQUE", "created_at TEXT",
        ]),
        ("inbox_emails", c2, h-82*mm, [
            "id INTEGER  PK", "from_addr TEXT",
            "to_addr TEXT", "subject TEXT",
            "body TEXT", "replied_request_id TEXT",
            "received_at TEXT",
        ]),
        ("doctors",      c3, h-82*mm, [
            "id TEXT  PK", "name TEXT",
            "specialty TEXT", "bundesland TEXT",
            "city TEXT", "address TEXT",
            "lat REAL", "lon REAL",
        ]),
    ]

    th, ch = 9*mm, 5.5*mm

    for name, tx, ty_top, cols in tables:
        total_body = len(cols) * ch + 2*mm
        ty_body = ty_top - th - total_body

        # header
        c.setFillColor(BLUE)
        c.setStrokeColor(BLUE)
        c.roundRect(tx, ty_top - th, tw, th, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(tx + tw/2, ty_top - th + 3, name)

        # body
        c.setFillColor(LGRAY)
        c.setStrokeColor(colors.HexColor("#d1d5db"))
        c.setLineWidth(0.5)
        c.rect(tx, ty_body, tw, total_body, fill=1, stroke=1)

        for i, col in enumerate(reversed(cols)):
            cy = ty_body + i * ch + 1.5*mm
            is_pk = "PK" in col
            is_fk = "FK" in col
            c.setFillColor(BLUE if is_pk else (AMBER if is_fk else DARK))
            c.setFont("Helvetica-Bold" if is_pk else "Helvetica", 6.5)
            c.drawString(tx + 3*mm, cy + 1, col)

    # FK relation line: email_log → requests
    arr(c, tw, h - 50*mm, c3, h - 50*mm, AMBER, "request_id  FK→requests")


# ── Page 4: Flowchart ─────────────────────────────────────────────────────

def draw_flowchart(c, w, h):
    bw, bh = 66*mm, 9*mm
    dw, dh = 66*mm, 13*mm
    cx = w / 2
    y = [h - 4*mm]

    def terminal(label, fill=BLUE, tc=WHITE):
        y[0] -= 9*mm
        c.setFillColor(fill)
        c.roundRect(cx - 33*mm, y[0], 66*mm, 9*mm, 4, fill=1, stroke=0)
        c.setFillColor(tc)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(cx, y[0] + 3, label)
        return y[0] + 9*mm

    def step(label, sub="", fill=LBLUE, stroke=BLUE):
        y[0] -= bh + 3*mm
        rbox(c, cx - bw/2, y[0], bw, bh, fill, stroke,
             label=label, sub=sub, r=4, lc=stroke, fs=8, ss=6.5)
        return y[0] + bh/2

    def conn(y1, y2, color=GRAY):
        if y1 > y2 + 1:
            arr(c, cx, y1, cx, y2, color)

    def decision(label, fill=LAMBER):
        y[0] -= dh + 4*mm
        my = y[0] + dh/2
        pts = [cx, my+dh/2, cx+dw/2, my, cx, my-dh/2, cx-dw/2, my]
        c.setFillColor(fill)
        c.setStrokeColor(AMBER)
        c.setLineWidth(0.8)
        p = c.beginPath()
        p.moveTo(pts[0], pts[1])
        for k in range(2, len(pts), 2):
            p.lineTo(pts[k], pts[k+1])
        p.close()
        c.drawPath(p, fill=1, stroke=1)
        c.setFillColor(AMBER)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(cx, my - 2.5, label)
        return my

    def side_box_r(my, label, fill, stroke):
        bx = cx + dw/2 + 2*mm
        by = my - bh/2
        rbox(c, bx, by, 35*mm, bh, fill, stroke, label=label, r=3, lc=stroke, fs=7.5)
        arr(c, cx + dw/2, my, bx, my, stroke)
        c.setFillColor(stroke); c.setFont("Helvetica", 6.5)
        c.drawCentredString(cx + dw/2 + 7*mm, my + 2, "Nein")
        # loop back left
        arr(c, bx + 35*mm, my, bx + 35*mm, my - 30*mm, stroke)
        arr(c, bx + 35*mm, my - 30*mm, cx, my - 30*mm, stroke)

    def side_box_l(my, label, fill, stroke):
        bx = cx - dw/2 - 37*mm
        by = my - bh/2
        rbox(c, bx, by, 35*mm, bh, fill, stroke, label=label, r=3, lc=stroke, fs=7.5)
        arr(c, cx - dw/2, my, bx + 35*mm, my, stroke)
        c.setFillColor(stroke); c.setFont("Helvetica", 6.5)
        c.drawCentredString(cx - dw/2 - 7*mm, my + 2, "Nein")
        arr(c, bx, my, bx, my - 30*mm, stroke)
        arr(c, bx, my - 30*mm, cx, my - 30*mm, stroke)

    # ── start
    y_top = terminal("APP START")
    conn(y_top - 1, y[0] - 2*mm)

    y1 = step("Push Token registrieren", "expo-notifications")
    conn(y1, y1 - 2*mm)

    d1 = decision("Profil ausgefüllt?")
    arr(c, cx, d1 - dh/2, cx, d1 - dh/2 - 3*mm, GREEN)
    c.setFillColor(GREEN); c.setFont("Helvetica", 6.5)
    c.drawCentredString(cx + 7*mm, d1 - dh/2 - 1.5*mm, "Ja")
    side_box_r(d1, "Profil ausfüllen", LRED, RED)

    y2 = step("Suchmaske anzeigen", "Fachgebiet · Ort · Versicherung")
    conn(y2, y2 - 2*mm)

    y3 = step("POST /api/search", "Ärzte laden", LGREEN, GREEN)
    conn(y3, y3 - 2*mm)

    y4 = step("Arzt auswählen", "ResultsScreen")
    conn(y4, y4 - 2*mm)

    d2 = decision("E-Mail Preview generieren?")
    arr(c, cx, d2 - dh/2, cx, d2 - dh/2 - 3*mm, GREEN)
    c.setFillColor(GREEN); c.setFont("Helvetica", 6.5)
    c.drawCentredString(cx + 7*mm, d2 - dh/2 - 1.5*mm, "Ja")
    side_box_l(d2, "direkt senden", LGRAY, GRAY)

    y5 = step("E-Mail bearbeiten (GPT)", "editierbarer Text", LAMBER, AMBER)
    conn(y5, y5 - 2*mm)

    y6 = step("POST /api/contact", "Anfrage senden", LGREEN, GREEN)
    conn(y6, y6 - 2*mm)

    y7 = step("5s-Poll /api/requests", "Anfragen-Tab · modal-aware")
    conn(y7, y7 - 2*mm)

    d3 = decision("Terminvorschlag erhalten?")
    arr(c, cx, d3 - dh/2, cx, d3 - dh/2 - 3*mm, GREEN)
    c.setFillColor(GREEN); c.setFont("Helvetica", 6.5)
    c.drawCentredString(cx + 7*mm, d3 - dh/2 - 1.5*mm, "Ja")

    y8 = step("Push-Benachrichtigung", "Expo Push + E-Mail-Weiterleitung", LPURPLE, PURPLE)
    conn(y8, y8 - 2*mm)

    y9 = step("AppointmentModal öffnen", "Bestätigen / Gegenvorschlag / Absagen")
    conn(y9, y9 - 2*mm)

    d4 = decision("Aktion?")

    # Three branches below d4
    base = d4 - dh/2 - 4*mm
    branches = [
        (cx - 50*mm, "Bestätigen",     LGREEN, GREEN, "/api/reply confirm"),
        (cx,          "Gegenvorschlag", LAMBER, AMBER, "/api/reply counter"),
        (cx + 50*mm,  "Absagen",        LRED,   RED,   "/api/reply cancel"),
    ]
    for ax, al, af, as_, asub in branches:
        arr(c, cx, d4 - dh/2, ax, base, as_)
        rbox(c, ax - 24*mm, base - 9*mm, 48*mm, 9*mm, af, as_,
             label=al, sub=asub, r=3, lc=as_, fs=7.5, ss=6)

    merge_y = base - 9*mm - 6*mm
    for ax in [cx - 50*mm, cx, cx + 50*mm]:
        arr(c, ax, base - 9*mm, ax, merge_y, GRAY)
        arr(c, ax, merge_y, cx, merge_y, GRAY)
    arr(c, cx, merge_y, cx, merge_y - 6*mm, GRAY)

    terminal("KOMMUNIKATION ABGESCHLOSSEN", DARK, WHITE)


# ── Page 5: Feature table ─────────────────────────────────────────────────

features = [
    ["Feature", "Implementierung", "✓"],
    ["Arztsuche (Fachgebiet, Ort, Versicherung)", "POST /api/search", "✅"],
    ["E-Mail-Preview (editierbar, GPT-generiert)", "POST /api/preview", "✅"],
    ["Anfrage senden", "POST /api/contact + Resend", "✅"],
    ["5s-Polling der Anfragen", "setInterval, modal-aware", "✅"],
    ["Terminvorschlag annehmen / ablehnen", "AppointmentModal + /api/reply", "✅"],
    ["Gegenvorschlag (Wochentag + Zeitfenster)", "/api/reply counter + [REQ:ID] Tag", "✅"],
    ["Termin absagen", "/api/reply cancel", "✅"],
    ["Push-Benachrichtigung bei Arzt-Antwort", "Expo Push + /api/push-token", "✅"],
    ["E-Mail-Weiterleitung an Patient", "Resend in /api/inbound-email", "✅"],
    ["Kommunikationshistorie im Profil", "email_log + /api/email-log", "✅"],
    ["Anfragen löschen (einzeln / alle)", "DELETE /api/requests", "✅"],
    ["Google Maps Navigation", "comgooglemaps:// + Apple Maps Fallback", "✅"],
    ["Kalender öffnen (korrekte Apple-Epoch)", "calshow:// mit 2001-Offset", "✅"],
    ["Mail-Client Gegenvorschlag-Routing", "[REQ:ID] im Betreff → /api/inbound-email", "✅"],
    ["Test-Ärztedatenbank", "800 Ärzte (50/Bundesland × 16) · doctors-Tabelle", "✅"],
    ["Testphase: nur lokale Ärzte anzeigen", "getDoctorCount() > 0 → nur DB-Suche", "✅"],
    ["Seed-Endpoint", "POST /api/seed-doctors · GET für Count", "✅"],
]


# ── BUILD ─────────────────────────────────────────────────────────────────

OUT = "/Users/thomashoche/Desktop/docsearch_architecture_v2.pdf"
doc = SimpleDocTemplate(OUT, pagesize=A4,
                        leftMargin=15*mm, rightMargin=15*mm,
                        topMargin=15*mm, bottomMargin=20*mm)

def H1(t): return Paragraph(
    f'<font color="#4361ee" size="16"><b>{t}</b></font>',
    ParagraphStyle("h1", fontName="Helvetica-Bold", spaceAfter=3*mm))

def H2(t): return Paragraph(
    f'<font color="#1a1a2e" size="12"><b>{t}</b></font>',
    ParagraphStyle("h2", fontName="Helvetica-Bold", spaceAfter=2*mm, spaceBefore=5*mm))

def B(t): return Paragraph(t, ParagraphStyle(
    "b", fontName="Helvetica", fontSize=9.5, leading=13,
    spaceAfter=2*mm, textColor=DARK))

def CAP(t): return Paragraph(
    f'<i><font color="#6b7280" size="7.5">{t}</font></i>',
    ParagraphStyle("cap", fontName="Helvetica-Oblique",
                   spaceAfter=4*mm, alignment=TA_CENTER))

# Overhead per page (heading + body + spacer + caption) ≈ 70pt
# FRAME_H ≈ 257mm = 728pt → drawing max per page with text ≈ 657pt = 232mm
# Standalone drawing (title, no text) ≈ 245mm = 694pt

TITLE_H = 245*mm
ARCH_H  = 160*mm
DATA_H  =  88*mm
DB_H    = 130*mm
FLOW_H  = 215*mm

story = []

story.append(CanvasDrawing(FRAME_W, TITLE_H, draw_title))
story.append(PageBreak())

story.append(H1("1. Systemarchitektur"))
story.append(B(
    "DocsSearch besteht aus drei Hauptkomponenten: <b>React Native App</b> (Expo SDK 54), "
    "<b>Next.js API</b> auf Railway mit SQLite sowie einem <b>Node.js Mail-Client</b>. "
    "Kommunikation über REST, E-Mails via Resend, Push via Expo."
))
story.append(Spacer(1, 2*mm))
story.append(CanvasDrawing(FRAME_W, ARCH_H, draw_arch))
story.append(CAP("Abb. 1 – Systemarchitektur: App · API · Externe Dienste"))
story.append(PageBreak())

story.append(H1("2. Datenflusskette"))
story.append(B(
    "Vollständiger Kommunikationsfluss von der Arztsuche bis zur Terminbestätigung "
    "einschließlich eingehender Arztantworten über den Cloudflare E-Mail-Worker."
))
story.append(Spacer(1, 2*mm))
story.append(CanvasDrawing(FRAME_W, DATA_H, draw_dataflow))
story.append(CAP("Abb. 2 – Datenflusskette: Patient → Arzt → Terminbestätigung"))

story.append(H2("3. Datenbankschema"))
story.append(B(
    "SQLite (better-sqlite3) auf Railway. Tabellen werden beim Start automatisch angelegt. "
    "<b>PK</b> = Primary Key · <b>FK</b> = Foreign Key."
))
story.append(Spacer(1, 2*mm))
story.append(CanvasDrawing(FRAME_W, DB_H, draw_db))
story.append(CAP("Abb. 3 – Datenbankschema (5 Tabellen)"))
story.append(PageBreak())

story.append(H1("4. Programmablaufplan"))
story.append(B(
    "Nutzer-Journey von App-Start über Arztsuche und E-Mail-Versand "
    "bis zur Terminvereinbarung mit allen Entscheidungspfaden."
))
story.append(Spacer(1, 2*mm))
story.append(CanvasDrawing(FRAME_W, FLOW_H, draw_flowchart))
story.append(CAP("Abb. 4 – Programmablaufplan: vollständige Nutzer-Journey"))
story.append(PageBreak())

story.append(H1("5. Feature-Übersicht"))
story.append(Spacer(1, 3*mm))

t = Table(features, colWidths=[88*mm, 68*mm, 14*mm], repeatRows=1)
t.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,0),  BLUE),
    ("TEXTCOLOR",     (0,0), (-1,0),  WHITE),
    ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
    ("FONTSIZE",      (0,0), (-1,0),  9),
    ("TOPPADDING",    (0,0), (-1,0),  5),
    ("BOTTOMPADDING", (0,0), (-1,0),  5),
    ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE",      (0,1), (-1,-1), 8.5),
    ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LGRAY]),
    ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#e0e0e0")),
    ("ALIGN",         (-1,0),(-1,-1), "CENTER"),
    ("TOPPADDING",    (0,1), (-1,-1), 4),
    ("BOTTOMPADDING", (0,1), (-1,-1), 4),
    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
]))
story.append(t)

doc.build(story)
print(f"✅  PDF: {OUT}")
