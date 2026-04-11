from app.utils.text import (
    normalize_text, extract_brand, extract_storage,
    extract_ram, extract_screen_size, extract_color, build_variant_key,
)


def normalize_product(raw: dict) -> dict:
    """
    Takes raw scraped data and returns a normalized product dict.

    Input example:
        {
            "title": "Samsung Galaxy A15 Dual SIM 128GB 4GB RAM - Black",
            "price": 289900,
            "old_price": 320000,
            ...
        }
    """
    title = raw.get("title", "")
    norm_title = normalize_text(title)

    brand = raw.get("brand") or extract_brand(title)
    model = raw.get("model") or _extract_model(title, brand)
    storage = raw.get("storage") or extract_storage(title)
    ram = raw.get("ram") or extract_ram(title)
    color = raw.get("color") or extract_color(title)
    size = raw.get("size") or extract_screen_size(title)

    variant_key = None
    if brand and model:
        variant_key = build_variant_key(brand, model, storage, ram)

    return {
        **raw,
        "brand": brand,
        "model": model,
        "storage": storage,
        "ram": ram,
        "color": color,
        "size": size,
        "normalized_title": norm_title,
        "variant_key": variant_key,
    }


def _extract_model(title: str, brand: str | None) -> str | None:
    """
    Naive model extractor: takes the 2-4 words after the brand name.
    Improve this per category with regex patterns.
    """
    if not brand:
        return None
    import re
    lower = title.lower()
    brand_lower = brand.lower()
    idx = lower.find(brand_lower)
    if idx == -1:
        return None
    after = title[idx + len(brand):].strip()
    # Take up to 3 words as model name, stop at known spec tokens
    tokens = after.split()
    model_tokens = []
    stop_tokens = {"dual", "sim", "gb", "ram", "inch", '"', "black", "white"}
    for tok in tokens[:4]:
        if tok.lower() in stop_tokens:
            break
        model_tokens.append(tok)
    return " ".join(model_tokens) if model_tokens else None
