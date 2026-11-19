import * as Game from "./game.js";
import { AppUI } from "./app-state.js";
import { CUSTOM_DAYS_OPTIONS, CUSTOM_HOURS_OPTIONS, CUSTOM_MINUTES_OPTIONS, DIFFICULTY_OPTIONS, LIST_OPTIONS, REPEAT_OPTIONS, TIME_LIMIT_OPTIONS, WEEKDAY_CHECKBOXES, createDueAtWheels, createFieldToggle, createWheel, deadlineInputValue, isRepeatingRepeat, labeledField, readScheduleValues } from "./app-util.js";

const W = AppUI.wheels;
AppUI.deadlineKind = AppUI.deadlineKind || "fixed";

function deadlineSchedule(wrap, values, read) {
  const input = document.createElement("input");
  input.type = "datetime-local";
  input.className = "deadline-input";
  if (values.deadline) input.value = deadlineInputValue({ deadline: values.deadline });
  const box = document.createElement("div");
  box.className = "deadline-input-box";
  box.appendChild(input);
  const field = labeledField("\ud83d\udcc5 Deadline", [box]);
  field.classList.add("deadline-field");
  wrap.appendChild(field);
  read.deadline = () => input.value;
}

function weekdayToggleGrid(selected) {
  const group = document.createElement("div");
  group.className = "day-toggle-grid weekday-grid";
  const buttons = WEEKDAY_CHECKBOXES.map(([day, label]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-toggle";
    btn.textContent = label;
    btn.setAttribute("aria-pressed", String(selected.includes(day)));
    btn.classList.toggle("on", selected.includes(day));
    btn.addEventListener("click", () => {
      const othersOn = buttons.some((b) => b.btn !== btn && b.btn.classList.contains("on"));
      if (btn.classList.contains("on") && !othersOn) return;
      const on = btn.classList.toggle("on");
      btn.setAttribute("aria-pressed", String(on));
    });
    group.appendChild(btn);
    return { btn, day };
  });
  return { group, buttons };
}

function weeklySchedule(wrap, values, read) {
  const { group, buttons } = weekdayToggleGrid(values.repeatWeekdays || [1]);
  wrap.appendChild(group);
  read.repeatWeekdays = () =>
    buttons.filter((b) => b.btn.classList.contains("on")).map((b) => b.day);
}

function monthlySchedule(wrap, values, read) {
  const weekday = values.repeatMonthlyWeekday ?? null;
  const weekdayGroup = document.createElement("div");
  weekdayGroup.className = "day-toggle-grid weekday-grid";
  const buttons = WEEKDAY_CHECKBOXES.map(([day, label]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-toggle" + (weekday === day ? " on" : "");
    btn.textContent = label;
    btn.setAttribute("aria-pressed", String(weekday === day));
    btn.addEventListener("click", () => {
      const on = !btn.classList.contains("on");
      for (const b of buttons) {
        b.btn.classList.remove("on");
        b.btn.setAttribute("aria-pressed", "false");
      }
      if (on) {
        btn.classList.add("on");
        btn.setAttribute("aria-pressed", "true");
      }
      setFirstLastEnabled(on);
      if (on) setFirstLast(true);
    });
    weekdayGroup.appendChild(btn);
    return { btn, day };
  });
  wrap.appendChild(weekdayGroup);

  const firstLast = document.createElement("div");
  firstLast.className = "day-toggle-grid first-last-grid";
  const firstBtn = document.createElement("button");
  firstBtn.type = "button";
  firstBtn.className = "day-toggle" + (weekday !== null && values.repeatMonthlyFirst !== false ? " on" : "");
  firstBtn.textContent = "First";
  const lastBtn = document.createElement("button");
  lastBtn.type = "button";
  lastBtn.className = "day-toggle" + (weekday !== null && values.repeatMonthlyFirst === false ? " on" : "");
  lastBtn.textContent = "Last";
  function setFirstLastEnabled(enabled) {
    for (const b of [firstBtn, lastBtn]) {
      b.disabled = !enabled;
      b.classList.toggle("disabled", !enabled);
      if (!enabled) {
        b.classList.remove("on");
        b.setAttribute("aria-pressed", "false");
      }
    }
  }
  firstBtn.setAttribute("aria-pressed", String(weekday !== null && values.repeatMonthlyFirst !== false));
  lastBtn.setAttribute("aria-pressed", String(weekday !== null && values.repeatMonthlyFirst === false));
  firstBtn.addEventListener("click", () => setFirstLast(true));
  lastBtn.addEventListener("click", () => setFirstLast(false));
  function setFirstLast(first) {
    firstBtn.classList.toggle("on", first);
    firstBtn.setAttribute("aria-pressed", String(first));
    lastBtn.classList.toggle("on", !first);
    lastBtn.setAttribute("aria-pressed", String(!first));
  }
  setFirstLastEnabled(weekday !== null);
  firstLast.appendChild(firstBtn);
  firstLast.appendChild(lastBtn);
  wrap.appendChild(firstLast);

  read.repeatMonthlyWeekday = () => {
    const on = buttons.find((b) => b.btn.classList.contains("on"));
    return on ? on.day : null;
  };
  read.repeatMonthlyFirst = () => firstBtn.classList.contains("on");
}

