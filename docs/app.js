(() => {
  "use strict";

  const VERSION = "0.5.0";

  const COIN_REWARD = { too_easy: 0, easy: 10, medium: 25, hard: 50 };
  const DAILY_GOALS = [5, 10, 15, 25];
  const GOAL_REWARD = 15;

  const state = {
    coins: 0,
    dailyCompleted: 0,
    tasks: [],
    nextId: 1,
  };

  const listEl = document.getElementById("task-list");
  const emptyHint = document.getElementById("empty-hint");
  const coinBalanceEl = document.getElementById("coin-balance");
  const dailyProgressEl = document.getElementById("daily-progress");
  const dailyBar = document.getElementById("daily-bar");
  const versionEl = document.getElementById("app-version");
  const form = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const difficultySelect = document.getElementById("difficulty-select");
  const repeatSelect = document.getElementById("repeat-select");
  const toastEl = document.getElementById("toast");

  let toastTimer = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add("hidden"), 2000);
  }

  function addTask(title, difficulty, repeat) {
    state.tasks.push({
      id: state.nextId++,
      title,
      difficulty,
      repeat,
      done: false,
      createdAt: Date.now(),
      completedAt: null,
    });
    render();
  }

  function reachedGoalCount(count) {
    return DAILY_GOALS.filter((g) => g <= count).length;
  }

  function completeTask(task) {
    task.done = true;
    task.completedAt = Date.now();
    const reward = COIN_REWARD[task.difficulty];
    state.coins += reward;
    const goalsBefore = reachedGoalCount(state.dailyCompleted);
    state.dailyCompleted += 1;
    const goalsAfter = reachedGoalCount(state.dailyCompleted);
    if (goalsAfter > goalsBefore) {
      state.coins += GOAL_REWARD;
      showToast(`🎉 Daily goal reached! +${GOAL_REWARD} 🪙`);
    } else if (reward > 0) {
      showToast(`+${reward} 🪙`);
    }
    render();
  }

  function uncompleteTask(task) {
    task.done = false;
    task.completedAt = null;
    const reward = COIN_REWARD[task.difficulty];
    const goalsBefore = reachedGoalCount(state.dailyCompleted);
    state.dailyCompleted = Math.max(0, state.dailyCompleted - 1);
    const goalsAfter = reachedGoalCount(state.dailyCompleted);
    state.coins = Math.max(0, state.coins - reward);
    if (goalsAfter < goalsBefore) {
      state.coins = Math.max(0, state.coins - GOAL_REWARD);
    }
    render();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    render();
  }

  function sortTasks(tasks) {
    const rank = { too_easy: 0, easy: 1, medium: 2, hard: 3 };
    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (rank[a.difficulty] !== rank[b.difficulty]) {
        return rank[a.difficulty] - rank[b.difficulty];
      }
      return a.createdAt - b.createdAt;
    });
  }

  function taskNode(task) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");
    li.dataset.id = task.id;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = task.done;
    cb.addEventListener("change", () => {
      if (cb.checked) completeTask(task);
      else uncompleteTask(task);
    });

    const body = document.createElement("div");
    body.className = "task-body";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const badge = document.createElement("span");
    badge.className = "badge " + task.difficulty;
    badge.textContent = task.difficulty.replace("_", " ");
    meta.appendChild(badge);
    if (task.repeat !== "none") {
      const rep = document.createElement("span");
      rep.className = "badge repeat";
      rep.textContent = "🔁 " + task.repeat;
      meta.appendChild(rep);
    }

    body.appendChild(title);
    body.appendChild(meta);

    const del = document.createElement("button");
    del.className = "task-delete";
    del.textContent = "✕";
    del.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(cb);
    li.appendChild(body);
    li.appendChild(del);
    return li;
  }

  function render() {
    const sorted = sortTasks(state.tasks);
    listEl.innerHTML = "";
    for (const task of sorted) listEl.appendChild(taskNode(task));

    emptyHint.classList.toggle("hidden", state.tasks.length > 0);
    coinBalanceEl.textContent = state.coins;

    const lastGoal = DAILY_GOALS[DAILY_GOALS.length - 1];
    const reached = reachedGoalCount(state.dailyCompleted);
    const nextGoal = DAILY_GOALS[reached] || lastGoal;
    const label =
      reached >= DAILY_GOALS.length
        ? `${state.dailyCompleted} ✅ all goals done`
        : `${state.dailyCompleted}/${nextGoal}`;
    dailyProgressEl.textContent = label;

    const pct = Math.min(100, (state.dailyCompleted / nextGoal) * 100);

    dailyBar.innerHTML = "";
    const fill = document.createElement("div");
    fill.className = "daily-bar-fill";
    fill.style.width = pct + "%";
    dailyBar.appendChild(fill);
  }

  versionEl.textContent = "v" + VERSION;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    addTask(title, difficultySelect.value, repeatSelect.value);
    taskInput.value = "";
    taskInput.focus();
  });

  render();
})();
