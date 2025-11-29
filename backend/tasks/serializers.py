from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Task, UserWeights


class TaskSerializer(serializers.ModelSerializer):
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
            "user_id",
            "dependencies",
            "priority",
        ]


class UserWeightsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWeights
        fields = ["weight_importance", "weight_estimated_hours", "weight_due_date"]


class UserWithWeightsSerializer(serializers.ModelSerializer):
    weights = UserWeightsSerializer(source="userweights")

    class Meta:
        model = User
        fields = ["id", "username", "weights"]
