from django.db import migrations


DEFAULT_CATEGORIES = [
    ("plumber", "Plumber"),
    ("electrician", "Electrician"),
    ("cleaner", "Cleaner"),
    ("carpenter", "Carpenter"),
]


def seed_default_categories(apps, schema_editor):
    ServiceCategory = apps.get_model("services", "ServiceCategory")

    for slug, name in DEFAULT_CATEGORIES:
        ServiceCategory.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "is_active": True,
            },
        )


def noop_reverse(apps, schema_editor):
    # Keep category data intact during rollback to avoid accidental data loss.
    return


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0002_remove_servicerequest_budget_fields"),
    ]

    operations = [
        migrations.RunPython(seed_default_categories, noop_reverse),
    ]
