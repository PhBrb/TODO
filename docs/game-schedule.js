(() => {
  "use strict";

  const C = (window.GameCore = window.GameCore || {});
  const { VERSION, STORAGE_KEY, SCHEMA_VERSION, TIME_LIMIT_MINUTES, TIME_BONUS_COINS, COIN_REWARD, DAILY_GOALS, GOAL_REWARD, GEM_CHANCE, GEM_BONUS_AMOUNT, MULTIPLIER_MIN, MULTIPLIER_MAX, STREAK_BONUS_START_DAY, STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX, BONUS_TASK_RATE, BONUS_TASK_COINS, BONUS_TASK_GEMS, WEEKLY_GOALS, WEEKLY_GOAL_REWARD, FIRST_TASK_COINS_MULT, FIRST_TASK_GEM_CHANCE, RATE_PROMPT_TIMEOUT, DIFFICULTY_SUGGESTION_STREAK, XP_REWARD, CONFETTI_COUNT, XP_BASE_LEVEL, CHEST_OPEN_MS, CHEST_PURCHASE_OPEN_MS, CHEST_COINS, CHEST_GEMS, CHEST_XP, SLABS_PER_LEVEL, INITIAL_SLABS, slabOffsets, slabCountForLevel, BOOST_MULT, BOOST_DURATION_MS, BOOST_CHANCE_PER_COMPLETION, BOOST_COOLDOWN_MS, SHOP_ITEMS, ITEM_TYPES, CHEST_ITEM_ID, ITEM_ROTATIONS, PLACEMENT_VERSION, DIFFICULTY_ORDER, REPEAT_VALUES, CUSTOM_REPEAT_DEFAULT_MS, TASK_LISTS, FUN_TASK_COINS, FUN_TASK_XP, HIGHLIGHT_COUNT, ACHIEVEMENTS, MORNING_END_HOUR, NIGHT_START_HOUR, state, saveState, render, showToast } = C;

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
    d.setHours(d.getHours() - (state.dayStartHour ?? 0));
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function fiveMinKey(ts) {
    return `${dayKey(ts)}-${Math.floor(ts / 300000)}`;
  }

  function repeatKey(task, ts) {
    if (task.repeat === "every_5min") return fiveMinKey(ts);
    if (task.repeat === "custom") return fiveMinKey(ts);
    if (task.repeat === "weekly") {
      const d = new Date(ts);
      d.setHours(d.getHours() - (state.dayStartHour ?? 0));
      return `${d.getFullYear()}-W${isoWeek(d)}`;
    }
    if (task.repeat === "monthly") {
      const d = new Date(ts);
      d.setHours(d.getHours() - (state.dayStartHour ?? 0));
      return `${d.getFullYear()}-${d.getMonth() + 1}`;
    }
    return dayKey(ts);
  }

  function isoWeek(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
    return 1 + Math.round((date - firstThursday) / 604800000);
  }

  function prevRepeatKey(task, ts) {
    if (task.repeat === "every_5min" || task.repeat === "custom") {
      return fiveMinKey(ts - (task.repeatCustomMs || CUSTOM_REPEAT_DEFAULT_MS));
    }
    if (task.repeat === "weekly") {
      const d = new Date(ts);
      d.setDate(d.getDate() - 7);
      return repeatKey(task, d.getTime());
    }
    if (task.repeat === "monthly") {
      const d = new Date(ts);
      d.setMonth(d.getMonth() - 1);
      return repeatKey(task, d.getTime());
    }
    const d = new Date(ts);
    d.setDate(d.getDate() - 1);
    return dayKey(d.getTime());
  }

  function nextTimeOfDay(minutes) {
    const next = new Date();
    next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    return next.getTime();
  }

  function timeOfDayMs(repeatTime) {
    return Number.isFinite(repeatTime)
      ? (Math.floor(repeatTime / 60) * 3600000 + (repeatTime % 60) * 60000)
      : 0;
  }

  function nextOccurrence(task, completedAt) {
    const repeat = task.repeat;
    if (repeat === "every_5min") return completedAt + 300000;
    if (repeat === "custom") {
      const interval = task.repeatCustomMs || CUSTOM_REPEAT_DEFAULT_MS;
      return (task.repeatAfterCompletion ? completedAt : Date.now()) + interval;
    }
    const base = Date.now();
    const d = new Date(base);
    const tod = timeOfDayMs(task.repeatTime);
    if (repeat === "daily") {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      d.setTime(d.getTime() + tod);
      if (d.getTime() <= base) d.setTime(d.getTime() + 86400000);
      return d.getTime();
    }
    if (repeat === "weekly") {
      const weekdays = task.repeatWeekdays || [];
      for (let offset = 1; offset <= 7; offset++) {
        const candidate = new Date(base);
        candidate.setDate(candidate.getDate() + offset);
        if (!weekdays.includes(candidate.getDay())) continue;
        candidate.setHours(0, 0, 0, 0);
        candidate.setTime(candidate.getTime() + tod);
        if (candidate.getTime() > base) return candidate.getTime();
      }
      return Infinity;
    }
    if (repeat === "monthly") {
      for (let m = 1; m <= 2; m++) {
        const next = nthWeekdayOfMonth(d.getFullYear(), d.getMonth() + m, task.repeatMonthlyWeekday, task.repeatMonthlyFirst !== false);
        next.setHours(0, 0, 0, 0);
        next.setTime(next.getTime() + tod);
        if (next.getTime() > base) return next.getTime();
      }
      return Infinity;
    }
    return Infinity;
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function nthWeekdayOfMonth(year, month, weekday, first) {
    if (weekday === null || weekday === undefined) {
      return new Date(year, month, 1);
    }
    if (first === false) {
      const lastDay = daysInMonth(year, month);
      const back = (new Date(year, month, lastDay).getDay() - weekday + 7) % 7;
      return new Date(year, month, lastDay - back);
    }
    const offset = (weekday - new Date(year, month, 1).getDay() + 7) % 7;
    return new Date(year, month, 1 + offset);
  }

  function streakHasFailed(task, now) {
    if (task.streak === 0 || task.streakDayKeys.length === 0) return false;
    const lastKey = task.streakDayKeys[task.streakDayKeys.length - 1];
    const currentKey = repeatKey(task, now);
    if (lastKey === currentKey) return false;
    return lastKey !== prevRepeatKey(task, now);
  }

  function checkRecurringTasks() {
    const now = Date.now();
    let changed = false;
    for (const task of state.tasks) {
      if (task.repeat === "none") continue;
      if (task.done && task.completedAt !== null) {
        if (nextOccurrence(task, task.completedAt) <= now) {
          task.done = false;
          task.completedAt = null;
          for (const st of task.subtasks) {
            st.done = false;
            st.reward = null;
          }
          const next = nextOccurrence(task, now);
          task.deadline = next === Infinity ? task.deadline : next;
          if (task.bonus) {
            const wasBonus = task.bonus;
            task.bonus = Math.random() < BONUS_TASK_RATE;
            if (wasBonus && !task.bonus) changed = true;
            if (task.bonus && !wasBonus) showToast(`⭐ "${task.title}" has a bonus reward this time!`);
          }
          changed = true;
        }
      }
      if (streakHasFailed(task, now)) {
        task.streak = 0;
        task.streakDayKeys = [];
        changed = true;
      }
    }
    if (changed) { saveState(); render(); }
  }

  function isoWeekKey(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return `${d.getFullYear()}-${1 + Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )}`;
  }

  Object.assign(C, { randomMultiplier, streakBonus, dayKey, fiveMinKey, repeatKey, isoWeek, prevRepeatKey, nextTimeOfDay, timeOfDayMs, nextOccurrence, daysInMonth, nthWeekdayOfMonth, streakHasFailed, checkRecurringTasks, isoWeekKey });
})();
