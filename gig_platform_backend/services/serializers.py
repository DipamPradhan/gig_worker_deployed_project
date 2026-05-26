from rest_framework import serializers
from accounts.models import WorkerProfile

from .models import (
    ServiceCategory,
    ServiceRequest,
    ServiceRequestEvent,
)


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ("id", "name", "slug", "is_active")


class ServiceRequestSerializer(serializers.ModelSerializer):
    request_latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True,
    )
    request_longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True,
    )
    request_address = serializers.CharField(required=False, allow_blank=True)
    search_radius_km = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
    )
    preferred_worker_id = serializers.UUIDField(
        write_only=True,
        required=False,
        allow_null=True,
    )
    assigned_worker_details = serializers.SerializerMethodField(read_only=True)
    requester_details = serializers.SerializerMethodField(read_only=True)
    customer_visible_status = serializers.SerializerMethodField(read_only=True)
    has_review = serializers.SerializerMethodField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = ServiceRequest
        fields = (
            "id",
            "requester",
            "requester_details",
            "category",
            "category_name",
            "title",
            "description",
            "request_latitude",
            "request_longitude",
            "request_address",
            "search_radius_km",
            "status",
            "customer_visible_status",
            "has_review",
            "preferred_worker_id",
            "assigned_worker",
            "assigned_worker_details",
            "assigned_at",
            "expected_start_at",
            "closed_at",
            "cancellation_reason",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "requester",
            "status",
            "assigned_worker",
            "assigned_at",
            "closed_at",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user and hasattr(request.user, "user_profile"):
            user_profile = request.user.user_profile

            if attrs.get("request_latitude") is None:
                attrs["request_latitude"] = user_profile.current_latitude
            if attrs.get("request_longitude") is None:
                attrs["request_longitude"] = user_profile.current_longitude
            if not attrs.get("request_address") and user_profile.current_address:
                attrs["request_address"] = user_profile.current_address

        if attrs.get("request_latitude") is None or attrs.get("request_longitude") is None:
            raise serializers.ValidationError(
                {
                    "detail": (
                        "Location is missing. Set your profile location before creating a request."
                    )
                }
            )

        preferred_worker_id = attrs.get("preferred_worker_id")
        if not preferred_worker_id:
            return attrs

        worker_profile = WorkerProfile.objects.filter(worker_id=preferred_worker_id).first()
        if not worker_profile:
            raise serializers.ValidationError(
                {"preferred_worker_id": "Selected worker was not found."}
            )

        if worker_profile.verification_status != WorkerProfile.VERIFICATION_STATUS.VERIFIED:
            raise serializers.ValidationError(
                {"preferred_worker_id": "Selected worker is not verified."}
            )

        if worker_profile.availability_status != WorkerProfile.AVAILABILITY_STATUS.ACTIVE:
            raise serializers.ValidationError(
                {"preferred_worker_id": "Selected worker is not currently active."}
            )

        attrs["preferred_worker_profile"] = worker_profile
        return attrs

    def create(self, validated_data):
        validated_data.pop("preferred_worker_id", None)
        validated_data.pop("preferred_worker_profile", None)
        return super().create(validated_data)

    def get_requester_details(self, obj):
        requester = obj.requester
        return {
            "id": str(requester.id),
            "first_name": requester.first_name,
            "last_name": requester.last_name,
            "username": requester.username,
            "phone_number": requester.phone_number,
            "email": requester.email,
        }

    def get_assigned_worker_details(self, obj):
        if not obj.assigned_worker:
            return None

        worker_user = obj.assigned_worker.worker
        return {
            "id": str(obj.assigned_worker.id),
            "worker_id": str(worker_user.id),
            "first_name": worker_user.first_name,
            "last_name": worker_user.last_name,
            "username": worker_user.username,
            "service_category": obj.assigned_worker.service_category,
            "average_rating": obj.assigned_worker.average_rating,
            "total_reviews": obj.assigned_worker.total_reviews,
            "availability_status": obj.assigned_worker.availability_status,
        }

    def get_customer_visible_status(self, obj):
        if (
            obj.status == ServiceRequest.Status.CANCELLED
            and (obj.cancellation_reason or "").lower().startswith("rejected by worker")
        ):
            return "REJECTED"
        if obj.status in [ServiceRequest.Status.OPEN, ServiceRequest.Status.MATCHING]:
            return "PENDING"
        return obj.status

    def get_has_review(self, obj):
        return hasattr(obj, "worker_review")


class WorkerRequestActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["accept", "reject"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["action"] == "reject" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError(
                {"rejection_reason": "Rejection reason is required for reject action."}
            )
        return attrs


class WorkerRecommendationResultSerializer(serializers.Serializer):
    worker_id = serializers.UUIDField()
    worker_name = serializers.CharField()
    phone_number = serializers.CharField(allow_null=True)
    username = serializers.CharField(allow_null=True)
    service_category = serializers.CharField()
    skills = serializers.CharField(allow_null=True)
    bio = serializers.CharField(allow_null=True)
    hourly_rate = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    total_jobs_completed = serializers.IntegerField()
    total_reviews = serializers.IntegerField()
    user_latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    user_longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    worker_latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    worker_longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    distance_km = serializers.DecimalField(max_digits=8, decimal_places=3)
    bayesian_rating = serializers.DecimalField(max_digits=5, decimal_places=4)
    sentiment_score = serializers.DecimalField(max_digits=6, decimal_places=4)
    final_score = serializers.DecimalField(max_digits=7, decimal_places=4)


class ServiceRequestStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            ServiceRequest.Status.ARRIVING,
            ServiceRequest.Status.IN_PROGRESS,
            ServiceRequest.Status.COMPLETED,
            ServiceRequest.Status.CANCELLED,
        ]
    )
    detail = serializers.CharField(required=False, allow_blank=True)


class ServiceRequestCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)


class ServiceRequestEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequestEvent
        fields = ("id", "request", "event_type", "actor", "detail", "created_at")
        read_only_fields = fields