function customSchedule(wrap, values, read, compact) {
  const everyRow = document.createElement("div");
  everyRow.className = "repeat-every-row";
  const everyLabel = document.createElement("span");
  everyLabel.className = "repeat-every-label";
  everyLabel.textContent = "Repeat every";
  everyRow.appendChild(everyLabel);
  let afterCompletion = values.repeatAfterCompletion === true;
  everyRow.appendChild(createFieldToggle(
    afterCompletion,
    (on) => { afterCompletion = on; },
    "After completion",
    "Start counting after completion"
  ));
  wrap.appendChild(everyRow);
  const days = createWheel(CUSTOM_DAYS_OPTIONS, values.customDays ?? 1, "Days", null, compact);
  const hours = createWheel(CUSTOM_HOURS_OPTIONS, values.customHours ?? 0, "Hours", null, compact);
  const mins = createWheel(CUSTOM_MINUTES_OPTIONS, values.customMinutes ?? 0, "Minutes", null, compact);
  wrap.appendChild(days.el);
  wrap.appendChild(hours.el);
  wrap.appendChild(mins.el);
  read.repeatCustomMs = () =>
    (Number(days.value) * 86400 + Number(hours.value) * 3600 + Number(mins.value) * 60) * 1000;

  read.repeatAfterCompletion = () => afterCompletion;
}

const SCHEDULE_BUILDERS = {
  none: deadlineSchedule,
  weekly: weeklySchedule,
  monthly: monthlySchedule,
  custom: customSchedule,
};

function buildScheduleControls(repeat, values = {}, compact = false) {
  const wrap = document.createElement("div");
  wrap.className = "repeat-schedule";
  const read = {};
  const builder = SCHEDULE_BUILDERS[repeat];
  if (builder) builder(wrap, values, read, compact);
  return { el: wrap, read };
}

function scheduleShowsTimeOfDay(repeat) {
  return repeat === "daily" || repeat === "weekly" || repeat === "monthly";
}


function timeToMinutes(time) {
  const [h, m] = String(time).split(":").map(Number);
  return (h * 60 + m) || undefined;
}

function buildOffsetWheelsInto(wrap, rule, compact = true) {
  wrap.innerHTML = "";
  const ms = rule && rule.kind === "offset" ? rule.ms : 86400000;
  const days = createWheel(CUSTOM_DAYS_OPTIONS, Math.floor(ms / 86400000), "Days", null, compact);
  const hours = createWheel(CUSTOM_HOURS_OPTIONS, Math.floor((ms % 86400000) / 3600000), "Hours", null, compact);
  const mins = createWheel(CUSTOM_MINUTES_OPTIONS, Math.floor((ms % 3600000) / 60000), "Minutes", null, compact);
  wrap.appendChild(days.el);
  wrap.appendChild(hours.el);
  wrap.appendChild(mins.el);
  wrap.readOffsetMs = () =>
    (Number(days.value) * 86400 + Number(hours.value) * 3600 + Number(mins.value) * 60) * 1000;
}

