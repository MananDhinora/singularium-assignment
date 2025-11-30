/* ========= CONFIG / ENDPOINTS ========= */
const API_BASE = "http://127.0.0.1:8000/api/tasks/";
const USER_URL = API_BASE + "user/";
const TASKS_URL = API_BASE + "create/";

/* ========= STATE ========= */
let tasks = []; // all tasks for this user

/* ========= DOM ========= */
const loginOverlay = document.getElementById("loginOverlay");
const loginBtn = document.getElementById("loginBtn");
const guestBtn = document.getElementById("guestBtn");
const loginError = document.getElementById("loginError");
const currentUserEl = document.getElementById("currentUser");
const logoutBtn = document.getElementById("logoutBtn");

const addTaskBtn = document.getElementById("addTaskBtn");
const importJsonBtn = document.getElementById("importJsonBtn");
const clearLocalBtn = document.getElementById("clearLocalBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const errorEl = document.getElementById("error");
const resultsEl = document.getElementById("results");
const sortStrategy = document.getElementById("sortStrategy");

/* ========= UTIL ========= */
function showError(msg) { errorEl.textContent = msg || ""; }
function showLoginError(msg) { loginError.textContent = msg || ""; }
function setCurrentUserText() {
  const uid = localStorage.getItem("userId");
  const uname = localStorage.getItem("username");
  currentUserEl.textContent = uid ? `User: ${uname || uid}` : "";
}

/* ========= LOGIN ========= */
document.addEventListener("DOMContentLoaded", () => {
  const uid = localStorage.getItem("userId");
  setCurrentUserText();

  if (!uid) {
    loginOverlay.style.display = "flex";
    loginOverlay.setAttribute("aria-hidden", "false");
  } else {
    loginOverlay.style.display = "none";
    loginOverlay.setAttribute("aria-hidden", "true");
    loadUserTasks(uid);
  }
});

loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("loginUsername").value.trim();
  if (!username) {
    showLoginError("Username required");
    return;
  }
  showLoginError("");

  try {
    const resp = await fetch(USER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });

    const data = await resp.json();
    if (!resp.ok) {
      showLoginError(data.error || "Login failed");
      return;
    }

    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("username", data.user.username || username);

    loginOverlay.style.display = "none";
    loginOverlay.setAttribute("aria-hidden", "true");

    setCurrentUserText();
    alert("Logged in as " + (data.user.username || username));

    loadUserTasks(data.user.id);

  } catch (err) {
    showLoginError("Network error");
    console.error(err);
  }
});

guestBtn.addEventListener("click", () => {
  localStorage.setItem("userId", "guest");
  localStorage.setItem("username", "guest");
  loginOverlay.style.display = "none";
  setCurrentUserText();
  loadUserTasks("guest");
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  setCurrentUserText();
  loginOverlay.style.display = "flex";
});

/* ========= TASK LOADING ========= */

async function loadUserTasks(userId) {
  try {
    const resp = await fetch(`${API_BASE}?user_id=${userId}`);
    if (!resp.ok) throw "Failed to load tasks";
    tasks = await resp.json();

    populateDependenciesDropdown();
    renderTasks();
  } catch (err) {
    showError("Error loading tasks: " + err);
    console.error(err);
  }
}

/* ========= DEPENDENCY DROPDOWN POPULATION ========= */
function populateDependenciesDropdown() {
  const dropdown = document.getElementById("dependencies");
  if (!dropdown) return;

  dropdown.innerHTML = "";

  tasks.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.title;
    dropdown.appendChild(opt);
  });
}

/* ========= CIRCULAR DEP DETECTION ========= */

function hasCircularDependency(tasks, newTaskTempId, selectedDeps) {
  // Build adjacency list
  const graph = {};

  tasks.forEach(t => {
    graph[t.id] = t.dependencies || [];
  });

  // Add new task as a temporary node
  graph[newTaskTempId] = selectedDeps;

  const visited = new Set();
  const stack = new Set();

  function dfs(node) {
    if (stack.has(node)) return true; // cycle detected
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    const deps = graph[node] || [];
    for (const d of deps) {
      if (dfs(d)) return true;
    }

    stack.delete(node);
    return false;
  }

  return dfs(newTaskTempId);
}

/* ========= ADD SINGLE TASK ========= */

