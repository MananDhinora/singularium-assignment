from django.db import models


class Task(models.Model):
    title = models.CharField(max_length=255)
    due_date = models.DateField()
    estimated_hours = models.PositiveIntegerField()
    importance = models.PositiveIntegerField()

    dependencies = models.ManyToManyField(
        "self", symmetrical=False, related_name="dependents"
    )


class UserWeights(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    weight_importance = models.FloatField(default=1.0)
    weight_estimated_hours = models.FloatField(default=1.0)
    weight_due_date = models.FloatField(default=1.0)
