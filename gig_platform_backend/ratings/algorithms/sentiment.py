from decimal import Decimal
import re


POSITIVE_WORDS = {
    "good",
    "great",
    "excellent",
    "amazing",
    "professional",
    "fast",
    "clean",
    "polite",
    "friendly",
    "reliable",
    "perfect",
    "awesome",
    "helpful",
    "efficient",
    "skilled",
    "recommend",
    "satisfied",
    "best",
}

NEGATIVE_WORDS = {
    "bad",
    "worst",
    "poor",
    "late",
    "slow",
    "rude",
    "dirty",
    "unprofessional",
    "expensive",
    "broken",
    "terrible",
    "awful",
    "incomplete",
    "careless",
    "disappointed",
    "fraud",
    "scam",
    "waste",
}

INTENSIFIERS = {"very", "extremely", "highly", "really", "too", "super"}
NEGATIONS = {"not", "never", "no", "none", "hardly", "barely"}


def _tokenize(text):
    return re.findall(r"[a-zA-Z']+", text.lower())


def analyze_review_sentiment(text):
    text = (text or "").strip()
    if not text:
        return "NEUTRAL", Decimal("0.0000"), Decimal("0.5000")

    tokens = _tokenize(text)
    if not tokens:
        return "NEUTRAL", Decimal("0.0000"), Decimal("0.5000")

    score = 0.0
    matched = 0
    for idx, token in enumerate(tokens):
        base = 0.0
        if token in POSITIVE_WORDS:
            base = 1.0
        elif token in NEGATIVE_WORDS:
            base = -1.0
        else:
            continue

        matched += 1
        prev = tokens[idx - 1] if idx > 0 else ""
        prev2 = tokens[idx - 2] if idx > 1 else ""

        if prev in INTENSIFIERS or prev2 in INTENSIFIERS:
            base *= 1.5
        if prev in NEGATIONS or prev2 in NEGATIONS:
            base *= -1.0

        score += base

    if matched == 0:
        return "NEUTRAL", Decimal("0.0000"), Decimal("0.5000")

    normalized = score / max(matched * 1.5, 1)
    normalized = max(min(normalized, 1.0), -1.0)
    compound = Decimal(str(round(normalized, 4)))

    if compound >= Decimal("0.12"):
        label = "POSITIVE"
    elif compound <= Decimal("-0.12"):
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"

    lexical_coverage = matched / max(len(tokens), 1)
    confidence_raw = min(1.0, abs(float(compound)) + lexical_coverage)
    confidence = Decimal(str(round(max(confidence_raw, 0.45), 4)))

    return label, compound, confidence
