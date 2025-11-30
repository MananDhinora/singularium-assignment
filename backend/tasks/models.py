from django.contrib.auth.models import User
from django.db import models


class Task(models.Model):
    title = models.CharField(max_length=255)
    due_date = models.DateField()
    estimated_hours = models.PositiveIntegerField()
    importance = models.PositiveIntegerField()
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    dependencies = models.ManyToManyField(
        "self", symmetrical=False, related_name="dependents", blank=True
    )
    priority = models.FloatField(default=0)


class UserWeights(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    weight_importance = models.FloatField(default=1.0)
    weight_estimated_hours = models.FloatField(default=1.0)
    weight_due_date = models.FloatField(default=1.0)
