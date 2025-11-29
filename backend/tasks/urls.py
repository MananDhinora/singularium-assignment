from django.urls import path

from .views import (TaskListCreateView, TaskRetriveUpdateDeleteView,
                    score_all_task, score_single_task)

urlpatterns = [
    path("", TaskListCreateView.as_view(), name="task-list"),
    path("<int:pk>/", TaskRetriveUpdateDeleteView.as_view(), name="task-detail"),
    # score api
    path("score/<int:pk>/", score_single_task, name="task-score"),
    path("score/", score_all_task, name="task-score-all"),
]
