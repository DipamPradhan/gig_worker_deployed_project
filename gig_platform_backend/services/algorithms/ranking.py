from decimal import Decimal


def bayesian_rating(raw_average, review_count, global_mean=3.5, confidence=10):
    raw_average = Decimal(str(raw_average))
    review_count = Decimal(str(review_count))
    global_mean = Decimal(str(global_mean))
    confidence = Decimal(str(confidence))

    return ((confidence * global_mean) + (review_count * raw_average)) / (
        confidence + review_count
    )


def recommendation_score(distance_km, bayesian_rate, sentiment_adj=0, max_radius=20):
    """Distance-prioritized blended score in [0, 1]."""
    max_radius = max(float(max_radius), 0.1)    
    distance_part = max(0.0, 1.0 - (float(distance_km) / max_radius))
    rating_part = min(max(float(bayesian_rate) / 5.0, 0.0), 1.0)
    sentiment_part = min(max((float(sentiment_adj) + 1.0) / 2.0, 0.0), 1.0)

    return (0.55 * distance_part) + (0.35 * rating_part) + (0.10 * sentiment_part)