addTaskBtn.addEventListener("click", async () => {
  const userId = localStorage.getItem("userId");

  const title = document.getElementById("title").value.trim();
  const due = document.getElementById("dueDate").value;
  const hours = Number(document.getElementById("estimatedHours").value);
  const importance = Number(document.getElementById("importance").value);

  const depSelect = document.getElementById("dependencies");
  const selectedDeps = Array.from(depSelect.selectedOptions).map(o => Number(o.value));

  if (!userId) {
    alert("Please login or continue as guest.");
    return;
  }
  if (!title || !due || !hours || !importance) {
    showError("Fill all fields.");
    return;
  }

  // Circular dependency check
  const tempId = -1 * (tasks.length + 1);
  const circular = hasCircularDependency(tasks, tempId, selectedDeps);

  if (circular) {
    showError("⚠️ Circular dependency detected! Remove problematic dependencies.");
    return;
  }

  const payload = {
    user_id: userId,
    title,
    due_date: due,
    estimated_hours: hours,
    importance,
    dependencies: selectedDeps
  };

  try {
    const resp = await fetch(TASKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    if (!resp.ok) {
      showError(data.detail || "Failed to create task.");
      return;
    }

    tasks.push(data);
    renderTasks();
    populateDependenciesDropdown();

    showError("");
    alert("Task created with priority: " + data.priority);

  } catch (err) {
    showError("Network error while creating task.");
    console.error(err);
  }
});

/* ========= BULK JSON IMPORT ========= */

importJsonBtn.addEventListener("click", async () => {
  try {
    const parsed = JSON.parse(document.getElementById("jsonInput").value);
    if (!Array.isArray(parsed)) throw "JSON must be an array of tasks";

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login first");
      return;
    }

    const payload = parsed.map(t => ({ ...t, user_id: userId }));

    const resp = await fetch(TASKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) {
      showError("Bulk create failed");
      return;
    }

    tasks.push(...data);
    renderTasks();
    populateDependenciesDropdown();
    showError("");
    alert("Bulk tasks created!");

  } catch (e) {
    showError("Invalid JSON: " + e);
  }
});

/* ========= CLEAR LOCAL ONLY ========= */
clearLocalBtn.addEventListener("click", () => {
  tasks = [];
  renderTasks();
});

/* ========= SORTING & RENDER ========= */

sortStrategy.addEventListener("change", renderTasks);

function sortTasks(strategy) {
  const copy = [...tasks];

  if (strategy === "fast")
    return copy.sort((a, b) => (a.estimated_hours || 0) - (b.estimated_hours || 0));

  if (strategy === "impact")
    return copy.sort((a, b) => (b.importance || 0) - (a.importance || 0));

  if (strategy === "deadline")
    return copy.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  if (strategy === "smart")
    return copy.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return copy;
}

function renderTasks() {
  const strat = sortStrategy.value;
  const list = sortTasks(strat);

  resultsEl.innerHTML = "";

  if (list.length === 0) {
    resultsEl.innerHTML = "<p class='muted'>No tasks yet.</p>";
    return;
  }

  list.forEach(t => {
    const score = t.priority || 0;
    const priorityClass =
      score > 1.2 ? "high" : score > 0.7 ? "medium" : "low";

    const div = document.createElement("div");
    div.className = `task ${priorityClass}`;

    const meta = `Due: ${t.due_date || "—"} | Effort: ${t.estimated_hours || "—"}h | Importance: ${t.importance || "—"} | Priority: ${score.toFixed(2)}`;

    div.innerHTML = `
      <div class="title">${escapeHtml(t.title)}</div>
      <div class="meta">${meta}</div>
      <div class="reason">${explainReason(t)}</div>
    `;

    resultsEl.appendChild(div);
  });
}

/* ========= REASONING DISPLAY ========= */

function explainReason(t) {
  const r = [];
  if ((t.importance || 0) >= 8) r.push("High importance");
  if ((t.estimated_hours || 999) <= 2) r.push("Quick win");

  const daysLeft = daysUntil(t.due_date);
  if (daysLeft !== null && daysLeft <= 3) r.push("Deadline approaching");

  if ((t.priority || 0) > 1.2) r.push("Top priority");

  return r.length ? r.join(", ") : "Balanced";
}

function daysUntil(dateStr) {
  if (!dateStr) return null;

  const d = new Date(dateStr);
  if (isNaN(d)) return null;

  const ms = d - new Date();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

/* ========= INITIAL RENDER ========= */
renderTasks();
