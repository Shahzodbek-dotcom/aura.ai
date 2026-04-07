from __future__ import annotations

import json
import re
from datetime import datetime
from decimal import Decimal
from typing import Any

from anthropic import Anthropic
from openai import OpenAI

from apps.backend.app.core.config import get_settings

settings = get_settings()

ALLOWED_CATEGORIES = (
    "food",
    "transport",
    "shopping",
    "bills",
    "health",
    "entertainment",
    "education",
    "general",
)

CATEGORY_RULES: dict[str, dict[str, list[str]]] = {
    "food": {
        "strong": [
            "ovqat",
            "oziq ovqat",
            "tushlik",
            "kechki",
            "nonushta",
            "restoran",
            "cafe",
            "kafe",
            "coffee",
            "kofe",
            "burger",
            "pizza",
            "qovoq",
            "kartoshka",
            "piyoz",
            "sabzi",
            "pomidor",
            "bodring",
            "banan",
            "olma",
            "nok",
            "uzum",
            "gosht",
            "go sht",
            "tovuq",
            "non",
            "sut",
            "qatiq",
            "yog",
            "guruch",
            "makaron",
            "ichimlik",
            "cola",
            "pepsi",
            "fanta",
            "suv",
            "lavash",
            "somsa",
            "shaurma",
            "meva",
            "sabzavot",
        ],
        "weak": ["market", "korzinka", "havas", "baraka", "olcha"],
    },
    "transport": {
        "strong": [
            "taxi",
            "yandex",
            "metro",
            "bus",
            "avtobus",
            "chipta",
            "yolkira",
            "yo lkira",
            "benzin",
            "fuel",
            "zapravka",
            "parkovka",
            "parking",
            "transfer",
            "dostavka",
        ],
        "weak": ["transport", "gaz", "balon", "evakuator", "moy"],
    },
    "shopping": {
        "strong": [
            "kiyim",
            "dokon",
            "do kon",
            "store",
            "shopping",
            "naaski",
            "noski",
            "paypoq",
            "tursik",
            "trusik",
            "futbolka",
            "shim",
            "kofta",
            "kurtka",
            "etik",
            "krasovka",
            "oyoqkiyim",
            "sumka",
            "telefon",
            "quloqchin",
            "sovga",
            "sovg a",
            "idish",
            "sovun",
            "shampun",
            "krem",
            "pasta",
            "chotka",
            "cho tka",
            "noutbuk",
            "kompyuter",
            "monitor",
            "avtomobil",
            "mashina",
            "avto",
            "oyinchoq",
            "o yinchoq",
        ],
        "weak": ["oldim", "sotib oldim"],
    },
    "bills": {
        "strong": ["ijara", "internet", "kommunal", "electricity", "water", "subscription", "obuna"],
        "weak": ["gaz", "svet", "tok", "wifi"],
    },
    "health": {
        "strong": ["dorixona", "pharmacy", "doctor", "shifokor", "clinic", "analiz", "dori"],
        "weak": ["vitamin", "tabletka"],
    },
    "entertainment": {
        "strong": ["kino", "netflix", "game", "concert", "music", "playstation", "steam"],
        "weak": ["park", "bowling", "karaoke"],
    },
    "education": {
        "strong": ["course", "kitob", "book", "education", "dars", "kontrakt", "oqish", "o qish"],
        "weak": ["ruchka", "daftar", "qalam"],
    },
}


def _normalize_text(text: str) -> str:
    lowered = text.lower()
    lowered = lowered.replace("'", "").replace("`", "")
    lowered = re.sub(r"[^\w\s]", " ", lowered, flags=re.UNICODE)
    lowered = re.sub(r"\s+", " ", lowered).strip()
    return lowered


def _normalize_amount(raw_amount: str) -> Decimal:
    text = raw_amount.lower().replace(",", ".").replace(" ", "")
    multiplier = Decimal("1")
    if "mln" in text or "million" in text:
        multiplier = Decimal("1000000")
    elif "ming" in text or "k" in text:
        multiplier = Decimal("1000")

    numeric = re.sub(r"[^0-9.]", "", text) or "0"
    return (Decimal(numeric) * multiplier).quantize(Decimal("0.01"))


def _score_category(normalized_text: str, category: str) -> int:
    tokens = normalized_text.split()
    rules = CATEGORY_RULES[category]
    score = 0

    for keyword in rules["strong"]:
        normalized_keyword = _normalize_text(keyword)
        if normalized_keyword in normalized_text:
            score += 5
        if normalized_keyword in tokens:
            score += 3

    for keyword in rules["weak"]:
        normalized_keyword = _normalize_text(keyword)
        if normalized_keyword in normalized_text:
            score += 2
        if normalized_keyword in tokens:
            score += 1

    return score


