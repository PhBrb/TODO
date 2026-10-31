(() => {
  "use strict";

  const C = (window.GameCore = window.GameCore || {});
  const { VERSION, STORAGE_KEY, SCHEMA_VERSION, TIME_LIMIT_MINUTES, TIME_BONUS_COINS, COIN_REWARD, DAILY_GOALS, GOAL_REWARD, GEM_CHANCE, GEM_BONUS_AMOUNT, MULTIPLIER_MIN, MULTIPLIER_MAX, STREAK_BONUS_START_DAY, STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX, BONUS_TASK_RATE, BONUS_TASK_COINS, BONUS_TASK_GEMS, WEEKLY_GOALS, WEEKLY_GOAL_REWARD, FIRST_TASK_COINS_MULT, FIRST_TASK_GEM_CHANCE, RATE_PROMPT_TIMEOUT, DIFFICULTY_SUGGESTION_STREAK, XP_REWARD, CONFETTI_COUNT, XP_BASE_LEVEL, CHEST_OPEN_MS, CHEST_PURCHASE_OPEN_MS, CHEST_COINS, CHEST_GEMS, CHEST_XP, SLABS_PER_LEVEL, INITIAL_SLABS, slabOffsets, slabCountForLevel, BOOST_MULT, BOOST_DURATION_MS, BOOST_CHANCE_PER_COMPLETION, BOOST_COOLDOWN_MS, SHOP_ITEMS, ITEM_TYPES, CHEST_ITEM_ID, ITEM_ROTATIONS, PLACEMENT_VERSION, DIFFICULTY_ORDER, REPEAT_VALUES, CUSTOM_REPEAT_DEFAULT_MS, TASK_LISTS, FUN_TASK_COINS, FUN_TASK_XP, HIGHLIGHT_COUNT, ACHIEVEMENTS, MORNING_END_HOUR, NIGHT_START_HOUR, state, saveState, render, showToast, promptDifficultyRating, itemIsOwned, nextOccurrence, repeatKey, clampWeekdays, applyFirstTaskBonus, maybeStartBoost, grantXpAndCoins, announceLevelUp, computeReward, earnChest, grantMilestones, trackDailyGoal, clawBackMilestone, buildRewardMessage, announceAchievements, trackAchievement, achievementProgressFromCompletion, awardSubtask, updateStreak, reachedGoalCount, reachedWeeklyGoalCount } = C;

  function highlightRating(task, now) {
    let score = 0;
    if (task.bonus) score += 40;
    if (task.deadline !== null) {
      const hoursLeft = (task.deadline - now) / 3600000;
      if (hoursLeft < 0) score += 50;
      else if (hoursLeft < 48) score += Math.round(40 * (1 - hoursLeft / 48));
    }
    if (task.repeat !== "none" && task.streak > 0) {
      score = Math.min(50, score + 15 + task.streak * 2);
    }
    if (task.difficulty === "hard") score += 10;
    else if (task.difficulty === "medium") score += 5;
    if (task.list === "backlog") score -= 10;
    return score;
  }

  function highlightTasks() {
    const now = Date.now();
    return state.tasks
      .filter((t) => !t.done && t.list !== "fun")
      .map((t) => ({ task: t, score: highlightRating(t, now) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, HIGHLIGHT_COUNT)
      .map((e) => e.task);
  }

  function addTask(title, difficulty, repeat, deadlineInput, list, timeLimit = 0) {
    const taskList = TASK_LISTS.includes(list) ? list : "todo";
    const isFun = taskList === "fun";
    const isBonus = !isFun && Math.random() < BONUS_TASK_RATE;
    const task = {
      id: state.nextId++,
      title,
      list: taskList,
      difficulty: isFun ? null : difficulty,
      repeat: isFun ? "none" : repeat,
      done: false,
      createdAt: Date.now(),
      completedAt: null,
      streak: 0,
      streakDayKeys: [],
      bonus: isBonus,
      deadline: isFun ? null : (deadlineInput ? new Date(deadlineInput).getTime() : null),
      repeatTime: NaN,
      repeatAfterCompletion: false,
      repeatWeekdays: [1],
      repeatMonthlyWeekday: null,
      repeatMonthlyFirst: false,
      repeatCustomMs: CUSTOM_REPEAT_DEFAULT_MS,
      chainedAfter: 0,
      timeLimit: isFun ? 0 : (TIME_LIMIT_MINUTES.includes(timeLimit) ? timeLimit : 0),
      startedAt: 0,
      ratedDifficulty: null,
      difficultySuggested: false,
      completedViaSubtasks: false,
      subtasks: [],
    };
    if (isBonus) showToast("⭐ New bonus task! Extra rewards");
    state.tasks.push(task);
    saveState();
    render();
    return task.id;
  }

  function deriveDifficulty(task) {
    if (task.subtasks.length === 0) return task.difficulty;
    let best = "too_easy";
    for (const st of task.subtasks) {
      if (DIFFICULTY_ORDER.indexOf(st.difficulty) > DIFFICULTY_ORDER.indexOf(best)) {
        best = st.difficulty;
      }
    }
    return best;
  }

  function addSubtask(parentId, title, difficulty) {
    const parent = state.tasks.find((t) => t.id === parentId);
    if (!parent || !title) return;
    parent.subtasks.push({
      id: state.nextId++,
      title,
      difficulty,
      done: false,
      chainedAfter: 0,
    });
    parent.difficulty = deriveDifficulty(parent);
    saveState();
    render();
  }

  function editSubtask(parent, subtask, title, difficulty) {
    const t = (title || "").trim();
    if (t) subtask.title = t;
    if (difficulty in COIN_REWARD) subtask.difficulty = difficulty;
    parent.difficulty = deriveDifficulty(parent);
    saveState();
    render();
  }

  function chainPredecessorIn(siblings, item) {
    if (!item.chainedAfter) return null;
    return siblings.find((s) => s.id === item.chainedAfter) || null;
  }

  function chainSatisfiedIn(siblings, item) {
    const predecessor = chainPredecessorIn(siblings, item);
    return !predecessor || predecessor.done;
  }

  function chainWouldCycleIn(siblings, item, target) {
    if (target.id === item.id) return true;
    const predecessor = chainPredecessorIn(siblings, target);
    if (!predecessor) return false;
    return chainWouldCycleIn(siblings, item, predecessor);
  }

  function chainHead(siblings, item) {
    let head = item;
    while (head.chainedAfter) {
      const predecessor = siblings.find((s) => s.id === head.chainedAfter);
      if (!predecessor) break;
      head = predecessor;
    }
    return head;
  }

  function chainIn(siblings, item, targetId, linkEmoji) {
    if (!item || item.done) return { ok: false, reason: "not chainable" };
    const target = siblings.find((s) => s.id === targetId);
    if (!target || target.id === item.id) return { ok: false, reason: "invalid target" };
    if (item.list === "fun" || target.list === "fun") {
      return { ok: false, reason: "fun not chainable" };
    }
    if (item.list !== target.list) {
      return { ok: false, reason: "different lists" };
    }
    if (target.chainedAfter === item.id) return { ok: false, reason: "would swap" };
    if (chainWouldCycleIn(siblings, item, target)) return { ok: false, reason: "cycle" };
    for (const other of siblings) {
      if (other.chainedAfter === item.id && other.id !== target.id) {
        other.chainedAfter = target.id;
      }
    }
    item.chainedAfter = target.id;
    const headList = chainHead(siblings, item).list;
    for (const other of siblings) {
      if (other.list === "fun") continue;
      if (chainHead(siblings, other) === chainHead(siblings, item)) other.list = headList;
    }
    saveState();
    render();
    showToast(`${linkEmoji} "${item.title}" is now chained after "${target.title}"`);
    return { ok: true };
  }

  function unchainIn(siblings, item) {
    if (!item.chainedAfter) return;
    const oldId = item.chainedAfter;
    item.chainedAfter = 0;
    for (const other of siblings) {
      if (other.chainedAfter === item.id) other.chainedAfter = oldId;
    }
    saveState();
    render();
  }

  function subtaskPredecessor(parent, subtask) {
    return chainPredecessorIn(parent.subtasks, subtask);
  }

  function subtaskChainSatisfies(parent, subtask) {
    return chainSatisfiedIn(parent.subtasks, subtask);
  }

  function chainSubtask(parent, subtask, targetId) {
    return chainIn(parent.subtasks, subtask, targetId, "\ud83d\udd17");
  }

  function unchainSubtask(parent, subtask) {
    return unchainIn(parent.subtasks, subtask);
  }

  function deleteSubtask(parent, subtaskId) {
    for (const other of parent.subtasks) {
      if (other.chainedAfter === subtaskId) other.chainedAfter = 0;
    }
    parent.subtasks = parent.subtasks.filter((s) => s.id !== subtaskId);
    parent.difficulty = deriveDifficulty(parent);
    saveState();
    render();
  }

  function toggleSubtask(parent, subtask) {
    subtask.done = !subtask.done;
    if (subtask.done) {
      if (subtasksLockedByChain(parent)) {
        subtask.done = false;
        showToast("🔗 Finish the chained predecessor task first");
        saveState();
        render();
        return;
      }
      if (!subtaskChainSatisfies(parent, subtask)) {
        subtask.done = false;
        const predecessor = subtaskPredecessor(parent, subtask);
        showToast(`\ud83d\udd17 "${subtask.title}" is chained \u2014 complete "${predecessor.title}" first`);
        saveState();
        render();
        return;
      }
      awardSubtask(subtask);
      if (parent.subtasks.every((st) => st.done) && !parent.done) {
        completeTask(parent);
        parent.completedViaSubtasks = true;
      }
    } else {
      clawBackReward(subtask.reward);
      subtask.reward = null;
      for (const other of parent.subtasks) {
        if (other.chainedAfter === subtask.id && other.done) toggleSubtask(parent, other);
      }
      if (parent.done && parent.completedViaSubtasks) {
        uncompleteTask(parent);
        parent.completedViaSubtasks = false;
      }
    }
    saveState();
    render();
  }

  function startTask(task) {
    if (task.done || !task.timeLimit) return;
    if (task.startedAt && Date.now() - task.startedAt < task.timeLimit * 60000) return;
    task.startedAt = Date.now();
    saveState();
    render();
  }

  function chainPredecessor(task) {
    return chainPredecessorIn(state.tasks, task);
  }

  function chainSatisfiesDependency(task) {
    return chainSatisfiedIn(state.tasks, task);
  }

  function subtasksLockedByChain(task) {
    return Boolean(task.chainedAfter) && !task.done && !chainSatisfiesDependency(task);
  }

  function chainTask(task, targetId) {
    return chainIn(state.tasks, task, targetId, "\ud83e\uddf1");
  }

  function unchainTask(task) {
    return unchainIn(state.tasks, task);
  }

  function completeFunTask(task) {
    task.done = true;
    task.completedAt = Date.now();
    task.reward = { coins: FUN_TASK_COINS, gems: 0, xp: FUN_TASK_XP };
    grantXpAndCoins(FUN_TASK_COINS, 0, FUN_TASK_XP);
    showToast(`\ud83c\udf89 +${FUN_TASK_COINS} \ud83e\ude99 +${FUN_TASK_XP} \u2728`);
    announceAchievements(trackAchievement({
      totalCompleted: state.achievements.stats.totalCompleted + 1,
      funCompleted: state.achievements.stats.funCompleted + 1,
    }));
    saveState();
    render();
  }

  function completeTask(task) {
    if (task.list === "fun") return completeFunTask(task);
    if (!chainSatisfiesDependency(task)) {
      showToast(`\ud83e\uddf1 "${task.title}" is chained \u2014 complete "${chainPredecessor(task).title}" first`);
      return;
    }
    const reward = computeReward(task);
    task.done = true;
    task.startedAt = 0;
    task.completedAt = Date.now();
    updateStreak(task, task.completedAt);

    const firstBonus = applyFirstTaskBonus();
    if (firstBonus) {
      reward.coins += firstBonus.coins;
      reward.gems += firstBonus.gems;
    }

    const chestEarned = Boolean(firstBonus) && itemIsOwned(CHEST_ITEM_ID);
    const chestId = chestEarned ? earnChest() : null;

    const leveledUp = grantXpAndCoins(reward.coins, reward.gems, reward.xp);
    state.dailyCompleted += 1;
    state.weeklyCompleted += 1;
    const milestones = grantMilestones();
    trackDailyGoal();

    task.reward = {
      coins: reward.coins,
      gems: reward.gems,
      xp: reward.xp,
      chestEarned,
      chestId,
      firstTaskDay: firstBonus ? firstBonus.streak : 0,
      timeBonus: reward.timeBonus || 0,
    };

    announceAchievements(trackAchievement(achievementProgressFromCompletion(task, task.completedAt)));
    if (leveledUp) announceLevelUp();
    if (milestones.weeklyReward > 0) {
      showToast(`🏆 Weekly goal reached! +${WEEKLY_GOAL_REWARD} 🪙`);
    } else if (milestones.dailyReward > 0) {
      showToast(`🎉 Daily goal reached! +${GOAL_REWARD} 🪙`);
    }
    showToast(buildRewardMessage(task, reward, firstBonus));

    if (chestEarned) showToast("📦 Chest earned! Opens in 12h");
    maybeStartBoost();
    promptDifficultyRating(task);
    maybeSuggestDifficultyReduction(task);
    saveState();
    render();
  }

  function clawBackReward(reward) {
    if (!reward) return;
    state.coins = Math.max(0, state.coins - reward.coins);
    state.gems = Math.max(0, state.gems - reward.gems);
    state.xp = Math.max(0, state.xp - reward.xp);
    if (reward.chestEarned) {
      let idx = -1;
      if (reward.chestId !== undefined && reward.chestId !== null) {
        idx = state.chests.findIndex((c) => c.id === reward.chestId);
      }
      if (idx < 0) idx = state.chests.findIndex((c) => !c.opened);
      if (idx >= 0) state.chests.splice(idx, 1);
    }
  }

  function uncompleteFunTask(task) {
    task.done = false;
    task.completedAt = null;
    clawBackReward(task.reward);
    task.reward = null;
    saveState();
    render();
  }

  function uncompleteTask(task) {
    if (task.list === "fun") return uncompleteFunTask(task);
    task.done = false;
    task.startedAt = 0;
    for (const other of state.tasks) {
      if (other.chainedAfter === task.id && other.done) uncompleteTask(other);
    }
    const key = task.completedAt ? repeatKey(task, task.completedAt) : null;
    if (key && task.streakDayKeys.includes(key)) {
      task.streakDayKeys.pop();
      task.streak = Math.max(0, task.streak - 1);
    }
    task.completedAt = null;

    state.dailyCompleted = Math.max(0, state.dailyCompleted - 1);
    state.weeklyCompleted = Math.max(0, state.weeklyCompleted - 1);
    if (task.reward && task.reward.firstTaskDay > 0) {
      state.firstTaskStreak = Math.max(0, task.reward.firstTaskDay - 1);
      state.lastFirstTaskDayKey = null;
    }
    clawBackReward(task.reward);

    clawBackMilestone(
      reachedGoalCount(state.dailyCompleted), "lastDailyMilestone", GOAL_REWARD);
    clawBackMilestone(
      reachedWeeklyGoalCount(state.weeklyCompleted), "lastWeeklyMilestone", WEEKLY_GOAL_REWARD);

    task.reward = null;
    saveState();
    render();
  }

  function deleteTask(id) {
    for (const other of state.tasks) {
      if (other.chainedAfter === id) other.chainedAfter = 0;
    }
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveState();
    render();
  }

  function setDayStartHour(hour) {
    state.dayStartHour = Math.min(23, Math.max(0, Math.floor(hour)));
    saveState();
    render();
  }

  function setUiSheetHeightVh(vh) {
    state.uiSheetHeightVh = Math.min(95, Math.max(0, vh));
    saveState();
  }

  function maybeSuggestDifficultyReduction(task) {
    if (task.difficultySuggested) return;
    if (task.streak < DIFFICULTY_SUGGESTION_STREAK) return;
    if (task.ratedDifficulty === "harder") return;
    task.difficultySuggested = true;
    const order = Object.keys(COIN_REWARD);
    const idx = order.indexOf(task.difficulty);
    if (idx <= 0) return;
    showToast(
      `💡 "${task.title}" is going strong (🔥 ${task.streak}). Consider lowering its difficulty.`
    );
  }

  const EDIT_UPDATERS = {
    title(task, v) {
      const t = String(v).trim();
      if (t) task.title = t;
    },
    list(task, v) {
      if (!TASK_LISTS.includes(v) || v === task.list) return;
      task.list = v;
      task.chainedAfter = null;
      for (const st of task.subtasks) st.chainedAfter = null;
      for (const other of state.tasks) {
        if (other.chainedAfter === task.id) other.chainedAfter = null;
      }
    },
    difficulty(task, v) {
      if (v in COIN_REWARD && task.subtasks.length === 0) task.difficulty = v;
    },
    repeat(task, v) {
      if (!REPEAT_VALUES.includes(v)) return;
      task.repeat = v;
      if (v === "none") {
        task.streak = 0;
        task.streakDayKeys = [];
      }
    },
    deadline(task, v) {
      task.deadline = v ? new Date(v).getTime() : null;
    },
    repeatAfterCompletion(task, v) {
      task.repeatAfterCompletion = v === true;
    },
    repeatWeekdays(task, v) {
      task.repeatWeekdays = clampWeekdays(v);
    },
    repeatMonthlyWeekday(task, v) {
      task.repeatMonthlyWeekday = v === null
        ? null
        : Math.min(6, Math.max(0, Math.floor(v)));
    },
    repeatMonthlyFirst(task, v) {
      task.repeatMonthlyFirst = v === true;
    },
    repeatCustomMs(task, v) {
      task.repeatCustomMs = Math.max(60000, Math.floor(v));
    },
    timeLimit(task, v) {
      task.timeLimit = TIME_LIMIT_MINUTES.includes(v) ? v : 0;
      if (!task.timeLimit) task.startedAt = 0;
    },
    repeatTime(task, v) {
      task.repeatTime = Number.isFinite(v)
        ? Math.min(1439, Math.max(0, Math.floor(v)))
        : NaN;
    },
  };

  function editTask(id, updates) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    for (const key of Object.keys(EDIT_UPDATERS)) {
      if (updates[key] !== undefined) EDIT_UPDATERS[key](task, updates[key]);
    }
    if (task.repeat !== "none" && !task.done) {
      const next = nextOccurrence(task, Date.now());
      if (next !== Infinity) task.deadline = next;
    }
    saveState();
    render();
  }

  Object.assign(C, { highlightRating, highlightTasks, addTask, deriveDifficulty, addSubtask, editSubtask, chainPredecessorIn, chainSatisfiedIn, chainWouldCycleIn, chainHead, chainIn, unchainIn, subtaskPredecessor, subtaskChainSatisfies, chainSubtask, unchainSubtask, deleteSubtask, toggleSubtask, startTask, chainPredecessor, chainSatisfiesDependency, subtasksLockedByChain, chainTask, unchainTask, completeFunTask, completeTask, clawBackReward, uncompleteFunTask, uncompleteTask, deleteTask, setDayStartHour, setUiSheetHeightVh, maybeSuggestDifficultyReduction, editTask, EDIT_UPDATERS });
})();
