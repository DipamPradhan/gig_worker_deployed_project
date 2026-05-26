from rest_framework import serializers

from .models import WorkerReview, ReviewSentiment, WorkerRecommendationScore


class WorkerReviewSerializer(serializers.ModelSerializer):
    reviewer_details = serializers.SerializerMethodField(read_only=True)
    reviewer_display_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WorkerReview
        fields = (
            "id",
            "request",
            "reviewer",
            "reviewer_details",
            "reviewer_display_name",
            "worker",
            "rating",
            "review_text",
            "moderation_status",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reviewer",
            "reviewer_details",
            "reviewer_display_name",
            "worker",
            "moderation_status",
            "created_at",
            "updated_at",
        )

    def get_reviewer_details(self, obj):
        reviewer = obj.reviewer
        if reviewer is None:
            return None

        return {
            "id": str(reviewer.id),
            "first_name": reviewer.first_name,
            "last_name": reviewer.last_name,
            "username": reviewer.username,
        }

    def get_reviewer_display_name(self, obj):
        reviewer = obj.reviewer
        if reviewer is None:
            return "Customer"

        full_name = f"{reviewer.first_name} {reviewer.last_name}".strip()
        if full_name:
            return full_name

        if reviewer.username:
            return reviewer.username

        return "Customer"


class ReviewSentimentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewSentiment
        fields = (
            "id",
            "review",
            "label",
            "compound_score",
            "confidence",
            "metadata",
            "processed_at",
        )
        read_only_fields = fields


class WorkerRecommendationScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerRecommendationScore
        fields = (
            "id",
            "worker",
            "raw_average_rating",
            "total_reviews",
            "bayesian_rating",
            "average_sentiment_compound",
            "sentiment_adjustment",
            "average_distance_km",
            "distance_component",
            "recommendation_score",
            "rank_last_updated_at",
        )
        read_only_fields = fields
