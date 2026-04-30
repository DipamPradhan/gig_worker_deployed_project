from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import AdminProfile, UserProfile, WorkerDocument, WorkerProfile
from .serializers import (
    UserProfileSerializer,
    UserSerializer,
    RegisterSerializer,
    WorkerDocumentSerializer,
    BecomeWorkerSerializer,
    WorkerProfileSerializer,
    WorkerAvailabilitySerializer,
    WorkerVerificationActionSerializer,
    DocumentVerificationActionSerializer,
)
from rest_framework.parsers import MultiPartParser, FormParser
from .permissions import IsAdminUserType, IsWorkerUserType

# Create your views here.


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user_profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return user_profile

    def perform_update(self, serializer):
        profile = serializer.save()
        user = self.request.user

        # Keep worker search distance in sync with worker profile updates from /accounts/profile/.
        if hasattr(user, "worker_profile"):
            worker_profile = user.worker_profile
            updates = []

            if profile.current_latitude is not None:
                worker_profile.service_latitude = profile.current_latitude
                updates.append("service_latitude")

            if profile.current_longitude is not None:
                worker_profile.service_longitude = profile.current_longitude
                updates.append("service_longitude")

            if updates:
                updates.append("updated_at")
                worker_profile.save(update_fields=updates)


class BecomeWorkerView(generics.CreateAPIView):
    serializer_class = BecomeWorkerSerializer
    permission_classes = [IsAuthenticated]
    queryset = WorkerProfile.objects.all()


class WorkerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = WorkerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user

        if not hasattr(user, "worker_profile"):
            return None
        return user.worker_profile

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj is None:
            return Response(
                {"detail": "Worker profile not found. Become a worker first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(self.get_serializer(obj).data)


class WorkerDocumentListView(generics.ListAPIView):
    serializer_class = WorkerDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not hasattr(user, "worker_profile"):
            return WorkerDocument.objects.none()

        return WorkerDocument.objects.filter(worker_profile=user.worker_profile)


class WorkerDocumentUploadView(generics.CreateAPIView):
    serializer_class = WorkerDocumentSerializer
    permission_classes = [IsAuthenticated]
    queryset = WorkerDocument.objects.all()
    parser_classes = [MultiPartParser, FormParser]


class WorkerAvailabilityUpdateView(generics.UpdateAPIView):
    serializer_class = WorkerAvailabilitySerializer
    permission_classes = [IsAuthenticated, IsWorkerUserType]

    def get_object(self):
        return self.request.user.worker_profile


class PendingWorkerVerificationListView(generics.ListAPIView):
    serializer_class = WorkerProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUserType]

    def get_queryset(self):
        return WorkerProfile.objects.filter(
            verification_status=WorkerProfile.VERIFICATION_STATUS.PENDING
        ).select_related("worker", "recommendation_score")


class AllWorkerListView(generics.ListAPIView):
    serializer_class = WorkerProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUserType]

    def get_queryset(self):
        queryset = WorkerProfile.objects.select_related(
            "worker", "recommendation_score"
        ).order_by("-created_at")
        verification_status = self.request.query_params.get("verification_status")
        if verification_status:
            queryset = queryset.filter(verification_status=verification_status)
        return queryset


class PendingWorkerDocumentListView(generics.ListAPIView):
    serializer_class = WorkerDocumentSerializer
    permission_classes = [IsAuthenticated, IsAdminUserType]

    def get_queryset(self):
        return WorkerDocument.objects.filter(
            verification_status=WorkerDocument.VERIFICATION_STATUS.PENDING
        ).select_related("worker_profile__worker")


class WorkerVerificationActionView(generics.GenericAPIView):
    serializer_class = WorkerVerificationActionSerializer
    permission_classes = [IsAuthenticated, IsAdminUserType]
    queryset = WorkerProfile.objects.select_related("worker")

    def get_object(self):
        worker_id = self.kwargs["worker_id"]
        return get_object_or_404(self.queryset, worker__id=worker_id)

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        worker_profile = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        if action == "approve":
            worker_profile.verification_status = WorkerProfile.VERIFICATION_STATUS.VERIFIED
            worker_profile.verified_at = timezone.now()
            worker_profile.verified_by = request.user
            worker_profile.rejection_reason = ""
        else:
            worker_profile.verification_status = WorkerProfile.VERIFICATION_STATUS.REJECTED
            worker_profile.rejection_reason = serializer.validated_data["rejection_reason"]
            worker_profile.availability_status = WorkerProfile.AVAILABILITY_STATUS.INACTIVE

        worker_profile.save()
        admin_profile, _ = AdminProfile.objects.get_or_create(
            admin=request.user,
            defaults={
                "can_verify_workers": True,
                "can_manage_users": bool(request.user.is_staff or request.user.is_superuser),
            },
        )
        admin_profile.total_verifications += 1
        admin_profile.save(update_fields=["total_verifications"])

        return Response(WorkerProfileSerializer(worker_profile).data, status=status.HTTP_200_OK)


class WorkerDocumentVerificationActionView(generics.GenericAPIView):
    serializer_class = DocumentVerificationActionSerializer
    permission_classes = [IsAuthenticated, IsAdminUserType]
    queryset = WorkerDocument.objects.select_related("worker_profile__worker")
    lookup_field = "id"
    lookup_url_kwarg = "document_id"

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        document = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        if action == "approve":
            document.verification_status = WorkerDocument.VERIFICATION_STATUS.VERIFIED
            document.verified_at = timezone.now()
            document.verified_by = request.user
            document.rejection_reason = ""
        else:
            document.verification_status = WorkerDocument.VERIFICATION_STATUS.REJECTED
            document.rejection_reason = serializer.validated_data["rejection_reason"]

        document.save()
        return Response(WorkerDocumentSerializer(document).data, status=status.HTTP_200_OK)


class DeleteUserView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def delete(self, request, *args, **kwargs):
        user = request.user
        user.delete()
        return Response(
            {"message": "Account deleted successfully"}, status=status.HTTP_200_OK
        )
