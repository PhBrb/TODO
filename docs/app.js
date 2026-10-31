(() => {
  "use strict";

  Game.ui.render = () => AppUI.render();
  Game.ui.showToast = (message) => AppUI.showToast(message);
  Game.ui.promptDifficultyRating = (task) => AppUI.promptDifficultyRating(task);

  AppUI.els.versionEl.textContent = "v" + Game.VERSION;

  const saved = Game.loadState();
  if (saved) Object.assign(Game.state, saved);
  Game.rolloverCheckpoints();
  Game.checkRecurringTasks();
  setInterval(Game.checkRecurringTasks, 15000);
  setInterval(Game.rolloverCheckpoints, 60000);
  setInterval(AppUI.updateLiveClocks, 1000);

  AppUI.els.resetBtn.addEventListener("click", () => {
    if (!confirm("Reset ALL data? This can not be undone.")) return;
    Game.resetState();
    Game.saveState();
    AppUI.render();
  });

  AppUI.els.tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tab]");
    if (!btn) return;
    AppUI.activeTab = btn.dataset.tab;
    for (const b of AppUI.els.tabsEl.querySelectorAll("button")) {
      b.classList.toggle("active", b === btn);
    }
    AppUI.render();
  });

  AppUI.wheels.list = AppUI.mountWheel("list-wheel", AppUI.LIST_OPTIONS, "todo", "List", AppUI.updateCreateFormMode);
  AppUI.wheels.diff = AppUI.mountWheel("difficulty-wheel", AppUI.DIFFICULTY_OPTIONS, "easy", "Difficulty");
  AppUI.wheels.repeat = AppUI.mountWheel("repeat-wheel", AppUI.REPEAT_OPTIONS, "none", "Repeat", AppUI.updateCreateFormMode);
  AppUI.wheels.timeLimit = AppUI.mountWheel("time-limit-wheel", AppUI.TIME_LIMIT_OPTIONS, 0, "Time limit");

  AppUI.initForm();
  AppUI.initOverlays();
  AppUI.initUiSheet();
  AppUI.initActionsToggle();
  AppUI.updateCreateFormMode();
  AppUI.render();
})();
