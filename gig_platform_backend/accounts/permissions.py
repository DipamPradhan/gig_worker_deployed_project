from rest_framework.permissions import BasePermission

from .models import CustomUser


class IsAdminUserType(BasePermission):
    message = "Only admin users can perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Allow Django-native admin users for smoother operations.
        if user.is_superuser or user.is_staff:
            return True

        return bool(
            user.user_type == CustomUser.Choice.ADMIN
            and hasattr(user, "admin_profile")
            and user.admin_profile.can_verify_workers
        )


class IsWorkerUserType(BasePermission):
    message = "Only workers can perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.user_type == CustomUser.Choice.WORKER
            and hasattr(user, "worker_profile")
        )
