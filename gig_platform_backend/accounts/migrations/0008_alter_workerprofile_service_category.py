from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_fix_invalid_service_categories"),
        ("services", "0003_seed_default_categories"),
    ]

    operations = [
        migrations.AlterField(
            model_name="workerprofile",
            name="service_category",
            field=models.CharField(db_index=True, default="Plumber", max_length=80),
        ),
    ]
