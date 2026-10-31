(() => {
  "use strict";

  const C = (window.GameCore = window.GameCore || {});
  const { VERSION, STORAGE_KEY, SCHEMA_VERSION, TIME_LIMIT_MINUTES, TIME_BONUS_COINS, COIN_REWARD, DAILY_GOALS, GOAL_REWARD, GEM_CHANCE, GEM_BONUS_AMOUNT, MULTIPLIER_MIN, MULTIPLIER_MAX, STREAK_BONUS_START_DAY, STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX, BONUS_TASK_RATE, BONUS_TASK_COINS, BONUS_TASK_GEMS, WEEKLY_GOALS, WEEKLY_GOAL_REWARD, FIRST_TASK_COINS_MULT, FIRST_TASK_GEM_CHANCE, RATE_PROMPT_TIMEOUT, DIFFICULTY_SUGGESTION_STREAK, XP_REWARD, CONFETTI_COUNT, XP_BASE_LEVEL, CHEST_OPEN_MS, CHEST_PURCHASE_OPEN_MS, CHEST_COINS, CHEST_GEMS, CHEST_XP, SLABS_PER_LEVEL, INITIAL_SLABS, slabOffsets, slabCountForLevel, BOOST_MULT, BOOST_DURATION_MS, BOOST_CHANCE_PER_COMPLETION, BOOST_COOLDOWN_MS, SHOP_ITEMS, ITEM_TYPES, CHEST_ITEM_ID, ITEM_ROTATIONS, PLACEMENT_VERSION, DIFFICULTY_ORDER, REPEAT_VALUES, CUSTOM_REPEAT_DEFAULT_MS, TASK_LISTS, FUN_TASK_COINS, FUN_TASK_XP, HIGHLIGHT_COUNT, ACHIEVEMENTS, MORNING_END_HOUR, NIGHT_START_HOUR, state, saveState, showToast, dayKey, isoWeekKey } = C;

  function firstTaskTier(streak) {
    if (streak >= 7) return "day7";
    if (streak >= 3) return "day3_6";
    return "day1_2";
  }

  function xpForLevel(level) {
    return XP_BASE_LEVEL * level * (level + 1) / 2;
  }

  function levelFromXp(xp) {
    let level = 1;
    while (xp >= xpForLevel(level + 1)) level++;
    return level;
  }

  function levelStartXp(level) {
    return level === 1 ? 0 : xpForLevel(level);
  }

  function chestReady(chest) {
    if (chest.opened) return false;
    const openDelay = chest.openDelayMs ?? CHEST_OPEN_MS;
    return Date.now() - chest.earnedAt >= openDelay;
  }

  function isBoostActive() {
    return Date.now() < state.boostUntil;
  }

  function maybeStartBoost() {
    if (isBoostActive()) return;
    if (Date.now() < state.boostCooldownUntil) return;
    if (Math.random() >= BOOST_CHANCE_PER_COMPLETION) return;
    state.boostUntil = Date.now() + BOOST_DURATION_MS;
    state.boostCooldownUntil = state.boostUntil + BOOST_COOLDOWN_MS;
    showToast(`⚡ Reward boost active! x${BOOST_MULT} for 1h`);
  }

  function rolloverCheckpoints() {
    const now = Date.now();
    const today = dayKey(now);
    let changed = false;
    if (state.lastFirstTaskDayKey !== today && state.dailyCompleted > 0) {
      state.dailyCompleted = 0;
      state.lastDailyMilestone = 0;
      changed = true;
    }
    const week = isoWeekKey(now);
    if (state.weekKey !== week) {
      state.weekKey = week;
      state.weeklyCompleted = 0;
      state.lastWeeklyMilestone = 0;
      changed = true;
    }
    if (changed) saveState();
  }

  function applyFirstTaskBonus() {
    const now = Date.now();
    const today = dayKey(now);
    if (state.lastFirstTaskDayKey === today) return null;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    state.firstTaskStreak =
      state.lastFirstTaskDayKey === dayKey(yesterday.getTime())
        ? state.firstTaskStreak + 1
        : 1;
    state.lastFirstTaskDayKey = today;

    const tier = firstTaskTier(state.firstTaskStreak);
    const coins = Math.round(FIRST_TASK_COINS_MULT[tier] * 10);
    const gems =
      Math.random() < FIRST_TASK_GEM_CHANCE[tier] ? GEM_BONUS_AMOUNT : 0;
    return { coins, gems, streak: state.firstTaskStreak };
  }

  Object.assign(C, { firstTaskTier, xpForLevel, levelFromXp, levelStartXp, chestReady, isBoostActive, maybeStartBoost, rolloverCheckpoints, applyFirstTaskBonus });
})();
