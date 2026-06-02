from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import re
import os
import base64
import json
import logging
from datetime import datetime
from app.db.database import get_db
from app.models.budget import Budget
from app.models.user import User
from app.config import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

router = APIRouter()

DEFAULT_BUDGET = {
    "income": 0,
    "categories": [
        {
            "id": "housing",
            "label": "Жильё",
            "color": "#4FD1C5",
            "items": [
                {"id": "h1", "label": "Аренда / ипотека",    "amount": 0},
                {"id": "h2", "label": "Коммунальные услуги", "amount": 0},
                {"id": "h3", "label": "Интернет / телефон",  "amount": 0},
            ],
        },
        {
            "id": "living",
            "label": "Жизнь и потребление",
            "color": "#68D391",
            "items": [
                {"id": "l1", "label": "Питание",        "amount": 0},
                {"id": "l2", "label": "Одежда",         "amount": 0},
                {"id": "l3", "label": "Транспорт",      "amount": 0},
                {"id": "l4", "label": "Развлечения",    "amount": 0},
            ],
        },
        {
            "id": "insurance",
            "label": "Страховки и взносы",
            "color": "#F6AD55",
            "items": [
                {"id": "i1", "label": "Медицинская страховка",  "amount": 0},
                {"id": "i2", "label": "Автострахование",        "amount": 0},
            ],
        },
        {
            "id": "savings",
            "label": "Сбережения",
            "color": "#B794F4",
            "items": [
                {"id": "s1", "label": "Накопительный счёт", "amount": 0},
                {"id": "s2", "label": "Инвестиции",         "amount": 0},
            ],
        },
    ],
}


def _get_user(authorization: Optional[str], db: Session) -> dict:
    if not authorization:
        raise HTTPException(401, "Authorization header missing")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(401, "User not found")
    return {"id": user.id, "email": user.email}


def _current_period() -> str:
    return datetime.now().strftime("%Y-%m")


