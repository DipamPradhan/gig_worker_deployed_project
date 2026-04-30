from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ratings", "0003_alter_workerreview_rating"),
    ]

    operations = [
        migrations.AddField(
            model_name="workerrecommendationscore",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
