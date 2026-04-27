import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def extract_with_ai(text: str, language: str) -> str:
    """
    Извлечение финансовых данных из документа через OpenAI.
    """
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
    response = client.chat.completions.create(
        model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


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
