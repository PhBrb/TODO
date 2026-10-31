(() => {
  "use strict";

  const C = (window.GameCore = window.GameCore || {});
  const { VERSION, STORAGE_KEY, SCHEMA_VERSION, TIME_LIMIT_MINUTES, TIME_BONUS_COINS, COIN_REWARD, DAILY_GOALS, GOAL_REWARD, GEM_CHANCE, GEM_BONUS_AMOUNT, MULTIPLIER_MIN, MULTIPLIER_MAX, STREAK_BONUS_START_DAY, STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX, BONUS_TASK_RATE, BONUS_TASK_COINS, BONUS_TASK_GEMS, WEEKLY_GOALS, WEEKLY_GOAL_REWARD, FIRST_TASK_COINS_MULT, FIRST_TASK_GEM_CHANCE, RATE_PROMPT_TIMEOUT, DIFFICULTY_SUGGESTION_STREAK, XP_REWARD, CONFETTI_COUNT, XP_BASE_LEVEL, CHEST_OPEN_MS, CHEST_PURCHASE_OPEN_MS, CHEST_COINS, CHEST_GEMS, CHEST_XP, SLABS_PER_LEVEL, INITIAL_SLABS, slabOffsets, slabCountForLevel, BOOST_MULT, BOOST_DURATION_MS, BOOST_CHANCE_PER_COMPLETION, BOOST_COOLDOWN_MS, SHOP_ITEMS, ITEM_TYPES, CHEST_ITEM_ID, ITEM_ROTATIONS, PLACEMENT_VERSION, DIFFICULTY_ORDER, REPEAT_VALUES, CUSTOM_REPEAT_DEFAULT_MS, TASK_LISTS, FUN_TASK_COINS, FUN_TASK_XP, HIGHLIGHT_COUNT, ACHIEVEMENTS, MORNING_END_HOUR, NIGHT_START_HOUR, state, saveState, levelFromXp, itemIsOwned, normalizePlaced, earnChest, trackAchievement, announceAchievements } = C;

  function shopItemById(id) {
    return SHOP_ITEMS.find((it) => it.id === id) || null;
  }

  function itemIsUnlockable(item) {
    return levelFromXp(state.xp) >= item.minLevel;
  }

  function purchaseItem(id) {
    const item = shopItemById(id);
    if (!item) return { ok: false, reason: "unknown" };
    if (itemIsOwned(id)) return { ok: false, reason: "owned" };
    if (!itemIsUnlockable(item)) return { ok: false, reason: "level" };
    if (state.coins < item.costCoins) return { ok: false, reason: "coins" };
    if (state.gems < item.costGems) return { ok: false, reason: "gems" };
    state.coins -= item.costCoins;
    state.gems -= item.costGems;
    state.ownedItems.push(id);
    state.achievements.stats.coinsSpent += item.costCoins;
    state.achievements.stats.itemsBought += 1;
    defaultPlaceItem(id);
    if (id === CHEST_ITEM_ID) earnChest(CHEST_PURCHASE_OPEN_MS);
    announceAchievements(trackAchievement({}));
    saveState();
    return { ok: true };
  }

  function itemPlacement(itemId) {
    return state.placedItems.find((p) => p.itemId === itemId) || null;
  }

  function cellTakenBy(cellIndex) {
    return state.placedItems.find(
      (p) => ITEM_TYPES[p.itemId] === "slab" && p.cellIndex === cellIndex
    ) || null;
  }

  function defaultPlaceItem(id) {
    if (itemPlacement(id)) return;
    const cell = ITEM_TYPES[id] === "slab" ? firstFreeCell() : 0;
    state.placedItems.push(normalizePlaced(id, cell, 0));
  }

  function firstFreeCell() {
    let cell = 0;
    while (cellTakenBy(cell)) cell++;
    return cell;
  }

  function placeItem(itemId, cellIndex) {
    const placement = itemPlacement(itemId);
    if (!placement) return { ok: false, reason: "not owned" };
    if (!Number.isInteger(cellIndex) || cellIndex < 0) return { ok: false, reason: "cell" };
    if (ITEM_TYPES[itemId] === "slab" && cellTakenBy(cellIndex)) {
      return { ok: false, reason: "occupied" };
    }
    const previousCell = placement.cellIndex;
    placement.cellIndex = cellIndex;
    placement.placementVersion = PLACEMENT_VERSION;
    const moved = cellIndex !== previousCell;
    saveState();
    if (moved) {
      announceAchievements(trackAchievement({
        itemMoves: state.achievements.stats.itemMoves + 1,
      }));
      saveState();
    }
    return { ok: true };
  }

  function rotateItem(itemId) {
    const placement = itemPlacement(itemId);
    if (!placement) return { ok: false, reason: "not owned" };
    placement.rotation = (placement.rotation + 1) % ITEM_ROTATIONS;
    placement.placementVersion = PLACEMENT_VERSION;
    saveState();
    announceAchievements(trackAchievement({
      itemMoves: state.achievements.stats.itemMoves + 1,
    }));
    saveState();
    return { ok: true };
  }

  Object.assign(C, { shopItemById, itemIsUnlockable, purchaseItem, itemPlacement, cellTakenBy, defaultPlaceItem, firstFreeCell, placeItem, rotateItem });
})();
