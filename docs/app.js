(() => {
  "use strict";

  const VERSION = "0.6.0";

  const COIN_REWARD = { too_easy: 0, easy: 10, medium: 25, hard: 50 };
  const DAILY_GOALS = [5, 10, 15, 25];
  const GOAL_REWARD = 15;
  const GEM_CHANCE = { medium: 0.25, hard: 0.5 };
  const GEM_BONUS_AMOUNT = 2;
  const MULTIPLIER_MIN = 1;
  const MULTIPLIER_MAX = 1.3;
  const STREAK_BONUS_START_DAY = 3;
  const STREAK_BONUS_PER_DAY = 0.1;
  const STREAK_BONUS_MAX = 1.9;
  const BONUS_TASK_RATE = 0.15;
  const BONUS_TASK_COINS = 10;
  const BONUS_TASK_GEMS = 1;

  const state = {
    coins: 0,
    gems: 0,
    dailyCompleted: 0,
    tasks: [],
    nextId: 1,
  };

  const listEl = document.getElementById("task-list");
  const emptyHint = document.getElementById("empty-hint");
  const coinBalanceEl = document.getElementById("coin-balance");
  const gemBalanceEl = document.getElementById("gem-balance");
  const dailyProgressEl = document.getElementById("daily-progress");
  const dailyBar = document.getElementById("daily-bar");
  const versionEl = document.getElementById("app-version");
  const form = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const difficultySelect = document.getElementById("difficulty-select");
  const repeatSelect = document.getElementById("repeat-select");
  const deadlineInput = document.getElementById("deadline-input");
  const toastEl = document.getElementById("toast");

  let toastTimer = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add("hidden"), 2000);
  }

  function randomMultiplier() {
    return MULTIPLIER_MIN + Math.random() * (MULTIPLIER_MAX - MULTIPLIER_MIN);
  }

  function streakBonus(streak) {
    if (streak < STREAK_BONUS_START_DAY) return 1;
    const extraDays = streak - STREAK_BONUS_START_DAY + 1;
    return Math.min(
      STREAK_BONUS_MAX,
      1 + extraDays * STREAK_BONUS_PER_DAY
    );
  }

  function dayKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function addTask(title, difficulty, repeat, deadlineInput) {
    const isBonus = Math.random() < BONUS_TASK_RATE;
    const task = {
      id: state.nextId++,
      title,
      difficulty,
      repeat,
      done: false,
      createdAt: Date.now(),
      completedAt: null,
      streak: 0,
      streakDayKeys: [],
      bonus: isBonus,
      deadline: deadlineInput ? new Date(deadlineInput).getTime() : null,
    };
    if (isBonus) showToast("⭐ New bonus task! Extra rewards");
    state.tasks.push(task);
    render();
  }

  function reachedGoalCount(count) {
    return DAILY_GOALS.filter((g) => g <= count).length;
  }

  function completeTask(task) {
    task.done = true;
    task.completedAt = Date.now();

    if (task.repeat !== "none") {
      const key = dayKey(task.completedAt);
      if (!task.streakDayKeys.includes(key)) {
        const lastKey = task.streakDayKeys[task.streakDayKeys.length - 1];
        const yesterday = new Date(task.completedAt);
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastKey === dayKey(yesterday.getTime())) {
          task.streak += 1;
        } else {
          task.streak = 1;
        }
        task.streakDayKeys.push(key);
      }
    }

    const base = COIN_REWARD[task.difficulty];
    const mult = randomMultiplier();
    const streakMult = task.streak > 0 ? streakBonus(task.streak) : 1;
    let coins = Math.round(base * mult * streakMult);
    let gems = 0;

    if (GEM_CHANCE[task.difficulty] !== undefined && Math.random() < GEM_CHANCE[task.difficulty]) {
      gems += GEM_BONUS_AMOUNT;
    }

    if (task.bonus) {
      coins += BONUS_TASK_COINS;
      gems += BONUS_TASK_GEMS;
    }

    state.coins += coins;
    state.gems += gems;

    const goalsBefore = reachedGoalCount(state.dailyCompleted);
    state.dailyCompleted += 1;
    const goalsAfter = reachedGoalCount(state.dailyCompleted);

    let msg = "+";
    const parts = [];
    if (coins > 0) parts.push(`${coins} 🪙`);
    if (gems > 0) parts.push(`${gems} 💎`);
    if (parts.length === 0) parts.push("0 🪙");
    msg += parts.join(" + ");
    if (mult > 1.05) msg += ` (x${mult.toFixed(2)})`;
    if (task.streak > 1) msg += ` 🔥 ${task.streak}`;

    if (goalsAfter > goalsBefore) {
      state.coins += GOAL_REWARD;
      showToast(`🎉 Daily goal reached! +${GOAL_REWARD} 🪙`);
    } else {
      showToast(msg);
    }
    render();
  }

  function uncompleteTask(task) {
    task.done = false;
    const key = task.completedAt ? dayKey(task.completedAt) : null;
    if (key && task.streakDayKeys.includes(key)) {
      task.streakDayKeys.pop();
      task.streak = Math.max(0, task.streak - 1);
    }
    task.completedAt = null;

    const base = COIN_REWARD[task.difficulty];
    const goalsBefore = reachedGoalCount(state.dailyCompleted);
    state.dailyCompleted = Math.max(0, state.dailyCompleted - 1);
    const goalsAfter = reachedGoalCount(state.dailyCompleted);

    state.coins = Math.max(0, state.coins - base);
    if (task.bonus) state.coins = Math.max(0, state.coins - BONUS_TASK_COINS);
    if (goalsAfter < goalsBefore) {
      state.coins = Math.max(0, state.coins - GOAL_REWARD);
    }
    render();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    render();
  }

  function formatDeadline(ts) {
    const diff = ts - Date.now();
    const abs = Math.abs(diff);
    const mins = Math.round(abs / 60000);
    let tstr;
    if (mins < 60) tstr = `${mins}m`;
    else if (mins < 1440) tstr = `${Math.round(mins / 60)}h`;
    else tstr = `${Math.round(mins / 1440)}d`;
    return diff >= 0 ? `⏰ ${tstr} left` : `⏰ ${tstr} overdue`;
  }

  function sortTasks(tasks) {
    const rank = { too_easy: 0, easy: 1, medium: 2, hard: 3 };
    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const aDue = a.deadline && !a.done ? a.deadline : Infinity;
      const bDue = b.deadline && !b.done ? b.deadline : Infinity;
      if (aDue !== bDue) return aDue - bDue;
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
      if (task.streak > 0) {
        const st = document.createElement("span");
        st.className = "badge streak";
        st.textContent = "🔥 " + task.streak;
        meta.appendChild(st);
      }
    }
    if (task.bonus) {
      const b = document.createElement("span");
      b.className = "badge bonus";
      b.textContent = "⭐ bonus";
      meta.appendChild(b);
    }
    if (task.deadline && !task.done) {
      const dl = document.createElement("span");
      dl.className = "badge deadline" + (task.deadline < Date.now() ? " overdue" : "");
      dl.textContent = formatDeadline(task.deadline);
      meta.appendChild(dl);
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
    gemBalanceEl.textContent = state.gems;

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
    addTask(title, difficultySelect.value, repeatSelect.value, deadlineInput.value);
    taskInput.value = "";
    taskInput.focus();
  });

  render();
})();