def _heuristic_category(message: str) -> str:
    normalized = _normalize_text(message)
    if not normalized:
        return "general"

    scores = {category: _score_category(normalized, category) for category in CATEGORY_RULES}

    if any(word in normalized for word in ("avtomobil", "mashina", "avto")) and not any(
        word in normalized for word in ("taxi", "yandex", "benzin", "zapravka", "parkovka", "yolkira", "yo lkira")
    ):
        scores["shopping"] += 6

    if any(word in normalized for word in ("market", "korzinka", "havas", "baraka")) and any(
        word in normalized
        for word in ("qovoq", "kartoshka", "meva", "sabzavot", "non", "sut", "ovqat", "ichimlik")
    ):
        scores["food"] += 4

    if any(word in normalized for word in ("qovoq", "kartoshka", "piyoz", "sabzi", "pomidor", "bodring")):
        scores["food"] += 5

    if any(word in normalized for word in ("naaski", "noski", "paypoq", "tursik", "trusik", "futbolka", "shim")):
        scores["shopping"] += 5

    if "oldim" in normalized and scores["shopping"] > 0 and scores["food"] == 0:
        scores["shopping"] += 2

    if "oldim" in normalized and scores["food"] > 0:
        scores["food"] += 2

    if any(word in normalized for word in ("taxi", "yandex", "metro", "avtobus", "benzin", "parkovka")):
        scores["transport"] += 4

    best_category = max(scores, key=scores.get)
    return best_category if scores[best_category] >= 4 else "general"


def _split_expense_message(message: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", message.strip())
    parts = re.split(r"\s*,\s*|\s+keyin\s+|\s+va\s+", normalized, flags=re.IGNORECASE)
    cleaned = [part.strip(" .;:-") for part in parts if part.strip(" .;:-")]
    return cleaned or [normalized]


def heuristic_parse_expense(message: str) -> dict[str, Any]:
    amount_match = re.search(r"(\d[\d\s,.]*\s?(?:mln|million|ming|k)?)", message.lower())
    amount = _normalize_amount(amount_match.group(1)) if amount_match else Decimal("0")
    if amount <= 0:
        amount = Decimal("10000.00")

    title = message.strip().capitalize()
    if len(title) > 160:
        title = title[:157] + "..."

    return {
        "title": title,
        "amount": amount,
        "category": _heuristic_category(message),
        "transaction_date": datetime.utcnow().isoformat(),
        "notes": message,
        "parser": "heuristic",
    }


def heuristic_parse_expenses(message: str) -> list[dict[str, Any]]:
    parts = _split_expense_message(message)
    parsed_items = [heuristic_parse_expense(part) for part in parts]
    return [item for item in parsed_items if item["amount"] > 0]


def _extract_json_block(text: str) -> Any:
    match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON payload found in AI response")
    return json.loads(match.group(0))


def _prompt_for_expense(message: str) -> str:
    return (
        "Extract one or more expenses from the user text and return only JSON. "
        "If there is one expense, return an array with one object. "
        "Each object must have keys title, amount, category, transaction_date, notes. "
        "Allowed categories are exactly: food, transport, shopping, bills, health, entertainment, education, general. "
        "Use food for groceries, produce, drinks, cafes and meals. "
        "Use shopping for clothes, electronics, household goods and item purchases. "
        "Use transport only for taxi, fuel, parking, fares and mobility costs. "
        "Use general only when the category cannot be inferred confidently. "
        "Amount must be numeric without currency symbols. "
        f"User message: {message}"
    )


def _prompt_for_category(message: str) -> str:
    return (
        "Classify the expense into one category and return only JSON like "
        '{"category":"food"}. '
        "Allowed categories are exactly: food, transport, shopping, bills, health, entertainment, education, general. "
        "Rules: food=grocery/produce/drinks/meal/cafe; shopping=clothes/accessories/electronics/household item purchase; "
        "transport=taxi/fuel/parking/ticket/travel cost; bills=utilities/subscriptions/rent; "
        "general only when unknown. "
        f"Expense text: {message}"
    )


def _normalize_expense_payload(payload: Any, parser_name: str) -> list[dict[str, Any]]:
    items = payload if isinstance(payload, list) else [payload]
    normalized: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        item["parser"] = parser_name
        normalized.append(item)
    return normalized


def _normalize_category(value: str | None) -> str:
    if not value:
        return "general"
    normalized = value.strip().lower()
    return normalized if normalized in ALLOWED_CATEGORIES else "general"


def _classify_category_with_openai(message: str) -> str | None:
    if not settings.openai_api_key:
        return None
    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.responses.create(model=settings.openai_model, input=_prompt_for_category(message))
        parsed = _extract_json_block(response.output_text)
        if isinstance(parsed, dict):
            return _normalize_category(parsed.get("category"))
    except Exception:
        return None
    return None


def _classify_category_with_anthropic(message: str) -> str | None:
    if not settings.anthropic_api_key:
        return None
    try:
        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=120,
            messages=[{"role": "user", "content": _prompt_for_category(message)}],
        )
        text = "".join(block.text for block in response.content if getattr(block, "type", "") == "text")
        parsed = _extract_json_block(text)
        if isinstance(parsed, dict):
            return _normalize_category(parsed.get("category"))
    except Exception:
        return None
    return None


