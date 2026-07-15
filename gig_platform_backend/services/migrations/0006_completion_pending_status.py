from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0005_alter_servicerequestevent_event_type_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="servicerequest",
            name="status",
            field=models.CharField(
                choices=[
                    ("OPEN", "Open"),
                    ("MATCHING", "Matching"),
                    ("ASSIGNED", "Assigned"),
                    ("ARRIVING", "Arriving"),
                    ("IN_PROGRESS", "In Progress"),
                    ("COMPLETION_PENDING", "Completion Pending"),
                    ("COMPLETED", "Completed"),
                    ("CANCELLED", "Cancelled"),
                ],
                db_index=True,
                default="OPEN",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="servicerequestevent",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("REQUESTED", "Requested"),
                    ("ACCEPTED", "Accepted"),
                    ("REJECTED", "Rejected"),
                    ("ARRIVING", "Arriving"),
                    ("STARTED", "Started"),
                    ("COMPLETION_PENDING", "Completion Pending"),
                    ("COMPLETED", "Completed"),
                    ("CANCELLED", "Cancelled"),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
    ]