// A labeled rule section: enable toggle + kind switch (fixed day/time vs
// after-completion offset) + the corresponding wheel selectors.
function buildRuleSection({ label, rule, enabled = true, onKind = null, compact = true }) {
  const section = document.createElement("div");
  section.className = "rule-section";
  let kind = rule && rule.kind === "offset" ? "offset" : "fixed";
  let isEnabled = enabled !== false;
  const kindLabel = (k) => (k === "offset" ? "\u{23F3} After completion" : "\u{1F4C5} Fixed day + time");
  const btnRow = document.createElement("div");
  btnRow.className = "deadline-btn-row";
  const toggle = createFieldToggle(isEnabled, (on) => { isEnabled = on; sync(); }, label, "Show/hide the wheels");
  const kindBtn = createFieldToggle(kind === "offset", (on) => {
    kind = on ? "offset" : "fixed";
    kindBtn.textContent = kindLabel(kind);
    if (onKind) onKind(kind);
    sync();
  }, kindLabel(kind), "Switch between fixed day/time and time after completion");
  btnRow.appendChild(toggle);
  btnRow.appendChild(kindBtn);

  const fixedWrap = document.createElement("div");
  const grid = weekdayToggleGrid(rule && rule.kind === "fixed" ? rule.slots.map((sl) => sl.weekday) : [1]);
  const wheels = createDueAtWheels(timeToMinutes(rule && rule.kind === "fixed" && rule.slots[0] ? rule.slots[0].time : "18:00"), compact);
  const wheelsWrap = document.createElement("div");
  wheelsWrap.className = "due-at-wheels";
  for (const el of wheels.els) wheelsWrap.appendChild(el);
  fixedWrap.appendChild(grid.group);
  fixedWrap.appendChild(wheelsWrap);

  const offsetWrap = document.createElement("div");
  offsetWrap.className = "deadline-offset-wheels";
  buildOffsetWheelsInto(offsetWrap, rule, compact);

  function sync() {
    const showFixed = isEnabled && kind === "fixed";
    grid.group.classList.toggle("hidden", !showFixed);
    for (const el of wheels.els) el.classList.toggle("hidden", !showFixed);
    offsetWrap.classList.toggle("hidden", !(isEnabled && kind === "offset"));
  }
  section.appendChild(btnRow);
  section.appendChild(fixedWrap);
  section.appendChild(offsetWrap);
  sync();

  function read() {
    if (!isEnabled) return null;
    if (kind === "offset") {
      const ms = offsetWrap.readOffsetMs();
      return ms > 0 ? { kind: "offset", ms } : null;
    }
    const weekdays = grid.buttons.filter((b) => b.btn.classList.contains("on")).map((b) => b.day);
    const minutes = wheels.read();
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    return weekdays.length ? { kind: "fixed", slots: weekdays.map((weekday) => ({ weekday, time: `${hh}:${mm}` })) } : null;
  }
  return {
    el: section,
    read,
    isEnabled: () => isEnabled,
    getKind: () => kind,
    setKind(k) {
      kind = k;
      kindBtn.classList.toggle("on", k === "offset");
      kindBtn.setAttribute("aria-pressed", String(k === "offset"));
      kindBtn.textContent = kindLabel(k);
      sync();
    },
    setKindEnabled(e) {
      kindBtn.disabled = !e;
      kindBtn.classList.toggle("disabled", !e);
    },
  };
}

