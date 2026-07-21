from decimal import Decimal


def bayesian_rating(raw_average, review_count, global_mean=3.5, confidence=10):
    # Calculate weighted average rating using Bayesian approach 
    raw_average = Decimal(str(raw_average))
    review_count = Decimal(str(review_count))
    global_mean = Decimal(str(global_mean))
    confidence = Decimal(str(confidence))

    return ((confidence * global_mean) + (review_count * raw_average)) / (
        confidence + review_count
    )

def recommendation_score(distance_km,bayesian_rate,sentiment_adj=0.5,max_radius=20):
    # Calculate recommendation score based on distance, rating, and sentiment
    distance_part = max(0.0, 1 - float(distance_km) / float(max_radius))
    rating_part = float(bayesian_rate) / 5
    sentiment_part = float(sentiment_adj)

    return (
        0.35 * distance_part +
        0.25 * rating_part +
        0.40 * sentiment_part
    )