from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="servicerequest",
            name="budget_max",
        ),
        migrations.RemoveField(
            model_name="servicerequest",
            name="budget_min",
        ),
    ]
