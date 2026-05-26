from django.contrib import admin
from .models import (
	ServiceCategory,
	ServiceRequest,
	ServiceRequestEvent,
)


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "slug", "is_active", "created_at")
	search_fields = ("name", "slug")
	list_filter = ("is_active",)
	readonly_fields = ("id",)


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"requester",
		"category",
		"status",
		"assigned_worker",
		"created_at",
	)
	list_filter = ("status", "category")
	search_fields = ("title", "requester__email")


@admin.register(ServiceRequestEvent)
class ServiceRequestEventAdmin(admin.ModelAdmin):
	list_display = ("id", "request", "event_type", "actor", "created_at")
	list_filter = ("event_type",)
	search_fields = ("request__title", "actor__email")
	ordering = ("-created_at",)
