from django.db import migrations


VALID_CATEGORIES = {"Plumber", "Electrician", "Cleaner", "Carpenter"}
DEFAULT_CATEGORY = "Plumber"


def fix_invalid_service_categories(apps, schema_editor):
    """Fix workers with empty or invalid service_category values."""
    WorkerProfile = apps.get_model("accounts", "WorkerProfile")

    # Fix workers with empty or null service_category
    invalid_workers = WorkerProfile.objects.exclude(
        service_category__in=VALID_CATEGORIES
    )

    count = invalid_workers.update(service_category=DEFAULT_CATEGORY)
    if count > 0:
        print(f"\nFixed {count} worker(s) with invalid service_category")


def reverse_migration(apps, schema_editor):
    # No reverse needed - we don't want to revert to invalid data
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_alter_workerprofile_service_category_default"),
    ]

    operations = [
        migrations.RunPython(fix_invalid_service_categories, reverse_migration),
    ]
