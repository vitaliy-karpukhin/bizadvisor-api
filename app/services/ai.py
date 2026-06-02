import os
import base64
import json
import logging

logger = logging.getLogger(__name__)


def extract_with_ai(text: str, language: str) -> str:
    """Извлечение финансовых данных из документа через OpenAI (текстовые PDF)."""
    if language == "de":
        prompt = f"""
        Extrahiere Finanzinformationen aus diesem Dokument.

        {text}

        Gib JSON zurück:
        amount
        vendor
        date
        currency
        category
        document_type
        """
    else:
        prompt = f"""
        Extract financial information from this document.

        {text}

        Return JSON:
        amount
        vendor
        date
        currency
        category
        document_type
        """
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def extract_financial_data_from_image(image_bytes: bytes) -> dict:
    """
    Извлекает финансовые данные из изображения через Claude Vision (Anthropic).
    Возвращает {"events": [...], "document_type": "...", "vendor": "..."}
    """
    import anthropic

    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = """Analysiere dieses Finanzdokument und extrahiere alle Finanzdaten.

Gib NUR valides JSON zurück (kein Markdown, keine Erklärungen), in diesem Format:
{
  "document_type": "Einkommenssituation|Rechnung|Kontoauszug|Steuerbescheid|Ausgabenliste|Sonstiges",
  "vendor": "Name der Person oder Firma (null wenn nicht erkennbar)",
  "currency": "EUR",
  "events": [
    {
      "amount": 4500.00,
      "category": "income|revenue|expense|tax|other",
      "label": "kurze Bezeichnung",
      "period": "monthly|yearly|once"
    }
  ]
}

Regeln:
- Bei "Ausgabenliste": jede Zeile ist ein separates expense-Event
- Bei "Einkommenssituation": bevorzuge monatliche Beträge, category = "income"
- Bei Rechnung/Ausgabe: category = "expense"
- Bei Steuer: category = "tax"
- Beträge im deutschen Format: 4.500,00 → 4500.00
- Falls ein Betrag sowohl monatlich als auch jährlich angegeben ist: nimm den monatlichen
- vendor: Personen- oder Firmenname aus dem Dokument"""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )

    raw = response.content[0].text.strip()
    logger.info(f"Claude Vision raw response: {raw[:300]}")

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0]

    parsed = json.loads(raw)
    events = []
    for ev in parsed.get("events", []):
        amount = float(ev.get("amount", 0))
        if amount <= 0:
            continue
        events.append({
            "amount": round(amount, 2),
            "category": ev.get("category", "other"),
            "vendor": parsed.get("vendor"),
            "currency": parsed.get("currency", "EUR"),
        })

    return {
        "events": events,
        "document_type": parsed.get("document_type", "Sonstiges"),
        "vendor": parsed.get("vendor"),
    }


def get_mock_recommendations(user_id: int):
    return [
        {
            "problem": "High expenses",
            "effect": "Lower profit",
            "recommendation": "Reduce office costs",
            "action_url": "https://example.com/action/1",
        },
        {
            "problem": "Low income",
            "effect": "Slow growth",
            "recommendation": "Increase marketing",
            "action_url": "https://example.com/action/2",
        },
    ]
