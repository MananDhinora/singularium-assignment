from django.urls import path

from .views import (bulk_create_tasks, create_task, get_create_user, get_task,
                    score_all_task, score_single_task)

urlpatterns = [
    path("user/", get_create_user, name="user"),
    # task crud
    path("", get_task, name="task-list"),
    path("create/", create_task, name="task-create"),
    path("bulk-create/", bulk_create_tasks, name="task-bulk-create"),
    # score api
    path("score/<int:pk>/", score_single_task, name="task-score"),
    path("score/", score_all_task, name="task-score-all"),
]
