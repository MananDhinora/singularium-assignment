from datetime import date, datetime

from .models import UserWeights


def score_task(task: dict, user_id: int) -> float:
    """
    Score a task using user-specific weight preferences.
    If user weights are missing, return 0 immediately.
    """

    # 1. Load user-specific weights
    try:
        weights = UserWeights.objects.get(user_id=user_id)
    except UserWeights.DoesNotExist:
        return 0.0

    # Use the correct fields from your model
    W_I = weights.weight_importance  # Importance weight
    W_E = weights.weight_estimated_hours  # Effort weight
    W_U = weights.weight_due_date  # Urgency weight

    # 2. Urgency Factor (due_date)
    try:
        deadline_date = datetime.strptime(task["due_date"], "%Y-%m-%d").date()
        today = date.today()
        days_remaining = (deadline_date - today).days
        U_Factor = 1.0 if days_remaining <= 0 else 1 / (days_remaining + 1)
    except Exception:
        U_Factor = 0.0

    # 3. Other Factors
    I_Factor = task.get("importance", 0)
    E_Factor = task.get("estimated_hours", 0)
    # Dependency factor = number of items in dependencies list
    D_Factor = len(task.get("dependencies", []))
    W_D = 1.0  # you can scale dependency factor if needed

    # 4. Final Weighted Score
    priority_score = (
        (W_U * U_Factor) + (W_I * I_Factor) + (W_D * D_Factor) - (W_E * E_Factor)
    )
    return float(priority_score)