function updateCreateFormMode() {
  if (!W.list || !W.diff || !W.repeat || !W.timeLimit) return;
  const isFun = W.list.value === "fun";
  W.diff.disabled = isFun;
  W.repeat.disabled = isFun;
  W.timeLimit.disabled = isFun;
  const repeat = isFun ? "none" : W.repeat.value;
  AppUI.els.scheduleContainer.innerHTML = "";
  AppUI.scheduleControls = buildScheduleControls(repeat, {}, false);
  if (!AppUI.deadlineToggleBtn) {
    AppUI.deadlineToggleBtn = createFieldToggle(AppUI.createDeadlineEnabled, (on) => {
      AppUI.createDeadlineEnabled = on;
      syncCreateWeeklyWheels();
    }, "\u{1F4C5} Deadline", "Show/hide the deadline wheels");
    AppUI.deadlineKindBtn = createFieldToggle(AppUI.deadlineKind === "offset", (on) => {
      AppUI.deadlineKind = on ? "offset" : "fixed";
      AppUI.deadlineKindBtn.textContent = on ? "\u{23F3} After completion" : "\u{1F4C5} Fixed day + time";
      if (AppUI.resetSection) {
        if (on) AppUI.resetSection.setKind("offset");
        AppUI.resetSection.setKindEnabled(!on);
      }
      syncCreateWeeklyWheels();
    }, "\u{1F4C5} Fixed day + time", "Switch deadline between fixed day/time and time after completion");
    AppUI.deadlineBtnRow = document.createElement("div");
    AppUI.deadlineBtnRow.className = "deadline-btn-row";
    AppUI.deadlineBtnRow.appendChild(AppUI.deadlineToggleBtn);
    AppUI.deadlineBtnRow.appendChild(AppUI.deadlineKindBtn);
    AppUI.deadlineOffsetWrap = document.createElement("div");
    AppUI.deadlineOffsetWrap.className = "deadline-offset-wheels";
  }
  AppUI.deadlineToggleBtn.classList.toggle("on", AppUI.createDeadlineEnabled);
  AppUI.deadlineToggleBtn.setAttribute("aria-pressed", String(AppUI.createDeadlineEnabled));
  AppUI.deadlineKindBtn.classList.toggle("on", AppUI.deadlineKind === "offset");
  AppUI.deadlineKindBtn.setAttribute("aria-pressed", String(AppUI.deadlineKind === "offset"));
  AppUI.deadlineKindBtn.textContent = AppUI.deadlineKind === "offset" ? "\u{23F3} After completion" : "\u{1F4C5} Fixed day + time";
  AppUI.els.scheduleContainer.appendChild(AppUI.deadlineBtnRow);
  AppUI.els.scheduleContainer.appendChild(AppUI.scheduleControls.el);
  AppUI.els.scheduleContainer.appendChild(AppUI.deadlineOffsetWrap);
  buildCreateOffsetWheels();
  if (!AppUI.resetSection) {
    AppUI.resetSection = buildRuleSection({ label: "\u{1F501} Reset", rule: null, enabled: false, compact: false });
  }
  AppUI.els.form.appendChild(AppUI.resetSection.el);
  const deadlineField = AppUI.scheduleControls.el.querySelector(".deadline-field");
  AppUI.els.deadlineSlot.innerHTML = "";
  if (deadlineField) {
    AppUI.els.deadlineSlot.appendChild(deadlineField);
    AppUI.els.deadlineSlot.classList.remove("hidden");
  } else {
    AppUI.els.deadlineSlot.classList.add("hidden");
  }
  AppUI.els.scheduleContainer.classList.toggle("hidden", AppUI.scheduleControls.el.childElementCount === 0);
  AppUI.els.dueAtWheelsEl.innerHTML = "";
  AppUI.els.dueAtLabelRow.querySelectorAll(".end-of-day-btn, .field-toggle-btn").forEach((b) => b.remove());
  if (scheduleShowsTimeOfDay(repeat)) {
    AppUI.dueAtWheelsControls = createDueAtWheels(undefined, false);
    for (const el of AppUI.dueAtWheelsControls.els) AppUI.els.dueAtWheelsEl.appendChild(el);
    if (repeat !== "weekly") {
      AppUI.els.dueAtLabelRow.appendChild(createFieldToggle(AppUI.createDeadlineEnabled, (on) => {
        AppUI.createDeadlineEnabled = on;
        syncDueAtLabel();
      }, "Deadline", "Toggle deadline urgency"));
    }
    AppUI.els.dueAtLabelRow.appendChild(AppUI.dueAtWheelsControls.endOfDayBtn);
    AppUI.els.dueAtField.classList.remove("hidden");
  } else {
    AppUI.dueAtWheelsControls = null;
    AppUI.els.dueAtField.classList.add("hidden");
  }
  AppUI.lastRepeat = repeat;
  syncDueAtLabel();
  syncCreateWeeklyWheels();
}

