from uuid import UUID

from django.core.exceptions import ValidationError
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from services.models import ServiceRequest
from services.algorithms.ranking import bayesian_rating, recommendation_score

from .algorithms.sentiment import analyze_review_sentiment
from .models import WorkerReview, ReviewSentiment, WorkerRecommendationScore
from .serializers import (
	WorkerReviewSerializer,
	ReviewSentimentSerializer,
)


def _refresh_worker_recommendation_score(worker_profile):
	aggregate = WorkerReview.objects.filter(
		worker=worker_profile,
		moderation_status=WorkerReview.ModerationStatus.APPROVED,
	).aggregate(
		avg_rating=Avg("rating"), review_count=Count("id")
	)
	review_count = aggregate["review_count"] or 0
	avg_rating = aggregate["avg_rating"] or 0


	worker_profile.average_rating = avg_rating
	worker_profile.total_reviews = review_count
	worker_profile.save(update_fields=["average_rating", "total_reviews", "updated_at"])

	sentiment_avg = ReviewSentiment.objects.filter(review__worker=worker_profile).aggregate(
		avg_compound=Avg("compound_score")
	)["avg_compound"] or 0

	score_obj, _ = WorkerRecommendationScore.objects.get_or_create(worker=worker_profile)
	score_obj.raw_average_rating = avg_rating
	score_obj.total_reviews = review_count
	score_obj.bayesian_rating = bayesian_rating(avg_rating, review_count)
	score_obj.average_sentiment_compound = sentiment_avg
	score_obj.sentiment_adjustment = sentiment_avg

	# Distance component is updated in services flow using location-specific search context.
	score_obj.recommendation_score = recommendation_score(
		distance_km=score_obj.average_distance_km,
		bayesian_rate=score_obj.bayesian_rating,
		sentiment_adj=score_obj.average_sentiment_compound,
		max_radius=20,
	)
	score_obj.save()


class WorkerReviewListCreateView(generics.ListCreateAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = WorkerReviewSerializer

	def get_queryset(self):
		worker_id = self.request.query_params.get("worker_id")
		queryset = WorkerReview.objects.select_related("worker", "request", "reviewer")
		if worker_id:
			try:
				UUID(worker_id)
			except (ValueError, AttributeError):
				return queryset.none()
			return queryset.filter(
				worker__worker_id=worker_id,
				moderation_status=WorkerReview.ModerationStatus.APPROVED,
			)
		return queryset.filter(reviewer=self.request.user)

	def create(self, request, *args, **kwargs):
		request_id = request.data.get("request")
		if not request_id:
			return Response(
				{"request": ["This field is required."]},
				status=status.HTTP_400_BAD_REQUEST,
			)

		service_request = get_object_or_404(
			ServiceRequest.objects.select_related("assigned_worker"),
			id=request_id,
		)
		if service_request.requester_id != request.user.id:
			return Response(
				{"detail": "You can only review your own completed request."},
				status=status.HTTP_403_FORBIDDEN,
			)
		if service_request.status != ServiceRequest.Status.COMPLETED:
			return Response(
				{"detail": "Rating is allowed only after request completion."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		if service_request.assigned_worker_id is None:
			return Response(
				{"detail": "No worker assigned for this request."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		# Enforce one review per request. The model uses a OneToOneField on
		# `request`, but check proactively and provide a clear error message.
		existing_review = WorkerReview.objects.filter(request=service_request).first()

		if existing_review:
			return Response(
				{"detail": "A review has already been submitted for this request."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		serializer = self.get_serializer(data=request.data)

		serializer.is_valid(raise_exception=True)

		review = serializer.save(
			reviewer=request.user,
			worker=service_request.assigned_worker,
			moderation_status=WorkerReview.ModerationStatus.APPROVED,
		)
		response_status = status.HTTP_201_CREATED

		label, compound, confidence = analyze_review_sentiment(review.review_text)
		ReviewSentiment.objects.update_or_create(
			review=review,
			defaults={
				"label": label,
				"compound_score": compound,
				"confidence": confidence,
				"metadata": {},
			},
		)
		_refresh_worker_recommendation_score(service_request.assigned_worker)

		return Response(WorkerReviewSerializer(review).data, status=response_status)


class ReviewSentimentListView(generics.ListAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = ReviewSentimentSerializer

	def get_queryset(self):
		return ReviewSentiment.objects.select_related("review", "review__worker")
