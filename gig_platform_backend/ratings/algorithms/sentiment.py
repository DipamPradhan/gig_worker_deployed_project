# from decimal import Decimal

# from .predictor import predict_sentiment


# def analyze_review_sentiment(text):
#     text = (text or "").strip()
#     if not text:
#         return "NEUTRAL", Decimal("0.0000"), Decimal("0.5000"), {
#             "model_prediction": "Neutral",
#             "model_probability": 0.5,
#             "signed_score": 0.0,
#         }

#     model_label, probability = predict_sentiment(text)
#     positive_probability = float(probability)
#     signed_score = max(min((positive_probability * 2.0) - 1.0, 1.0), -1.0)
#     compound = Decimal(str(round(signed_score, 4)))

#     if compound >= Decimal("0.12"):
#         label = "POSITIVE"
#     elif compound <= Decimal("-0.12"):
#         label = "NEGATIVE"
#     else:
#         label = "NEUTRAL"

#     confidence_raw = 0.5 + abs(positive_probability - 0.5)
#     confidence = Decimal(str(round(confidence_raw, 4)))

#     return label, compound, confidence, {
#         "model_prediction": model_label,
#         "model_probability": round(positive_probability, 4),
#         "signed_score": round(signed_score, 4),
#     }
from decimal import Decimal

from .predictor import predict_sentiment


def analyze_review_sentiment(text):
    text = (text or "").strip()

    if not text:
        return "NEUTRAL", Decimal("0.5000"), Decimal("0.5000"), {
            "model_prediction": "Neutral",
            "model_probability": 0.5,
        }

    model_label, probability = predict_sentiment(text)

    probability = float(probability)

    if probability >= 0.56:
        label = "POSITIVE"
    elif probability <= 0.44:
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"

    confidence = Decimal(
        str(round(max(probability, 1 - probability), 4))
    )

    sentiment_score = Decimal(str(round(probability, 4)))

    return label, sentiment_score, confidence, {
        "model_prediction": model_label,
        "model_probability": round(probability, 4),
    }