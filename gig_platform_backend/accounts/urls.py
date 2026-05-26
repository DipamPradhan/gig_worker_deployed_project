from django.urls import path
from .views import (
    DeleteUserView,
    MeView,
    RegisterView,
    BecomeWorkerView,
    UserProfileView,
    WorkerDocumentListView,
    WorkerDocumentUploadView,
    WorkerProfileView,
    WorkerAvailabilityUpdateView,
    AllWorkerListView,
    PendingWorkerVerificationListView,
    PendingWorkerDocumentListView,
    WorkerVerificationActionView,
    WorkerDocumentVerificationActionView,
)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="user"),
    path("profile/", UserProfileView.as_view(), name="user_profile"),
    path("become-worker/", BecomeWorkerView.as_view(), name="become_worker"),
    path("worker/profile/", WorkerProfileView.as_view(), name="worker_profile"),
    path(
        "worker/documents/", WorkerDocumentListView.as_view(), name="worker_documents"
    ),
    path(
        "worker/documents/upload/",
        WorkerDocumentUploadView.as_view(),
        name="upload_document",
    ),
    path(
        "worker/availability/",
        WorkerAvailabilityUpdateView.as_view(),
        name="worker_availability",
    ),
    path(
        "admin/workers/",
        AllWorkerListView.as_view(),
        name="admin_all_workers",
    ),
    path(
        "admin/workers/pending/",
        PendingWorkerVerificationListView.as_view(),
        name="admin_pending_workers",
    ),
    path(
        "admin/documents/pending/",
        PendingWorkerDocumentListView.as_view(),
        name="admin_pending_documents",
    ),
    path(
        "admin/workers/<uuid:worker_id>/verify/",
        WorkerVerificationActionView.as_view(),
        name="admin_verify_worker",
    ),
    path(
        "admin/documents/<uuid:document_id>/verify/",
        WorkerDocumentVerificationActionView.as_view(),
        name="admin_verify_document",
    ),
    path("profile/delete/", DeleteUserView.as_view(), name="profile_delete"),
]