def _refine_categories(items: list[dict[str, Any]], parser_name: str) -> list[dict[str, Any]]:
    refined: list[dict[str, Any]] = []
    for item in items:
        expense_text = f"{item.get('title', '')}. {item.get('notes', '')}".strip()
        category = (
            _classify_category_with_openai(expense_text)
            or _classify_category_with_anthropic(expense_text)
            or _heuristic_category(expense_text)
        )
        item["category"] = category
        item["parser"] = parser_name
        refined.append(item)
    return refined


def parse_expense_with_ai(message: str) -> list[dict[str, Any]]:
    prompt = _prompt_for_expense(message)

    if settings.openai_api_key:
        try:
            client = OpenAI(api_key=settings.openai_api_key)
            response = client.responses.create(model=settings.openai_model, input=prompt)
            parsed = _extract_json_block(response.output_text)
            normalized = _normalize_expense_payload(parsed, "openai")
            if normalized:
                return _refine_categories(normalized, "openai")
        except Exception:
            pass

    if settings.anthropic_api_key:
        try:
            client = Anthropic(api_key=settings.anthropic_api_key)
            response = client.messages.create(
                model=settings.anthropic_model,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )
            text = "".join(block.text for block in response.content if getattr(block, "type", "") == "text")
            parsed = _extract_json_block(text)
            normalized = _normalize_expense_payload(parsed, "anthropic")
            if normalized:
                return _refine_categories(normalized, "anthropic")
        except Exception:
            pass

    return _refine_categories(heuristic_parse_expenses(message), "heuristic")


def generate_insight_with_ai(summary_text: str) -> tuple[str, str, str]:
    prompt = (
        "You are an engaging personal finance coach. "
        "Write one short, insightful note for a dashboard user. "
        "Return JSON with keys title, content, advice_type. "
        "Keep content under 180 characters and specific. "
        f"Summary: {summary_text}"
    )

    if settings.openai_api_key:
        try:
            client = OpenAI(api_key=settings.openai_api_key)
            response = client.responses.create(model=settings.openai_model, input=prompt)
            parsed = _extract_json_block(response.output_text)
            return parsed["title"], parsed["content"], parsed.get("advice_type", "planning")
        except Exception:
            pass

    if settings.anthropic_api_key:
        try:
            client = Anthropic(api_key=settings.anthropic_api_key)
            response = client.messages.create(
                model=settings.anthropic_model,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )
            text = "".join(block.text for block in response.content if getattr(block, "type", "") == "text")
            parsed = _extract_json_block(text)
            return parsed["title"], parsed["content"], parsed.get("advice_type", "planning")
        except Exception:
            pass

    return heuristic_generate_insight(summary_text)


def heuristic_generate_insight(summary_text: str) -> tuple[str, str, str]:
    lowered = summary_text.lower()
    if "food" in lowered or "coffee" in lowered or "kofe" in lowered:
        return (
            "Coffee check-in",
            "Bu hafta ichimlik va yengil ovqat xarajatlari oshgan. Shu temp davom etsa asosiy maqsadingiz biroz sekinlashadi.",
            "alert",
        )
    if "transport" in lowered or "taxi" in lowered:
        return (
            "Transport pulse",
            "Taxi xarajatlari ko'tarilgan. Bir necha qatnovni rejalashtirib birlashtirsangiz jamg'arma tezroq o'sadi.",
            "saving",
        )
    return (
        "Momentum looks good",
        "Xarajatlaringizni yozib borayotganingizning o'zi katta ustunlik. Yana 1-2 hafta trend yig'ilsa maslahatlar ancha aniq bo'ladi.",
        "planning",
    )
