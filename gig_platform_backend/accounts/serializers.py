from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from services.models import ServiceCategory
from .models import CustomUser, UserProfile, WorkerDocument, WorkerProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "user_type",
            "is_staff",
            "is_superuser",
            "profile_picture",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "user_type",
            "is_staff",
            "is_superuser",
            "date_joined",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = (
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "password",
            "password2",
        )

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")

        email = validated_data["email"].lower()
        password = validated_data.pop("password")

        base_username = email.split("@")[0]
        username = base_username
        counter = 1

        while CustomUser.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            phone_number=validated_data["phone_number"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            user_type=CustomUser.Choice.USER,
        )
        UserProfile.objects.create(user=user)

        return user


class BecomeWorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = (
            "service_category",
            "skills",
            "bio",
            "hourly_rate",
            "service_latitude",
            "service_longitude",
            "service_radius_km",
        )

    def validate_service_category(self, value):
        normalized_value = str(value).strip()
        if not normalized_value:
            raise serializers.ValidationError("Service category is required.")

        category = ServiceCategory.objects.filter(
            name__iexact=normalized_value,
            is_active=True,
        ).only("name").first()

        if category is None:
            available_categories = list(
                ServiceCategory.objects.filter(is_active=True)
                .order_by("name")
                .values_list("name", flat=True)
            )
            if available_categories:
                raise serializers.ValidationError(
                    f"Invalid service category. Must be one of: {', '.join(available_categories)}"
                )
            raise serializers.ValidationError(
                "No active service categories are configured. Please contact admin."
            )

        return category.name

    def create(self, validated_data):
        user = self.context["request"].user

        if user.user_type == CustomUser.Choice.ADMIN:
            raise serializers.ValidationError("Admin cannot become worker.")

        if hasattr(user, "worker_profile"):
            raise serializers.ValidationError("Worker profile already exists.")

        worker_profile = WorkerProfile.objects.create(worker=user, **validated_data)

        user.user_type = CustomUser.Choice.WORKER
        user.save(update_fields=["user_type"])

        return worker_profile


class WorkerDocumentSerializer(serializers.ModelSerializer):
    worker_profile_id = serializers.UUIDField(source="worker_profile.id", read_only=True)
    worker_user_id = serializers.UUIDField(source="worker_profile.worker_id", read_only=True)
    worker_name = serializers.SerializerMethodField(read_only=True)
    worker_service_category = serializers.CharField(
        source="worker_profile.service_category", read_only=True
    )

    class Meta:
        model = WorkerDocument
        fields = (
            "id",
            "worker_profile_id",
            "worker_user_id",
            "worker_name",
            "worker_service_category",
            "document_type",
            "document_number",
            "document_file",
            "verification_status",
            "rejection_reason",
            "uploaded_at",
        )
        read_only_fields = [
            "id",
            "uploaded_at",
            "verification_status",
            "rejection_reason",
            "worker_name",
        ]

    def get_worker_name(self, obj):
        return obj.worker_profile.worker.get_full_name()

    def create(self, validated_data):
        user = self.context["request"].user

        if not hasattr(user, "worker_profile"):
            raise serializers.ValidationError("Create worker profile first.")

        if user.user_type != CustomUser.Choice.WORKER:
            raise serializers.ValidationError("Only workers can upload documents.")

        return WorkerDocument.objects.create(
            worker_profile=user.worker_profile, **validated_data
        )


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = (
            "current_latitude",
            "current_longitude",
            "current_address",
            "preferred_radius_km",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class WorkerProfileSerializer(serializers.ModelSerializer):
    worker = UserSerializer(read_only=True)
    worker_id = serializers.UUIDField(source="worker.id", read_only=True)
    has_verified_document = serializers.SerializerMethodField(read_only=True)
    documents_count = serializers.SerializerMethodField(read_only=True)
    ranking_score = serializers.SerializerMethodField(read_only=True)
    bayesian_rating = serializers.SerializerMethodField(read_only=True)
    sentiment_score = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WorkerProfile
        fields = (
            "worker",
            "worker_id",
            "service_category",
            "skills",
            "bio",
            "hourly_rate",
            "service_latitude",
            "service_longitude",
            "service_radius_km",
            "verification_status",
            "availability_status",
            "rejection_reason",
            "has_verified_document",
            "documents_count",
            "average_rating",
            "bayesian_rating",
            "sentiment_score",
            "ranking_score",
            "total_reviews",
            "total_jobs_completed",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "verification_status",
            "rejection_reason",
            "average_rating",
            "total_reviews",
            "total_jobs_completed",
            "created_at",
            "updated_at",
        )

    def get_has_verified_document(self, obj):
        return obj.documents.filter(
            verification_status=WorkerDocument.VERIFICATION_STATUS.VERIFIED
        ).exists()

    def get_documents_count(self, obj):
        return obj.documents.count()

    def get_ranking_score(self, obj):
        score = getattr(obj, "recommendation_score", None)
        return score.recommendation_score if score else None

    def get_bayesian_rating(self, obj):
        score = getattr(obj, "recommendation_score", None)
        return score.bayesian_rating if score else None

    def get_sentiment_score(self, obj):
        score = getattr(obj, "recommendation_score", None)
        return score.average_sentiment_compound if score else None


class WorkerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = ("availability_status",)

    def validate_availability_status(self, value):
        worker_profile = self.instance
        active_statuses = ["ASSIGNED", "ARRIVING", "IN_PROGRESS"]
        has_active_job = worker_profile.assigned_requests.filter(
            status__in=active_statuses
        ).exists()

        if has_active_job and value != WorkerProfile.AVAILABILITY_STATUS.BUSY:
            raise serializers.ValidationError(
                "Worker is busy with an active job. Complete or cancel it before changing availability."
            )

        if (
            value == WorkerProfile.AVAILABILITY_STATUS.ACTIVE
            and worker_profile.verification_status
            != WorkerProfile.VERIFICATION_STATUS.VERIFIED
        ):
            raise serializers.ValidationError(
                "Worker must be verified before setting active status."
            )

        if value == WorkerProfile.AVAILABILITY_STATUS.ACTIVE:
            has_verified_document = worker_profile.documents.filter(
                verification_status=WorkerDocument.VERIFICATION_STATUS.VERIFIED
            ).exists()
            if not has_verified_document:
                raise serializers.ValidationError(
                    "At least one verified document is required to become active."
                )

        return value


class WorkerVerificationActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["action"] == "reject" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError(
                {"rejection_reason": "Rejection reason is required."}
            )
        return attrs


class DocumentVerificationActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["action"] == "reject" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError(
                {"rejection_reason": "Rejection reason is required."}
            )
        return attrs
