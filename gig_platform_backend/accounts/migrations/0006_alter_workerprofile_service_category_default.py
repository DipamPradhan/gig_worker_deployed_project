from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_remove_customuser_is_verified"),
    ]

    operations = [
        migrations.AlterField(
            model_name="workerprofile",
            name="service_category",
            field=models.CharField(
                choices=[
                    ("Plumber", "Plumber"),
                    ("Electrician", "Electrician"),
                    ("Cleaner", "Cleaner"),
                    ("Carpenter", "Carpenter"),
                ],
                db_index=True,
                default="Plumber",
                max_length=20,
            ),
        ),
    ]
