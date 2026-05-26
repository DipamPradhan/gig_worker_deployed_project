from django.contrib import admin
from .models import WorkerReview, ReviewSentiment, WorkerRecommendationScore


class WorkerReviewAdmin(admin.ModelAdmin):
	editable_status_fields = ("moderation_status",)
	list_display = (
		"id",
		"request",
		"reviewer",
		"worker",
		"rating",
		"moderation_status",
		"created_at",
	)
	list_filter = ("rating", "moderation_status")
	search_fields = ("reviewer__email", "worker__worker__email")
	
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
		return request.user.has_perm("ratings.change_workerreview")
	def has_view_permission(self, request, obj=None):
		if request.user.is_superuser:
			return True
		return request.user.has_perm("ratings.view_workerreview") or request.user.has_perm(
			"ratings.change_workerreview"
		)





class ReviewSentimentAdmin(admin.ModelAdmin):
	list_display = ("id", "review", "label", "compound_score", "confidence", "processed_at")
	list_filter = ("label",)
	ordering = ("-processed_at",)


class WorkerRecommendationScoreAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"worker",
		"bayesian_rating",
		"average_sentiment_compound",
		"recommendation_score",
		"rank_last_updated_at",
	)

	search_fields = ("worker__worker__email",)
	ordering = ("-rank_last_updated_at",)

admin.site.register(WorkerReview, WorkerReviewAdmin)
admin.site.register(ReviewSentiment, ReviewSentimentAdmin)
admin.site.register(WorkerRecommendationScore, WorkerRecommendationScoreAdmin)