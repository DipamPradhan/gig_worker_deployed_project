from django.db import migrations, models


def deduplicate_worker_reviews(apps, schema_editor):
    WorkerReview = apps.get_model("ratings", "WorkerReview")

    seen_pairs = set()
    duplicate_ids = []

    # Keep newest review per (reviewer, worker), delete the rest.
    for review in WorkerReview.objects.order_by("-created_at", "-id"):
        pair = (review.reviewer_id, review.worker_id)
        if pair in seen_pairs:
            duplicate_ids.append(review.id)
        else:
            seen_pairs.add(pair)

    if duplicate_ids:
        WorkerReview.objects.filter(id__in=duplicate_ids).delete()


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("ratings", "0004_add_updated_at_to_recommendation_score"),
    ]

    operations = [
        migrations.RunPython(deduplicate_worker_reviews, migrations.RunPython.noop),
        migrations.RemoveConstraint(
            model_name="workerreview",
            name="unique_review_per_request",
        ),
        migrations.AddConstraint(
            model_name="workerreview",
            constraint=models.UniqueConstraint(
                fields=("reviewer", "worker"),
                name="unique_review_per_worker",
            ),
        ),
    ]
