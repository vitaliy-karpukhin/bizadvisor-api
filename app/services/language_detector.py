from langdetect import detect

def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        if lang.startswith("de"):
            return "de"
        if lang.startswith("en"):
            return "en"
        return "unknown"
    except:
        return "unknown"