from django.urls import path

from .views import (
    WorkerReviewListCreateView,
    ReviewSentimentListView,
)

urlpatterns = [
    path("reviews/", WorkerReviewListCreateView.as_view(), name="worker_reviews"),
    path("sentiments/", ReviewSentimentListView.as_view(), name="review_sentiments"),
]
