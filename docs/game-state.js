(() => {
  "use strict";

  const C = (window.GameCore = window.GameCore || {});
  const { VERSION, STORAGE_KEY, SCHEMA_VERSION, TIME_LIMIT_MINUTES, TIME_BONUS_COINS, COIN_REWARD, DAILY_GOALS, GOAL_REWARD, GEM_CHANCE, GEM_BONUS_AMOUNT, MULTIPLIER_MIN, MULTIPLIER_MAX, STREAK_BONUS_START_DAY, STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX, BONUS_TASK_RATE, BONUS_TASK_COINS, BONUS_TASK_GEMS, WEEKLY_GOALS, WEEKLY_GOAL_REWARD, FIRST_TASK_COINS_MULT, FIRST_TASK_GEM_CHANCE, RATE_PROMPT_TIMEOUT, DIFFICULTY_SUGGESTION_STREAK, XP_REWARD, CONFETTI_COUNT, XP_BASE_LEVEL, CHEST_OPEN_MS, CHEST_PURCHASE_OPEN_MS, CHEST_COINS, CHEST_GEMS, CHEST_XP, SLABS_PER_LEVEL, INITIAL_SLABS, slabOffsets, slabCountForLevel, BOOST_MULT, BOOST_DURATION_MS, BOOST_CHANCE_PER_COMPLETION, BOOST_COOLDOWN_MS, SHOP_ITEMS, ITEM_TYPES, CHEST_ITEM_ID, ITEM_ROTATIONS, PLACEMENT_VERSION, DIFFICULTY_ORDER, REPEAT_VALUES, CUSTOM_REPEAT_DEFAULT_MS, TASK_LISTS, FUN_TASK_COINS, FUN_TASK_XP, HIGHLIGHT_COUNT, ACHIEVEMENTS, MORNING_END_HOUR, NIGHT_START_HOUR } = C;

  function defaultAchievementStats() {
    return {
      totalCompleted: 0,
      morningCompleted: 0,
      nightCompleted: 0,
      bestStreak: 0,
      funCompleted: 0,
      itemMoves: 0,
      weekendCompleted: 0,
      chainedCompleted: 0,
      bonusCompleted: 0,
      chestsOpened: 0,
      dailyGoalsReached: 0,
      coinsSpent: 0,
      itemsBought: 0,
    };
  }

  function defaultState() {
    return {
      coins: 0,
      gems: 0,
      dailyCompleted: 0,
      tasks: [],
      nextId: 1,
      firstTaskStreak: 0,
      lastFirstTaskDayKey: null,
      weeklyCompleted: 0,
      weekKey: null,
      xp: 0,
      chests: [],
      boostUntil: 0,
      boostCooldownUntil: 0,
      lastDailyMilestone: 0,
      lastWeeklyMilestone: 0,
      ownedItems: [],
      placedItems: [],
      achievements: { unlocked: [], stats: defaultAchievementStats() },
      dayStartHour: 0,
      uiSheetHeightVh: 0,
    };
  }

  const state = defaultState();

  function isRecord(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  function num(v, fallback) {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  }

  function str(v, fallback) {
    return typeof v === "string" ? v : fallback;
  }

  function migrateTask(raw, i) {
    if (!isRecord(raw)) return null;
    return {
      id: num(raw.id, i + 1),
      title: str(raw.title, "Untitled"),
      list: TASK_LISTS.includes(raw.list) ? raw.list : "todo",
      difficulty: raw.difficulty in COIN_REWARD ? raw.difficulty : "easy",
      repeat: REPEAT_VALUES.includes(raw.repeat) ? raw.repeat : "none",
      done: raw.done === true,
      createdAt: num(raw.createdAt, Date.now()),
      completedAt: typeof raw.completedAt === "number" ? raw.completedAt : null,
      streak: num(raw.streak, 0),
      streakDayKeys: Array.isArray(raw.streakDayKeys)
        ? raw.streakDayKeys.filter((k) => typeof k === "string")
        : [],
      bonus: raw.bonus === true,
      deadline: typeof raw.deadline === "number" ? raw.deadline : null,
      repeatTime: num(raw.repeatTime, NaN),
      repeatAfterCompletion: raw.repeatAfterCompletion === true || raw.repeatCustomFromCompletion === true,
      repeatWeekdays: normalizeWeekdays(raw.repeatWeekdays, raw.repeatWeekday),
      repeatMonthlyWeekday: raw.repeatMonthlyWeekday == null
        ? null
        : Math.min(6, Math.max(0, Math.floor(num(raw.repeatMonthlyWeekday, 0)))),
      repeatMonthlyFirst: raw.repeatMonthlyFirst === true,
      repeatCustomMs: Math.max(60000, num(raw.repeatCustomMs, CUSTOM_REPEAT_DEFAULT_MS)),
      chainedAfter: num(raw.chainedAfter, 0),
      timeLimit: num(raw.timeLimit, 0),
      startedAt: num(raw.startedAt, 0),
      ratedDifficulty: raw.ratedDifficulty ?? null,
      difficultySuggested: raw.difficultySuggested === true,
      completedViaSubtasks: raw.completedViaSubtasks === true,
      reward: isRecord(raw.reward)
        ? {
            coins: num(raw.reward.coins, 0),
            gems: num(raw.reward.gems, 0),
            xp: num(raw.reward.xp, 0),
            chestEarned: raw.reward.chestEarned === true,
            chestId: num(raw.reward.chestId, null),
            firstTaskDay: num(raw.reward.firstTaskDay, 0),
          }
        : null,
      subtasks: Array.isArray(raw.subtasks)
        ? raw.subtasks
            .filter(isRecord)
            .map((st) => ({
              id: num(st.id, 0),
              title: str(st.title, "Untitled"),
              difficulty: st.difficulty in COIN_REWARD ? st.difficulty : "easy",
              done: st.done === true,
              chainedAfter: num(st.chainedAfter, 0),
              reward: isRecord(st.reward)
                ? {
                    coins: num(st.reward.coins, 0),
                    gems: num(st.reward.gems, 0),
                    xp: num(st.reward.xp, 0),
                  }
                : null,
            }))
        : [],
    };
  }

  function ownedItemIds(raw) {
    return Array.isArray(raw.ownedItems)
      ? raw.ownedItems.filter((id) => SHOP_ITEMS.some((it) => it.id === id))
      : [];
  }

  function normalizePlaced(itemId, cellIndex, rotation) {
    return {
      itemId,
      cellIndex,
      rotation: ((rotation % ITEM_ROTATIONS) + ITEM_ROTATIONS) % ITEM_ROTATIONS,
      placementVersion: PLACEMENT_VERSION,
    };
  }

  function migratePlacedItems(rawPlaced, ownedIds) {
    const valid = Array.isArray(rawPlaced)
      ? rawPlaced
          .filter((p) =>
            isRecord(p) &&
            ITEM_TYPES[p.itemId] &&
            ownedIds.includes(p.itemId) &&
            Number.isInteger(p.cellIndex) &&
            p.cellIndex >= 0)
          .map((p) => normalizePlaced(p.itemId, p.cellIndex, num(p.rotation, 0)))
      : [];
    const byItem = new Map();
    for (const p of valid) if (!byItem.has(p.itemId)) byItem.set(p.itemId, p);

    const slabCellsTaken = new Set();
    let nextCell = 0;
    const freeCell = () => {
      while (slabCellsTaken.has(nextCell)) nextCell++;
      const cell = nextCell;
      slabCellsTaken.add(cell);
      return cell;
    };

    const result = [];
    for (const id of ownedIds) {
      let p = byItem.get(id) || normalizePlaced(id, ITEM_TYPES[id] === "slab" ? freeCell() : 0, 0);
      if (ITEM_TYPES[id] === "slab") {
        if (slabCellsTaken.has(p.cellIndex)) p = normalizePlaced(id, freeCell(), p.rotation);
        else slabCellsTaken.add(p.cellIndex);
      }
      result.push(p);
    }
    return result;
  }

  function migrateAchievements(raw) {
    const stats = defaultAchievementStats();
    const rawStats = isRecord(raw) && isRecord(raw.stats) ? raw.stats : {};
    for (const key of Object.keys(stats)) {
      stats[key] = num(rawStats[key], 0);
    }
    const validIds = new Set(ACHIEVEMENTS.map((a) => a.id));
    const unlocked = Array.isArray(raw && raw.unlocked)
      ? raw.unlocked.filter((id) => validIds.has(id))
      : [];
    return { unlocked, stats };
  }

  function migrateState(raw) {
    if (!isRecord(raw)) return null;
    const ownedIds = ownedItemIds(raw);
    const tasks = Array.isArray(raw.tasks)
      ? raw.tasks.map(migrateTask).filter(Boolean)
      : [];
    return {
      coins: num(raw.coins, 0),
      gems: num(raw.gems, 0),
      dailyCompleted: num(raw.dailyCompleted, 0),
      tasks,
      nextId: num(raw.nextId, tasks.length + 1),
      firstTaskStreak: num(raw.firstTaskStreak, 0),
      lastFirstTaskDayKey: str(raw.lastFirstTaskDayKey, null),
      weeklyCompleted: num(raw.weeklyCompleted, 0),
      weekKey: str(raw.weekKey, null),
      xp: num(raw.xp, 0),
      chests: Array.isArray(raw.chests)
        ? raw.chests
            .filter(isRecord)
            .map((c) => ({
              id: num(c.id, 0),
              earnedAt: num(c.earnedAt, 0),
              opened: c.opened === true,
              openedAt: num(c.openedAt, 0),
              openDelayMs: num(c.openDelayMs, CHEST_OPEN_MS),
              contents: null,
            }))
        : [],
      boostUntil: num(raw.boostUntil, 0),
      boostCooldownUntil: num(raw.boostCooldownUntil, 0),
      lastDailyMilestone: raw.lastDailyMilestone ?? 0,
      lastWeeklyMilestone: raw.lastWeeklyMilestone ?? 0,
      ownedItems: ownedIds,
      placedItems: migratePlacedItems(raw.placedItems, ownedIds),
      achievements: migrateAchievements(raw.achievements),
      dayStartHour: Math.min(23, Math.max(0, Math.floor(num(raw.dayStartHour, 0)))),
      uiSheetHeightVh: Math.min(95, Math.max(0, num(raw.uiSheetHeightVh, 0))),
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!isRecord(data)) return null;
      if (data.schemaVersion !== undefined && data.schemaVersion > SCHEMA_VERSION) {
        return null;
      }
      return migrateState(data.state);
    } catch {
      return null;
    }
  }

  function resetState() {
    Object.assign(state, defaultState());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ schemaVersion: SCHEMA_VERSION, state })
      );
    } catch {
      // storage full or unavailable: keep running in-memory
    }
    window.dispatchEvent(new CustomEvent("game-state-changed"));
  }

  function clampWeekdays(raw) {
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map((d) => Math.floor(Number(d))).filter((d) => d >= 0 && d <= 6))]
      .sort((a, b) => a - b);
  }

  function normalizeWeekdays(raw, legacySingle) {
    const fromArray = clampWeekdays(raw);
    if (fromArray.length > 0) return fromArray;
    if (Number.isFinite(legacySingle)) {
      return [Math.min(6, Math.max(0, Math.floor(legacySingle)))];
    }
    return [1];
  }

  const ui = {
    render() {},
    showToast() {},
    promptDifficultyRating() {},
  };

  function render() { ui.render(); }

  function showToast(message) { ui.showToast(message); }

  function promptDifficultyRating(task) { ui.promptDifficultyRating(task); }

  function itemIsOwned(id) {
    return state.ownedItems.includes(id);
  }

  Object.assign(C, { defaultAchievementStats, defaultState, isRecord, num, str, migrateTask, ownedItemIds, normalizePlaced, migratePlacedItems, migrateAchievements, migrateState, loadState, resetState, saveState, clampWeekdays, normalizeWeekdays, render, showToast, promptDifficultyRating, itemIsOwned, state, ui , itemIsOwned });
})();
