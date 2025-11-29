from django.shortcuts import render
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Task
from .scoring import score_task
from .serializers import TaskSerizlizer


class TaskListCreateView(generics.ListCreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerizlizer


class TaskRetriveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerizlizer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def score_single_task(request, pk): ...


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def score_all_task(request): ...
