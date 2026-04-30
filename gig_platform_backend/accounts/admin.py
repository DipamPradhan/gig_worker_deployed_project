from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    UserProfile,
    WorkerProfile,
    WorkerDocument,
    SavedLocation,
    AdminProfile,
)


class CustomUserAdmin(UserAdmin):
    model = CustomUser

    list_display = (
        "id",
        "email",
        "username",
        "user_type",
        "is_staff",
        "is_active",
    )
    list_filter = ("user_type", "is_staff", "is_active")

    ordering = ("email",)
    search_fields = ("email", "username", "phone_number")

    fieldsets = UserAdmin.fieldsets + (
        (
            "Extra Fields",
            {"fields": ("phone_number", "user_type", "profile_picture")},
        ),
    )


admin.site.register(CustomUser, CustomUserAdmin)


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "id", "preferred_radius_km", "updated_at")
    search_fields = ("user__email", "user__username")


admin.site.register(UserProfile, UserProfileAdmin)


class WorkerProfileAdmin(admin.ModelAdmin):
    non_editable_status_fields = ("worker","verified_at","verified_by","service_category","average_rating","total_reviews","total_jobs_completed",)
    list_display = (
        "worker",
        "id",
        "service_category",
        "verification_status",
        "availability_status",
        "updated_at",
    )
    list_filter = ("verification_status", "availability_status", "service_category")
    search_fields = ("worker__email", "worker__username", "skills")
    ordering = ("-updated_at",)

    def get_readonly_fields(self, request, obj=None):
        if request.user.is_superuser:
            return ()

        non_editable = set(self.non_editable_status_fields)
        model_fields = [field.name for field in self.model._meta.fields]
        return tuple(field_name for field_name in model_fields if field_name in non_editable)

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        return request.user.has_perm("accounts.change_workerprofile")

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        return request.user.has_perm("accounts.view_workerprofile") or request.user.has_perm(
            "accounts.change_workerprofile"
        )


admin.site.register(WorkerProfile, WorkerProfileAdmin)


class WorkerDocumentAdmin(admin.ModelAdmin):
    editable_status_fields = ("verification_status", "rejection_reason",)

    list_display = (
        "id",
        "worker_profile",
        "worker_user_id",
        "document_type",
        "document_number",
        "verification_status",
        "uploaded_at",
    )
    list_filter = ("document_type", "verification_status")
    search_fields = ("worker_profile__worker__email", "document_number")
    ordering = ("-uploaded_at",)

    def get_readonly_fields(self, request, obj=None):
        if request.user.is_superuser:
            return ()

        editable = set(self.editable_status_fields)
        model_fields = [field.name for field in self.model._meta.fields]
        return tuple(field_name for field_name in model_fields if field_name not in editable)

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        return request.user.has_perm("accounts.change_workerdocument")

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        return request.user.has_perm("accounts.view_workerdocument") or request.user.has_perm(
            "accounts.change_workerdocument"
        )

    @admin.display(description="Worker User ID")
    def worker_user_id(self, obj):
        return obj.worker_profile.worker_id


admin.site.register(WorkerDocument, WorkerDocumentAdmin)


class SavedLocationAdmin(admin.ModelAdmin):
    list_display = ("id", "user_profile", "label", "location_type", "is_default")
    list_filter = ("location_type", "is_default")


admin.site.register(SavedLocation, SavedLocationAdmin)


class AdminProfileAdmin(admin.ModelAdmin):
    list_display = (
        "admin",
        "id",
        "can_verify_workers",
        "can_manage_users",
        "total_verifications",
    )


admin.site.register(AdminProfile, AdminProfileAdmin)
admin.site.site_header = "Gig Worker Control Panel"
admin.site.site_title = "Gig Worker Admin"
admin.site.index_title = "Operations Dashboard"