from django.db import models


class Task(models.Model):
    title = models.CharField(max_length=255)
    due_date = models.DateField()
    estimated_hours = models.PositiveIntegerField()
    importance = models.PositiveIntegerField()

    dependencies = models.ManyToManyField(
        "self", symmetrical=False, related_name="dependents"
    )

    def __str__(self):
        return self.title
