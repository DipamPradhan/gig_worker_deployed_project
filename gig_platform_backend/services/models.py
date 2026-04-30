from django.db import models
import uuid

from django.core.validators import MinValueValidator, MaxValueValidator


class ServiceCategory(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	name = models.CharField(max_length=80, unique=True)
	slug = models.SlugField(max_length=100, unique=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["name"]

	def __str__(self):
		return self.name


class ServiceRequest(models.Model):
	class Status(models.TextChoices):
		OPEN = "OPEN", "Open"
		MATCHING = "MATCHING", "Matching"
		ASSIGNED = "ASSIGNED", "Assigned"
		ARRIVING = "ARRIVING", "Arriving"
		IN_PROGRESS = "IN_PROGRESS", "In Progress"
		COMPLETED = "COMPLETED", "Completed"
		CANCELLED = "CANCELLED", "Cancelled"

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	requester = models.ForeignKey(
		"accounts.CustomUser",
		on_delete=models.CASCADE,
		related_name="service_requests",
	)
	category = models.ForeignKey(
		ServiceCategory,
		on_delete=models.PROTECT,
		related_name="service_requests",
	)
	title = models.CharField(max_length=140)
	description = models.TextField(blank=True)
	request_latitude = models.DecimalField(max_digits=9, decimal_places=6, db_index=True)
	request_longitude = models.DecimalField(
		max_digits=9, decimal_places=6, db_index=True
	)
	request_address = models.CharField(max_length=255, blank=True)
	search_radius_km = models.DecimalField(
		max_digits=5,
		decimal_places=2,
		default=10.0,
		validators=[MinValueValidator(0.2), MaxValueValidator(50.0)],
	)
	status = models.CharField(
		max_length=20,
		choices=Status.choices,
		default=Status.OPEN,
		db_index=True,
	)
	assigned_worker = models.ForeignKey(
		"accounts.WorkerProfile",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="assigned_requests",
	)
	assigned_at = models.DateTimeField(null=True, blank=True)
	expected_start_at = models.DateTimeField(null=True, blank=True)
	closed_at = models.DateTimeField(null=True, blank=True)
	cancellation_reason = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]
		indexes = [
			models.Index(fields=["status", "category"]),
			models.Index(fields=["requester", "status"]),
			models.Index(fields=["created_at"]),
		]

	def __str__(self):
		return f"{self.title} ({self.get_status_display()})"


class ServiceRequestEvent(models.Model):
	class EventType(models.TextChoices):
		REQUESTED = "REQUESTED", "Requested"
		ACCEPTED = "ACCEPTED", "Accepted"
		REJECTED = "REJECTED", "Rejected"
		ARRIVING = "ARRIVING", "Arriving"
		STARTED = "STARTED", "Started"
		COMPLETED = "COMPLETED", "Completed"
		CANCELLED = "CANCELLED", "Cancelled"

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	request = models.ForeignKey(
		ServiceRequest,
		on_delete=models.CASCADE,
		related_name="events",
	)
	event_type = models.CharField(max_length=20, choices=EventType.choices, db_index=True)
	actor = models.ForeignKey(
		"accounts.CustomUser",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="service_request_events",
	)
	detail = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["created_at"]
		indexes = [models.Index(fields=["request", "created_at"])]

	def __str__(self):
		return f"{self.event_type} - {self.request_id}"

