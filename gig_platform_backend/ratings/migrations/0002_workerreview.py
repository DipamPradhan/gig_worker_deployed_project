from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("ratings", "0001_initial"),
    ]

    # WorkerReview is already created in 0001_initial. Keeping 0002 as a no-op
    # preserves migration numbering for existing environments.
    operations = []
