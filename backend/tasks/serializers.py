from rest_framework import serializers

from .models import Task


class TaskSerizlizer(serializers.ModelSerializer):
    dependencies = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Task.objects.all(),
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "due_date",
            "estimated_hours",
            "importance",
            "dependencies",
        ]
