from django.urls import path

from .views import (
    ServiceCategoryListView,
    ServiceRequestListCreateView,
    ServiceRequestCustomerCancelView,
    WorkerRequestInboxView,
    WorkerRequestActionView,
    WorkerAssignedRequestListView,
    RecommendedWorkerSearchView,
    ServiceRequestWorkerStatusUpdateView,
)

urlpatterns = [
    path("categories/", ServiceCategoryListView.as_view(), name="service_categories"),
    path("recommended-workers/", RecommendedWorkerSearchView.as_view(), name="recommended_workers"),
    path("requests/", ServiceRequestListCreateView.as_view(), name="service_requests"),
    path(
        "requests/<uuid:request_id>/cancel/",
        ServiceRequestCustomerCancelView.as_view(),
        name="service_request_customer_cancel",
    ),
    path("worker/assigned-requests/", WorkerAssignedRequestListView.as_view(), name="worker_assigned_requests"),
    path("worker/inbox/", WorkerRequestInboxView.as_view(), name="worker_request_inbox"),
    path(
        "requests/<uuid:request_id>/worker-action/",
        WorkerRequestActionView.as_view(),
        name="request_worker_action",
    ),
    path(
        "requests/<uuid:request_id>/worker-status/",
        ServiceRequestWorkerStatusUpdateView.as_view(),
        name="request_worker_status_update",
    ),
]
