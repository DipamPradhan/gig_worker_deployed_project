from django.db import models
import uuid

from django.core.validators import MinValueValidator, MaxValueValidator
from services.models import ServiceRequest
from accounts.models import CustomUser,WorkerProfile

class WorkerReview(models.Model):
	class ModerationStatus(models.TextChoices):
		PENDING = "PENDING", "Pending"
		APPROVED = "APPROVED", "Approved"
		REJECTED = "REJECTED", "Rejected"

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	request = models.OneToOneField(
		ServiceRequest,
		on_delete=models.CASCADE,
		related_name="worker_review",
	)
	reviewer = models.ForeignKey(
		CustomUser,
		on_delete=models.CASCADE,
		related_name="submitted_worker_reviews",
	)
	worker = models.ForeignKey(
		WorkerProfile,
		on_delete=models.CASCADE,
		related_name="received_reviews",
	)
	rating = models.PositiveSmallIntegerField(
		validators=[MinValueValidator(1), MaxValueValidator(5)]
	)
	review_text = models.TextField(blank=True)
	moderation_status = models.CharField(
		max_length=15,
		choices=ModerationStatus.choices,
		default=ModerationStatus.PENDING,
		db_index=True,
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]
		# One review per ServiceRequest is enforced via the OneToOneField on `request`.
		# Allow the same reviewer to review the same worker for different requests,
		# so we do not enforce a global (reviewer, worker) uniqueness constraint.
		indexes = [
			models.Index(fields=["worker", "created_at"]),
			models.Index(fields=["worker", "rating"]),
		]

	def __str__(self):
		return f"Review {self.rating}/5 for {self.worker_id}"


class ReviewSentiment(models.Model):
	class Label(models.TextChoices):
		POSITIVE = "POSITIVE", "Positive"
		NEUTRAL = "NEUTRAL", "Neutral"
		NEGATIVE = "NEGATIVE", "Negative"

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	review = models.OneToOneField(
		WorkerReview,
		on_delete=models.CASCADE,
		related_name="sentiment",
	)
	label = models.CharField(max_length=10, choices=Label.choices, db_index=True)
	compound_score = models.DecimalField(max_digits=5, decimal_places=4)
	confidence = models.DecimalField(max_digits=5, decimal_places=4)
	metadata = models.JSONField(default=dict, blank=True)
	processed_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		indexes = [models.Index(fields=["label", "processed_at"])]

	def __str__(self):
		return f"Sentiment {self.label} ({self.review_id}) {self.review.worker}"


class WorkerRecommendationScore(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	worker = models.OneToOneField(
		"accounts.WorkerProfile",
		on_delete=models.CASCADE,
		related_name="recommendation_score",
	)

	raw_average_rating = models.DecimalField(max_digits=4, decimal_places=3, default=0)
	total_reviews = models.PositiveIntegerField(default=0)
	bayesian_rating = models.DecimalField(max_digits=5, decimal_places=4, default=0)

	average_sentiment_compound = models.DecimalField(
		max_digits=5,
		decimal_places=4,
		default=0,
	)
	sentiment_adjustment = models.DecimalField(max_digits=6, decimal_places=4, default=0)
	average_distance_km = models.DecimalField(max_digits=8, decimal_places=3, default=0)
	distance_component = models.DecimalField(max_digits=6, decimal_places=4, default=0)
	recommendation_score = models.DecimalField(
		max_digits=7,
		decimal_places=4,
		default=0,
		db_index=True,
	)
	updated_at = models.DateTimeField(auto_now=True)
	rank_last_updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-recommendation_score"]
		indexes = [
			models.Index(fields=["recommendation_score", "rank_last_updated_at"]),
		]

	def __str__(self):
		return f"Score {self.recommendation_score} for {self.worker_id}"
