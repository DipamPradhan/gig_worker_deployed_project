from django.db import transaction
from django.db.models import Count, Q
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsWorkerUserType
from accounts.models import WorkerProfile
from ratings.models import WorkerRecommendationScore
from services.algorithms.distance import haversine_km
from services.algorithms.ranking import bayesian_rating, recommendation_score

from .models import ServiceCategory, ServiceRequest, ServiceRequestEvent
from .serializers import (
	ServiceCategorySerializer,
	ServiceRequestSerializer,
	ServiceRequestCancelSerializer,
	WorkerRequestActionSerializer,
	WorkerRecommendationResultSerializer,
	ServiceRequestStatusUpdateSerializer,
)


def _recommended_candidates(user, category_id=None, max_radius_km=None):
	if not hasattr(user, "user_profile"):
		return []

	user_profile = user.user_profile
	if user_profile.current_latitude is None or user_profile.current_longitude is None:
		return []

	try:
		user_latitude = float(user_profile.current_latitude)
		user_longitude = float(user_profile.current_longitude)
		if not (-90.0 <= user_latitude <= 90.0 and -180.0 <= user_longitude <= 180.0):
			return []
	except (TypeError, ValueError):
		return []

	radius = float(max_radius_km or user_profile.preferred_radius_km)
	workers = WorkerProfile.objects.filter(
		verification_status=WorkerProfile.VERIFICATION_STATUS.VERIFIED,
		availability_status=WorkerProfile.AVAILABILITY_STATUS.ACTIVE,
		service_latitude__isnull=False,
		service_longitude__isnull=False,
		documents__verification_status="Verified",
	).select_related("worker").annotate(
		actual_completed_jobs=Count(
			"assigned_requests",
			filter=Q(assigned_requests__status=ServiceRequest.Status.COMPLETED),
			distinct=True,
		)	
	).distinct()

	if category_id:
		category_name = str(category_id)
		try:
			matched_category = ServiceCategory.objects.filter(id=category_id).only("name").first()
			if matched_category:
				category_name = matched_category.name
		except (TypeError, ValueError, DjangoValidationError):
			pass
		workers = workers.filter(service_category__iexact=category_name)

	result = []
	for worker in workers:
		try:
			distance_km = haversine_km(
				user_latitude,
				user_longitude,
				worker.service_latitude,
				worker.service_longitude,
			)
		except (TypeError, ValueError):
			continue
		worker_radius = float(worker.service_radius_km)
		effective_radius = min(radius, worker_radius)
		if distance_km > effective_radius:
			continue

		score_obj = WorkerRecommendationScore.objects.filter(worker=worker).first()
		if score_obj:
			worker_bayesian_rating = score_obj.bayesian_rating
			worker_sentiment_score = score_obj.average_sentiment_compound
		else:
			worker_bayesian_rating = bayesian_rating(worker.average_rating, worker.total_reviews)
			worker_sentiment_score = 0

		final_score = recommendation_score(
			distance_km=distance_km,
			bayesian_rate=worker_bayesian_rating,
			sentiment_adj=worker_sentiment_score,
			max_radius=effective_radius,
		)

		result.append(
			{
				"worker": worker,
				"user_latitude": user_latitude,
				"user_longitude": user_longitude,
				"worker_latitude": float(worker.service_latitude),
				"worker_longitude": float(worker.service_longitude),
				"distance_km": distance_km,
				"bayesian_rating": worker_bayesian_rating,
				"sentiment_score": worker_sentiment_score,
				"final_score": final_score,
			}
		)

	result.sort(key=lambda item: item["final_score"], reverse=True)
	return result


def _set_worker_availability(worker_profile, availability_status):
	if worker_profile.availability_status == availability_status:
		return False

	worker_profile.availability_status = availability_status
	worker_profile.save(update_fields=["availability_status", "updated_at"])
	return True


