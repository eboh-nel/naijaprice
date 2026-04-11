import re
import unicodedata


PROMO_WORDS = [
    "free delivery", "official store", "top seller", "best price",
    "flash sale", "hot deal", "new arrival", "limited offer",
]

UNIT_NORMALIZATIONS = {
    r"\bGB\b": "GB",
    r"\bgb\b": "GB",
    r"\bMB\b": "MB",
    r"\btb\b": "TB",
    r"\bTB\b": "TB",
    r"\binch\b": '"',
    r"\binches\b": '"',
    r'(\d+)\s*"': r'\1"',
}


def normalize_text(text: str) -> str:
    """Lowercase, strip accents, collapse whitespace, remove promo words."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    for word in PROMO_WORDS:
        text = text.replace(word, "")
    text = re.sub(r"[^\w\s\-\"/]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_brand(title: str) -> str | None:
    known_brands = [
        "apple", "samsung", "tecno", "infinix", "itel", "xiaomi",
        "realme", "oppo", "vivo", "huawei", "nokia", "lg", "sony",
        "hp", "dell", "lenovo", "asus", "acer", "hisense", "haier",
    ]
    lower = title.lower()
    for brand in known_brands:
        if brand in lower:
            return brand.title()
    return None


def extract_storage(title: str) -> str | None:
    match = re.search(r"(\d+)\s*GB(?!\s*RAM)", title, re.IGNORECASE)
    return f"{match.group(1)}GB" if match else None


def extract_ram(title: str) -> str | None:
    match = re.search(r"(\d+)\s*GB\s*RAM", title, re.IGNORECASE)
    if match:
        return f"{match.group(1)}GB"
    match = re.search(r"(\d+)\s*RAM", title, re.IGNORECASE)
    return f"{match.group(1)}GB" if match else None


def extract_screen_size(title: str) -> str | None:
    match = re.search(r'(\d+\.?\d*)\s*(?:inch|")', title, re.IGNORECASE)
    return f'{match.group(1)}"' if match else None


def extract_color(title: str) -> str | None:
    colors = [
        "black", "white", "blue", "red", "green", "gold", "silver",
        "purple", "pink", "grey", "gray", "midnight", "starlight",
        "phantom", "ocean",
    ]
    lower = title.lower()
    for color in colors:
        if color in lower:
            return color.title()
    return None


def build_variant_key(brand: str, model: str, storage: str = None, ram: str = None) -> str:
    parts = [brand.upper(), model.upper()]
    if storage:
        parts.append(storage)
    if ram:
        parts.append(ram)
    return "|".join(parts)


def clean_price(price_str: str) -> float | None:
    """Parse a Nigerian price string like '₦289,900' to float."""
    cleaned = re.sub(r"[^\d.]", "", price_str)
    try:
        return float(cleaned)
    except ValueError:
        return None