function buildCreateOffsetWheels() {
  const wrap = AppUI.deadlineOffsetWrap;
  wrap.innerHTML = "";
  const days = createWheel(CUSTOM_DAYS_OPTIONS, 1, "Days", null, false);
  const hours = createWheel(CUSTOM_HOURS_OPTIONS, 0, "Hours", null, false);
  const mins = createWheel(CUSTOM_MINUTES_OPTIONS, 0, "Minutes", null, false);
  wrap.appendChild(days.el);
  wrap.appendChild(hours.el);
  wrap.appendChild(mins.el);
  wrap.readOffsetMs = () =>
    (Number(days.value) * 86400 + Number(hours.value) * 3600 + Number(mins.value) * 60) * 1000;
}

function syncCreateWeeklyWheels() {
  const weekly = AppUI.lastRepeat === "weekly";
  if (AppUI.deadlineBtnRow) AppUI.deadlineBtnRow.classList.toggle("hidden", !weekly);
  if (AppUI.resetSection) AppUI.resetSection.el.classList.toggle("hidden", !weekly);
  if (!weekly) return;
  const show = AppUI.createDeadlineEnabled;
  const offset = AppUI.deadlineKind === "offset";
  if (AppUI.scheduleControls) {
    AppUI.scheduleControls.el.classList.toggle("hidden", !show || offset);
  }
  const showDueAt = scheduleShowsTimeOfDay(AppUI.lastRepeat);
  AppUI.els.dueAtField.classList.toggle("hidden", !showDueAt || !show || offset);
  if (AppUI.deadlineOffsetWrap) AppUI.deadlineOffsetWrap.classList.toggle("hidden", !show || !offset);
}

function syncDueAtLabel() {
  if (!AppUI.els.dueAtLabel) return;
  AppUI.els.dueAtLabel.textContent = (AppUI.lastRepeat === "weekly" || AppUI.createDeadlineEnabled) ? "🕔 Due at" : "🕔 Resets at";
}

function initForm() {
  AppUI.els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = AppUI.els.taskInput.value.trim();
    if (!title) return;
    const repeat = W.list.value === "fun" ? "none" : W.repeat.value;
    const values = AppUI.scheduleControls ? readScheduleValues(AppUI.scheduleControls.read) : {};
    if (AppUI.dueAtWheelsControls) {
      values.repeatTime = AppUI.dueAtWheelsControls.read();
      values.deadlineEnabled = AppUI.createDeadlineEnabled;
    }
    const taskId = Game.addTask(
      title,
      W.list.value === "fun" ? null : W.diff.value,
      repeat,
      values.deadline || "",
      W.list.value,
      Number(W.timeLimit.value)
    );
    if (isRepeatingRepeat(repeat)) {
      Game.editTask(taskId, values);
    }
    if (repeat === "weekly") {
      if (AppUI.resetSection) Game.editTask(taskId, { resetRule: AppUI.resetSection.read() });
      if (!AppUI.createDeadlineEnabled) {
        Game.editTask(taskId, { deadlineRule: null });
      } else if (AppUI.deadlineKind === "offset" && AppUI.deadlineOffsetWrap.readOffsetMs) {
        const ms = AppUI.deadlineOffsetWrap.readOffsetMs();
        Game.editTask(taskId, { deadlineRule: ms > 0 ? { kind: "offset", ms } : null });
      } else if (AppUI.dueAtWheelsControls) {
        const weekdays = values.repeatWeekdays || [1];
        const minutes = AppUI.dueAtWheelsControls.read();
        const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
        const mm = String(minutes % 60).padStart(2, "0");
        Game.editTask(taskId, { deadlineRule: { kind: "fixed", slots: weekdays.map((weekday) => ({ weekday, time: `${hh}:${mm}` })) } });
      }
    }
    AppUI.els.taskInput.value = "";
    updateCreateFormMode();
    AppUI.els.taskInput.focus();
  });
}

export {  SCHEDULE_BUILDERS, buildCreateOffsetWheels, buildRuleSection, syncCreateWeeklyWheels, buildScheduleControls, customSchedule, deadlineSchedule, initForm, monthlySchedule, scheduleShowsTimeOfDay, updateCreateFormMode, weekdayToggleGrid, weeklySchedule  };