class ServiceCategoryListView(generics.ListAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = ServiceCategorySerializer
	queryset = ServiceCategory.objects.filter(is_active=True)


class ServiceRequestListCreateView(generics.ListCreateAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = ServiceRequestSerializer

	def get_queryset(self):
		user = self.request.user
		return ServiceRequest.objects.filter(requester=user).select_related(
			"category", "assigned_worker", "assigned_worker__worker"
		)

	def perform_create(self, serializer):
		preferred_worker_profile = serializer.validated_data.get("preferred_worker_profile")
		if not preferred_worker_profile:
			raise ValidationError({"preferred_worker_id": "Please select a worker to send this request."})

		request_obj = serializer.save(
			requester=self.request.user,
			status=ServiceRequest.Status.MATCHING,
			assigned_worker=preferred_worker_profile,
		)
		ServiceRequestEvent.objects.create(
			request=request_obj,
			event_type=ServiceRequestEvent.EventType.REQUESTED,
			actor=self.request.user,
			detail=f"Service request sent to selected worker {preferred_worker_profile.worker_id}.",
		)


class RecommendedWorkerSearchView(generics.GenericAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = WorkerRecommendationResultSerializer

	def get(self, request, *args, **kwargs):
		service_category = request.query_params.get("service_category")
		radius = request.query_params.get("radius")
		candidates = _recommended_candidates(
			user=request.user,
			category_id=service_category,
			max_radius_km=radius,
		)

		payload = [
			{
				"worker_id": item["worker"].worker_id,
				"worker_name": item["worker"].worker.get_full_name(),
				"phone_number": item["worker"].worker.phone_number,
				"username": item["worker"].worker.username,
				"service_category": item["worker"].service_category,
				"skills": item["worker"].skills,
				"bio": item["worker"].bio,
				"hourly_rate": item["worker"].hourly_rate,
				"total_jobs_completed": item["worker"].actual_completed_jobs,
				"total_reviews": item["worker"].total_reviews,
				"user_latitude": round(item["user_latitude"], 6),
				"user_longitude": round(item["user_longitude"], 6),
				"worker_latitude": round(item["worker_latitude"], 6),
				"worker_longitude": round(item["worker_longitude"], 6),
				"distance_km": round(item["distance_km"], 3),
				"bayesian_rating": item["bayesian_rating"],
				"sentiment_score": item["sentiment_score"],
				"final_score": round(item["final_score"], 4),
			}
			for item in candidates
		]

		return Response(payload, status=status.HTTP_200_OK)


class WorkerRequestInboxView(generics.ListAPIView):
	permission_classes = [IsAuthenticated, IsWorkerUserType]
	serializer_class = ServiceRequestSerializer

	def get_queryset(self):
		return ServiceRequest.objects.filter(
			assigned_worker=self.request.user.worker_profile,
			status=ServiceRequest.Status.MATCHING,
		).select_related("category", "requester", "assigned_worker", "assigned_worker__worker")


class WorkerRequestActionView(generics.GenericAPIView):
	permission_classes = [IsAuthenticated, IsWorkerUserType]
	serializer_class = WorkerRequestActionSerializer

	@transaction.atomic
	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		action = serializer.validated_data["action"]

		service_request = get_object_or_404(
			ServiceRequest.objects.select_for_update(),
			id=self.kwargs["request_id"],
		)

		if service_request.assigned_worker_id != request.user.worker_profile.id:
			return Response(
				{"detail": "This request does not belong to the current worker."},
				status=status.HTTP_403_FORBIDDEN,
			)

		if service_request.status != ServiceRequest.Status.MATCHING:
			return Response(
				{"detail": "This request is no longer pending worker response."},
				status=status.HTTP_409_CONFLICT,
			)

		if action == "accept":
			if request.user.worker_profile.verification_status != WorkerProfile.VERIFICATION_STATUS.VERIFIED:
				return Response(
					{"detail": "Worker must be verified before accepting requests."},
					status=status.HTTP_400_BAD_REQUEST,
				)

			if request.user.worker_profile.availability_status != WorkerProfile.AVAILABILITY_STATUS.ACTIVE:
				return Response(
					{"detail": "Worker must be available before accepting requests."},
					status=status.HTTP_400_BAD_REQUEST,
				)

			active_statuses = [ServiceRequest.Status.ASSIGNED, ServiceRequest.Status.ARRIVING, ServiceRequest.Status.IN_PROGRESS]
			if request.user.worker_profile.assigned_requests.filter(status__in=active_statuses).exists():
				return Response(
					{"detail": "Worker already has an active job. Finish it before accepting another request."},
					status=status.HTTP_409_CONFLICT,
				)

			service_request.assigned_at = timezone.now()
			service_request.status = ServiceRequest.Status.ASSIGNED
			service_request.save(update_fields=["assigned_at", "status", "updated_at"])
			_set_worker_availability(
				request.user.worker_profile,
				WorkerProfile.AVAILABILITY_STATUS.BUSY,
			)

			ServiceRequestEvent.objects.create(
				request=service_request,
				event_type=ServiceRequestEvent.EventType.ACCEPTED,
				actor=request.user,
				detail="Worker accepted request.",
			)
		else:
			rejection_reason = serializer.validated_data["rejection_reason"]
			service_request.assigned_worker = None
			service_request.status = ServiceRequest.Status.CANCELLED
			service_request.closed_at = timezone.now()
			service_request.cancellation_reason = f"Rejected by worker: {rejection_reason}"
			service_request.save(
				update_fields=[
					"assigned_worker",
					"status",
					"closed_at",
					"cancellation_reason",
					"updated_at",
				]
			)

			ServiceRequestEvent.objects.create(
				request=service_request,
				event_type=ServiceRequestEvent.EventType.REJECTED,
				actor=request.user,
				detail=rejection_reason,
			)

		return Response(ServiceRequestSerializer(service_request).data, status=status.HTTP_200_OK)


class WorkerAssignedRequestListView(generics.ListAPIView):
	permission_classes = [IsAuthenticated, IsWorkerUserType]
	serializer_class = ServiceRequestSerializer

	def get_queryset(self):
		return ServiceRequest.objects.filter(
			assigned_worker=self.request.user.worker_profile,
			status__in=[
				ServiceRequest.Status.ASSIGNED,
				ServiceRequest.Status.ARRIVING,
				ServiceRequest.Status.IN_PROGRESS,
				ServiceRequest.Status.COMPLETED,
				ServiceRequest.Status.CANCELLED,
			],
		).select_related("category", "requester", "assigned_worker", "assigned_worker__worker")


class ServiceRequestCustomerCancelView(generics.GenericAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = ServiceRequestCancelSerializer

	@transaction.atomic
	def post(self, request, *args, **kwargs):
		service_request = get_object_or_404(
			ServiceRequest.objects.select_for_update(),
			id=self.kwargs["request_id"],
			requester=request.user,
		)

		if service_request.assigned_worker_id is not None:
			return Response(
				{"detail": "You can only cancel before a worker accepts the request."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		if service_request.status not in [ServiceRequest.Status.OPEN, ServiceRequest.Status.MATCHING]:
			return Response(
				{"detail": "Only open or matching requests can be cancelled."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		reason = serializer.validated_data.get(
			"reason", "Cancelled by customer before worker acceptance."
		)
		service_request.status = ServiceRequest.Status.CANCELLED
		service_request.closed_at = timezone.now()
		service_request.cancellation_reason = reason
		service_request.save(update_fields=["status", "closed_at", "cancellation_reason", "updated_at"])

		ServiceRequestEvent.objects.create(
			request=service_request,
			event_type=ServiceRequestEvent.EventType.CANCELLED,
			actor=request.user,
			detail=reason,
		)

		return Response(ServiceRequestSerializer(service_request).data, status=status.HTTP_200_OK)


class ServiceRequestWorkerStatusUpdateView(generics.GenericAPIView):
	permission_classes = [IsAuthenticated, IsWorkerUserType]
	serializer_class = ServiceRequestStatusUpdateSerializer

	@transaction.atomic
	def post(self, request, *args, **kwargs):
		service_request = get_object_or_404(
			ServiceRequest,
			id=self.kwargs["request_id"],
		)

		if service_request.assigned_worker_id != request.user.worker_profile.id:
			return Response(
				{"detail": "Only assigned worker can update request status."},
				status=status.HTTP_403_FORBIDDEN,
			)

		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		new_status = serializer.validated_data["status"]
		detail = serializer.validated_data.get("detail", "")

		allowed = {
			ServiceRequest.Status.ASSIGNED: [ServiceRequest.Status.ARRIVING, ServiceRequest.Status.CANCELLED],
			ServiceRequest.Status.ARRIVING: [ServiceRequest.Status.IN_PROGRESS, ServiceRequest.Status.CANCELLED],
			ServiceRequest.Status.IN_PROGRESS: [ServiceRequest.Status.COMPLETED, ServiceRequest.Status.CANCELLED],
		}
		if new_status not in allowed.get(service_request.status, []):
			return Response(
				{"detail": f"Invalid transition from {service_request.status} to {new_status}."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		service_request.status = new_status
		update_fields = ["status", "updated_at"]

		if new_status == ServiceRequest.Status.IN_PROGRESS and service_request.expected_start_at is None:
			service_request.expected_start_at = timezone.now()
			update_fields.append("expected_start_at")

		if new_status in [ServiceRequest.Status.COMPLETED, ServiceRequest.Status.CANCELLED]:
			service_request.closed_at = timezone.now()
			update_fields.append("closed_at")

		service_request.save(update_fields=update_fields)

		if new_status in [ServiceRequest.Status.COMPLETED, ServiceRequest.Status.CANCELLED]:
			_set_worker_availability(
				request.user.worker_profile,
				WorkerProfile.AVAILABILITY_STATUS.ACTIVE,
			)

		event_type_map = {
			ServiceRequest.Status.ARRIVING: ServiceRequestEvent.EventType.ARRIVING,
			ServiceRequest.Status.IN_PROGRESS: ServiceRequestEvent.EventType.STARTED,
			ServiceRequest.Status.COMPLETED: ServiceRequestEvent.EventType.COMPLETED,
			ServiceRequest.Status.CANCELLED: ServiceRequestEvent.EventType.CANCELLED,
		}
		ServiceRequestEvent.objects.create(
			request=service_request,
			event_type=event_type_map[new_status],
			actor=request.user,
			detail=detail,
		)

		return Response(ServiceRequestSerializer(service_request).data, status=status.HTTP_200_OK)
