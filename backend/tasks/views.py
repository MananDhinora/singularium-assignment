from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Task, UserWeights
from .scoring import score_task
from .serializers import TaskSerializer, UserWithWeightsSerializer


@api_view(["GET"])
def get_task(request):
    user_id = request.GET.get("user_id")
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)
    tasks = Task.objects.filter(user_id=user_id)
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def score_single_task(request, pk): ...


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def score_all_task(request): ...


@api_view(["POST"])
def create_task(request):
    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
        print("$$$$$$$$$$$$$$", user)
    except User.DoesNotExist:
        return Response({"error": "Invalid user_id"}, status=404)

    task_data = {**request.data, "user": user.id}

    # -----------------------------
    # Calculate priority using score_task
    # -----------------------------
    priority_score = score_task(task_data, user_id)
    task_data["priority"] = priority_score

    serializer = TaskSerializer(data=task_data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


@api_view(["POST"])
def bulk_create_tasks(request):
    user_id = request.data.get("user_id")
    tasks = request.data.get("tasks")

    if not user_id:
        return Response({"error": "user_id required"}, status=400)
    if not isinstance(tasks, list):
        return Response({"error": "tasks must be an array"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Invalid user_id"}, status=404)

    created = []
    errors = []

    for i, task in enumerate(tasks):
        task_data = {**task, "user": user.id}
        task_data["priority"] = score_task(task_data, user_id)
        serializer = TaskSerializer(data=task_data)
        if serializer.is_valid():
            created.append(serializer.save())
        else:
            errors.append({"index": i, "errors": serializer.errors})

    return Response(
        {"created": TaskSerializer(created, many=True).data, "errors": errors}
    )


@api_view(["POST"])
def get_create_user(request):
    username = request.data.get("username")
    if not username:
        return Response({"error": "username is required"}, status=400)

    user, created_user = User.objects.get_or_create(username=username)
    weights, created_weights_flag = UserWeights.objects.get_or_create(user=user)
    serializer = UserWithWeightsSerializer(user)

    return Response(
        {
            "user": serializer.data,
            "created_user": created_user,
            "weights_created": created_weights_flag,
        }
    )