@router.get("/history")
def get_budget_history(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    rows = (
        db.query(Budget)
        .filter(Budget.user_id == user["id"])
        .order_by(Budget.period.desc())
        .all()
    )
    return [
        {
            "period": r.period,
            "income": r.data.get("income", 0),
            "total_expenses": sum(
                item.get("amount", 0)
                for cat in r.data.get("categories", [])
                for item in cat.get("items", [])
            ),
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in rows
    ]


@router.get("")
def get_budget(
    period: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    p = period or _current_period()
    row = db.query(Budget).filter(Budget.user_id == user["id"], Budget.period == p).first()
    if row:
        return {**row.data, "period": row.period}
    # Фолбэк: если запрошен текущий месяц и записи нет — ищем последний
    if not period:
        latest = (
            db.query(Budget)
            .filter(Budget.user_id == user["id"])
            .order_by(Budget.period.desc())
            .first()
        )
        if latest:
            return {**latest.data, "period": latest.period}
    return {**DEFAULT_BUDGET, "period": p}


@router.put("")
def save_budget(
    body: dict,
    period: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    p = period or body.pop("period", None) or _current_period()
    row = db.query(Budget).filter(Budget.user_id == user["id"], Budget.period == p).first()
    if row:
        row.data = {k: v for k, v in body.items() if k != "period"}
    else:
        row = Budget(user_id=user["id"], period=p, data={k: v for k, v in body.items() if k != "period"})
        db.add(row)
    db.commit()
    return {"ok": True, "period": p}


def _parse_amount(s: str) -> float:
    s = s.strip().replace("\xa0", "").replace(" ", "")
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


# ── Haushaltsbudget column → category mapping ─────────────────────────────────
# Maps German column header keywords to our category IDs
_COL_HEADERS = {
    "schutzengel": "insurance",
    "versicherung": "insurance",
    "schutz": "insurance",
    "wohnen": "housing",
    "wohnung": "housing",
    "leben": "living",
    "konsum": "living",
    "alltag": "living",
    "sparen": "savings",
    "sparplan": "savings",
    "vorsorge": "savings",
}

_COL_COLORS = {
    "insurance": "#C8922A",
    "housing":   "#C0392B",
    "living":    "#D4820A",
    "savings":   "#2D8A4E",
}

_COL_LABELS_DE = {
    "housing":   "Wohnen",
    "living":    "Leben / Konsum",
    "insurance": "Schutzengel",
    "savings":   "Sparen",
}

# ── Keyword → bucket mapping ───────────────────────────────────────────────────
HOUSING_H1 = ["miete", "kaltmiete", "hypothek", "warmmiete", "finanzierung", "darlehen"]
HOUSING_H2 = ["nebenkosten", "strom", "gas", "wasser", "heizung", "grundsteuer",
               "rundfunk", "müll", "garage", "stellplatz"]
HOUSING_H3 = ["internet", "telefon", "mobilfunk", "tv", "dsl", "festnetz"]

LIVING_L1  = ["ernährung", "lebensmittel", "essen", "nahrung", "kita", "kinder",
               "kindergarten", "schule"]
LIVING_L2  = ["kleidung", "bekleidung", "mode", "schuhe"]
LIVING_L3  = ["mobilität", "transport", "kfz-neben", "fahrkosten", "fahrt",
               "leasing", "kraftstoff", "tanken", "öpnv", "bahnticket"]
LIVING_L4  = ["vergnügen", "freizeit", "urlaub", "haustier", "zigaretten",
               "geschenke", "hobby", "handy", "smartphone", "streaming",
               "privatkredit", "beiträge", "beitrag", "vereinsbeitrag",
               "unternehmensverpflichtung", "gesundheit", "fitness",
               "sonstige", "sonstiges"]

INS_I1     = ["krankenversicherung", "kv-zusatz", "kv zusatz", "kv privat", "pflege", "pkv",
               "gesetzliche kranken"]
INS_I2     = ["kfz-versicherung", "kfz versicherung", "kfz-versicher", "autoversicherung", "kraftfahrzeug"]
INS_EXTRA  = ["unfall", "haftpflicht", "hausrat", "risiko", "rechtsschutz",
               "wohngebäude", "berufsunfähig", "glas", "risiko-lv",
               "invalidität", "lebensversicherung"]

SAV_S1     = ["sparbuch", "tagesgeld", "sparkonto", "girokonto", "bausparen"]
SAV_S2     = ["investition", "fonds", "aktien", "etf", "depot"]
SAV_EXTRA  = ["riester", "rürup", "rente", "bav", "altersvorsorge", "betriebliche"]

SKIP       = ["überschuss", "vom einkommen", "haushaltsnettoeinkommen",
              "nettoeinkommen", "budget verwendet", "soll-vergleich",
              "finanzplanung", "vertragscheck", "haushaltsbudget",
              "name", "mtl", "neuer ausgabentyp"]

BAD_LABEL  = {"oll", "valas", "kala", "e]", "ay", "v", "mtl"}


def _match(label: str, keywords: list) -> bool:
    ll = label.lower()
    return any(kw in ll for kw in keywords)


def _classify_raw_items(income: float, raw_items: list, is_haushalts: bool) -> dict:
    buckets: dict[str, float] = {
        "h1": 0, "h2": 0, "h3": 0,
        "l1": 0, "l2": 0, "l3": 0, "l4": 0,
        "i1": 0, "i2": 0,
        "s1": 0, "s2": 0,
    }
    extra_ins:   list[dict] = []
    extra_sav:   list[dict] = []
    extra_other: list[dict] = []

    for label, amount in raw_items:
        ll = label.lower().strip()
        if len(ll) < 2 or ll in BAD_LABEL or any(c.isdigit() for c in ll[:2]):
            continue
        if any(s in ll for s in SKIP):
            continue
        if _match(label, HOUSING_H1):
            buckets["h1"] += amount
        elif _match(label, HOUSING_H3):
            buckets["h3"] += amount
        elif _match(label, LIVING_L3):
            buckets["l3"] += amount
        elif _match(label, HOUSING_H2):
            buckets["h2"] += amount
        elif _match(label, LIVING_L1):
            buckets["l1"] += amount
        elif _match(label, LIVING_L2):
            buckets["l2"] += amount
        elif _match(label, LIVING_L4):
            buckets["l4"] += amount
        elif _match(label, INS_I1):
            buckets["i1"] += amount
        elif _match(label, INS_I2):
            buckets["i2"] += amount
        elif _match(label, INS_EXTRA):
            extra_ins.append({"id": f"ix_{ll[:8].replace(' ', '_')}", "label": label, "amount": round(amount, 2)})
        elif _match(label, SAV_S1):
            buckets["s1"] += amount
        elif _match(label, SAV_S2):
            buckets["s2"] += amount
        elif _match(label, SAV_EXTRA):
            extra_sav.append({"id": f"sx_{ll[:8].replace(' ', '_')}", "label": label, "amount": round(amount, 2)})
        else:
            extra_other.append({"id": f"ox_{ll[:8].replace(' ', '_')}", "label": label, "amount": round(amount, 2)})

    def _items(base: list[dict], extras: list[dict]) -> list[dict]:
        result = [i for i in base if i["amount"] > 0]
        result.extend(extras)
        return result or base

    label_fn = _COL_LABELS_DE if is_haushalts else {
        "housing": "Wohnen", "living": "Leben & Konsum",
        "insurance": "Versicherungen", "savings": "Sparen",
    }

    return {
        "income": round(income, 2),
        "categories": [
            {"id": "insurance", "label": label_fn["insurance"], "color": "#F6AD55",
             "items": _items([
                 {"id": "i1", "label": "Krankenversicherung", "amount": round(buckets["i1"], 2)},
                 {"id": "i2", "label": "KFZ-Versicherung",    "amount": round(buckets["i2"], 2)},
             ], extra_ins)},
            {"id": "housing",   "label": label_fn["housing"],   "color": "#4FD1C5",
             "items": _items([
                 {"id": "h1", "label": "Miete / Hypothek",  "amount": round(buckets["h1"], 2)},
                 {"id": "h2", "label": "Nebenkosten",        "amount": round(buckets["h2"], 2)},
                 {"id": "h3", "label": "Internet / Telefon", "amount": round(buckets["h3"], 2)},
             ], [])},
            {"id": "living",    "label": label_fn["living"],    "color": "#68D391",
             "items": _items([
                 {"id": "l1", "label": "Ernährung",  "amount": round(buckets["l1"], 2)},
                 {"id": "l2", "label": "Kleidung",   "amount": round(buckets["l2"], 2)},
                 {"id": "l3", "label": "Transport",  "amount": round(buckets["l3"], 2)},
                 {"id": "l4", "label": "Freizeit",   "amount": round(buckets["l4"], 2)},
             ], extra_other)},
            {"id": "savings",   "label": label_fn["savings"],   "color": "#B794F4",
             "items": _items([
                 {"id": "s1", "label": "Sparkonto",     "amount": round(buckets["s1"], 2)},
                 {"id": "s2", "label": "Investitionen", "amount": round(buckets["s2"], 2)},
             ], extra_sav)},
        ],
    }


def _extract_budget_from_text(text: str) -> dict:
    tl = text.lower()
    income = 0.0
    for pat in [
        # Flexible m+ to handle typos like "einkommmen" (triple m)
        r"haushaltsnettoeinkomm+en[:\s\n]*([\d][\d\.\,\s\xa0]*\d)\s*(?:€|EUR)",
        r"haushaltsnettoinkommen[:\s\n]*([\d][\d\.\,\s\xa0]*\d)\s*(?:€|EUR)",
        r"nettoeinkommen[:\s\n]*([\d][\d\.\,\s\xa0]*\d)\s*(?:€|EUR)",
        r"nettoinkommen[:\s\n]*([\d][\d\.\,\s\xa0]*\d)\s*(?:€|EUR)",
        r"([\d][\d\.\,\s\xa0]*\d),00\s*(?:€|EUR)\s*/",
        r"([\d][\d\.\,\s\xa0]*\d),00\s*(?:€|EUR)\s*\.",
        r"haushaltsnettoeinkommen[:\s\n]*([\d][\d\.\,\s\xa0]*\d)\s*(?:€|EUR)",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            income = _parse_amount(m.group(1))
            if income > 0:
                break

    AMOUNT_PAT = r"([\d]{1,3}(?:[\. ]?\d{3})*,\d{2})\s*€"

    # Format A: "Label (N) Amount €"
    MARKER_RE = re.compile(
        r"([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9 \-/\.]{1,40}?)\s*\(\d+\)\s*\n?\s*" + AMOUNT_PAT
    )
    # Format B: "Label  Amount €" (2+ spaces)
    SPACE_RE = re.compile(
        r"([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9 \-/\.]{1,40}?)  +" + AMOUNT_PAT
    )
    # Format C: "v (N) Label Amount €" — checkmark before item number
    V_MARKER_RE = re.compile(
        r"[v✓]\s+\(\d+\)\s+"
        r"([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9 \-/\.\+]{2,50}?)"
        r"\s+" + AMOUNT_PAT
    )
    # Format D: "v (N) LabelGARBLED,cents €" — pdfplumber embeds column digits into label
    # e.g. "KFZ-Versicher1u0n2g,00 €" → label="KFZ-Versicher", digits="102", amount=102.00
    V_GARBLED_RE = re.compile(
        r"[v✓]\s+\(\d+\)\s+"
        r"([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\-/\.]{3,})"  # letter-only label prefix
        r"(\w*)"                                           # garbled middle (digits mixed with letters)
        r",(\d{2})\s*€"                                    # ,cents €
    )

    raw_items: list[tuple[str, float]] = []
    seen: set[str] = set()

    for pattern in [MARKER_RE, V_MARKER_RE, SPACE_RE]:
        for m in pattern.finditer(text):
            label = m.group(1).strip().rstrip(".")
            amount = _parse_amount(m.group(2).replace(" ", ""))
            key = label.lower().strip()
            if amount > 0 and 2 < len(label) < 50 and key not in seen:
                raw_items.append((label, amount))
                seen.add(key)

    # Format D: extract digits from garbled middle to reconstruct amount
    for m in V_GARBLED_RE.finditer(text):
        label = m.group(1).strip().rstrip(".")
        key = label.lower().strip()
        if key in seen or len(label) < 3:
            continue
        garbled = m.group(2)
        cents = m.group(3)
        int_digits = "".join(c for c in garbled if c.isdigit())
        if not int_digits:
            continue
        try:
            amount = float(f"{int_digits}.{cents}")
        except ValueError:
            continue
        if amount > 0 and amount < 100000:
            raw_items.append((label, amount))
            seen.add(key)

    is_haushalts = any(kw in tl for kw in ["haushaltsbudget", "haushaltsnettoinkommen", "haushaltsnettoeinkommen", "haushaltsnettoeinkomm", "schutzengel"])
    return _classify_raw_items(income, raw_items, is_haushalts)


def _extract_budget_from_ocr_text(text: str) -> dict:
    """OCR-specific parser: handles single-space separators and split amounts."""
    tl = text.lower()

    income = 0.0
    for pat in [
        r"haushaltsnettoeinkommen[:\s]*([\d][\d\.\,\s\xa0]*\d)\s*€",
        r"nettoeinkommen[:\s]*([\d][\d\.\,\s\xa0]*\d)\s*€",
        r"einkommen[:\s]*([\d][\d\.\,\s\xa0]*\d)\s*€",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            income = _parse_amount(m.group(1))
            break

    # Split every line on (N)/(1)/{N} markers so each item is its own segment.
    # This separates multiple items that OCR merges onto one line from multi-column PDFs.
    all_segs = []
    for line in text.split('\n'):
        parts = re.split(r'(?=[\(\[{][\dN]\)?[\]\}]?\s*[A-Za-zÄÖÜäöüß])', line)
        for part in parts:
            s = part.strip()
            if s:
                all_segs.append(s)

    # Merge marker-but-no-amount segments with the next standalone amount,
    # skipping over segments that already have their own amounts.
    normalized = []
    i = 0
    while i < len(all_segs):
        seg = all_segs[i]
        has_marker = bool(re.match(r'[\(\[{][\dN]\)?[\]\}]?', seg))
        has_amount = bool(re.search(r'\d+,\d{2}\s*€', seg))

        if has_marker and not has_amount:
            merged = False
            for j in range(i + 1, min(i + 8, len(all_segs))):
                nxt = all_segs[j].strip()
                nxt_is_marker = bool(re.match(r'[\(\[{][\dN]\)?[\]\}]?\s*[A-Za-zÄÖÜäöüß]', nxt))
                nxt_has_amount = bool(re.search(r'\d+,\d{2}\s*€', nxt))
                if nxt_is_marker and not nxt_has_amount:
                    break  # another unresolved label claims the next amount
                amt = re.match(r'^([\d][\d\s\.]*,\d{2}\s*€)', nxt)
                if amt:
                    normalized.append(seg + '  ' + amt.group(1))
                    merged = True
                    break
            if not merged:
                normalized.append(seg)
        else:
            normalized.append(seg)
        i += 1

    norm_text = '\n'.join(normalized)

    # RE1: standard — (marker)(label)(1+ spaces)(amount)
    OCR_RE1 = re.compile(
        r"[\(\[{][\dN]\)?[\]\}]?\s*"
        r"([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9 \-/\.]{1,50}?)"
        r"\s+([\d]{1,3}(?:[ \.]?\d{3})*,\d{2})\s*€",
    )

    # RE2: merged lines — label (stops at single-char words like OCR "v" artifacts)
    # followed by noise up to 80 chars, then double-space + amount (our merge marker).
    OCR_RE2 = re.compile(
        r"[\(\[{][\dN]\)?[\]\}]?\s*"
        r"([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9\-/\.]+(?:\s[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9\-/\.]+)*)"
        r"[^€\n]{0,80}"
        r"  ([\d]{1,3}(?:[ \.]?\d{3})*,\d{2})\s*€",
    )

    raw_items: list[tuple[str, float]] = []
    seen: set[str] = set()

    for pattern in [OCR_RE1, OCR_RE2]:
        for m in pattern.finditer(norm_text):
            label = m.group(1).strip().rstrip('.')
            amount = _parse_amount(m.group(2).replace(' ', ''))
            key = label.lower().strip()
            if amount > 0 and 2 < len(label) < 60 and key not in seen:
                raw_items.append((label, amount))
                seen.add(key)

    is_haushalts = any(kw in tl for kw in ["haushaltsbudget", "haushaltsnettoeinkommen", "schutzengel"])
    logger.info(f"OCR parser: income={income}, items={len(raw_items)}, is_haushalts={is_haushalts}")
    return _classify_raw_items(income, raw_items, is_haushalts)


def _ocr_extract_budget(file_path: str) -> dict | None:
    """Render PDF pages to images → pytesseract OCR → regex budget parser."""
    try:
        import fitz
        import pytesseract
        from PIL import Image
        import io

        pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"
        pdf = fitz.open(file_path)
        full_text = ""
        for page_num in range(min(len(pdf), 3)):
            pix = pdf[page_num].get_pixmap(matrix=fitz.Matrix(2.5, 2.5))
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            page_text = pytesseract.image_to_string(img, lang="deu+eng", config="--psm 6")
            full_text += page_text + "\n"
            logger.info(f"OCR page {page_num}: {len(page_text)} chars")

        logger.info(f"OCR total text: {len(full_text)} chars")
        if not full_text.strip():
            logger.warning("OCR returned empty text")
            return None

        budget_data = _extract_budget_from_ocr_text(full_text)
        has_any = any(
            i["amount"] > 0
            for c in budget_data.get("categories", [])
            for i in c.get("items", [])
        )
        if not has_any and budget_data.get("income", 0) == 0:
            logger.warning("OCR text parsed but no amounts found")
            logger.debug(f"OCR text sample:\n{full_text[:500]}")
            return None

        logger.info(
            f"OCR budget: income={budget_data.get('income')}, "
            f"cats={len(budget_data.get('categories', []))}"
        )
        return budget_data
    except Exception as e:
        logger.warning(f"OCR budget extraction failed: {e}")
        return None


def _vision_extract_budget(file_path: str) -> dict | None:
    """Render first PDF page → GPT-4o Vision → structured budget dict."""
    try:
        import fitz
        pdf = fitz.open(file_path)
        pix = pdf[0].get_pixmap(matrix=fitz.Matrix(2, 2))
        img_bytes = pix.tobytes("png")
    except Exception as e:
        logger.warning(f"PDF render failed: {e}")
        return None

    prompt = """Du siehst ein Haushaltsbudget-Dokument mit mehreren Spalten.

AUFGABE: Extrahiere jede Spalte als separate Kategorie — exakt so wie im Dokument.

REGELN (strikt einhalten):
1. Jede farbige Spaltenüberschrift (z.B. "Schutzengel", "Wohnen", "Leben / Konsum", "Sparen") = eine Kategorie
2. Nimm den EXAKTEN Kategorienamen aus dem Dokument (nicht übersetzen, nicht umbenennen)
3. Füge NUR Zeilen hinzu, die einen Eurobetrag haben (z.B. "400,00 €") — Zeilen OHNE Betrag überspringen
4. Überspringe auch: Kopfzeilen (Name/mtl.), Summenzeilen (%, "Vom Einkommen"), "Neuer Ausgabentyp"
5. Beträge als Dezimalzahl: 400.00 (nicht "400,00 €")
6. income = 0 wenn kein Nettoeinkommen angegeben

Kategorie-IDs und Farben (nach Spaltenposition von links):
- Spalte 1 → id="insurance", color="#C8922A"
- Spalte 2 → id="housing",   color="#C0392B"
- Spalte 3 → id="living",    color="#D4820A"
- Spalte 4 → id="savings",   color="#2D8A4E"
Falls mehr oder weniger Spalten: gleiche Logik, fortlaufende IDs.

Gib NUR valides JSON zurück (kein Markdown, keine Erklärung):
{
  "income": 0,
  "categories": [
    {
      "id": "insurance",
      "label": "Schutzengel",
      "color": "#C8922A",
      "items": [
        {"id": "i1", "label": "Berufsunfähigkeit", "amount": 20.00},
        {"id": "i2", "label": "Unfall", "amount": 20.00}
      ]
    }
  ]
}"""

    try:
        from openai import OpenAI
        b64 = base64.standard_b64encode(img_bytes).decode("utf-8")
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        resp = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                    {"type": "text", "text": prompt},
                ],
            }]
        )
        raw = resp.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rsplit("```", 1)[0]
        data = json.loads(raw)
        logger.info(f"GPT-4o Vision budget: income={data.get('income')}, cats={len(data.get('categories', []))}")
        return data
    except Exception as e:
        logger.warning(f"GPT-4o Vision budget failed: {e}")
        return None


@router.post("/import/{doc_id}")
def import_budget_from_document(
    doc_id: int,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    from app.models.document import Document

    user = _get_user(authorization, db)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.owner_id != user["id"]:
        raise HTTPException(403, "Not allowed")

    # Step 1: quick text scan to detect document type
    text = ""
    try:
        import pdfplumber
        with pdfplumber.open(doc.file_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
    except Exception:
        pass

    logger.info(f"Budget import doc={doc_id}: file={doc.file_path}, text_len={len(text)}")

    HAUSHALTS_SIGNALS = ["schutzengel", "wohnen", "leben", "sparen", "haushaltsbudget",
                         "haushaltsnettoeinkommen", "neuer ausgabentyp"]
    is_visual_budget = any(sig in text.lower() for sig in HAUSHALTS_SIGNALS)

    budget_data = None

    if is_visual_budget:
        # Multi-column budget table — Vision understands the layout, regex does not
        logger.info("Visual budget detected → using GPT-4o Vision directly")
        budget_data = _vision_extract_budget(doc.file_path)

    if not budget_data and text.strip():
        logger.info("Falling back to regex parser")
        budget_data = _extract_budget_from_text(text)

    if not budget_data:
        logger.info("Trying OCR")
        budget_data = _ocr_extract_budget(doc.file_path)

    if not budget_data:
        raise HTTPException(422, f"Could not extract budget from doc {doc_id}. File: {doc.file_path}")

    logger.info(
        f"Budget import doc={doc_id}: income={budget_data.get('income')}, "
        f"cats={len(budget_data.get('categories', []))}, "
        f"items={sum(len(c.get('items', [])) for c in budget_data.get('categories', []))}"
    )

    p = _current_period()
    row = db.query(Budget).filter(Budget.user_id == user["id"], Budget.period == p).first()
    if row:
        row.data = budget_data
    else:
        row = Budget(user_id=user["id"], period=p, data=budget_data)
        db.add(row)
    db.commit()

    return {"ok": True, "budget": budget_data, "period": p}
