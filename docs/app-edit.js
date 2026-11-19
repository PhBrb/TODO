import * as Game from "./game.js";
import { buildScheduleControls, scheduleShowsTimeOfDay } from "./app-form.js";
import { AppUI } from "./app-state.js";
import { DIFFICULTY_OPTIONS, LIST_OPTIONS, REPEAT_OPTIONS, TIME_LIMIT_OPTIONS, buildSelect, createDueAtWheels, createFieldToggle, createWheel, labeledField, readScheduleValues, scheduleValuesFromTask } from "./app-util.js";
import { showToast } from "./app-ui.js";
import { render } from "./app-list.js";

const E = AppUI.edit;

// editing state lives in AppUI.edit (E)

function editingSubtaskOf(task) {
  if (E.subtaskKey == null || E.taskId != null) return null;
  const sep = E.subtaskKey.indexOf(":");
  const parentId = Number(E.subtaskKey.slice(0, sep));
  const subtaskId = Number(E.subtaskKey.slice(sep + 1));
  if (parentId !== task.id) return null;
  return task.subtasks.find((st) => st.id === subtaskId) || null;
}

function clearEditing() {
  E.taskId = null;
  E.subtaskKey = null;
  E.pending = null;
  E.active = null;
}

function editValues(input, controls) {
  return [input.value, ...controls.map((c) => c.value)];
}

function buildTitleInput(title) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "title-input";
  input.value = title;
  input.maxLength = 80;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (E.active) E.active.onSave(E.active.input.value);
    } else if (e.key === "Escape") {
      clearEditing();
      render();
    }
  });
  return input;
}

function buildEditControlsRow() {
  const row = document.createElement("div");
  row.className = "edit-controls";
  for (const control of E.active.controls) row.appendChild(control);
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Save";
  save.addEventListener("click", () => E.active.onSave(E.active.input.value));
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => {
    clearEditing();
    render();
  });
  row.appendChild(save);
  row.appendChild(cancel);
  return row;
}

function activateEdit(scope, input, controls, onSave) {
  E.active = { scope, input, controls, onSave, initial: editValues(input, controls) };
  E.pending = null;
}

function openSubtaskEdit(parent, subtask) {
  const diff = buildSelect(DIFFICULTY_OPTIONS, subtask.difficulty);
  clearEditing();
  E.subtaskKey = parent.id + ":" + subtask.id;
  E.pending = {
    kind: "subtask",
    controls: [diff],
    onSave: (title) => {
      clearEditing();
      Game.editSubtask(parent, subtask, title, diff.value);
    },
  };
  render();
}

let outsideEditDown = null;

const RATING_OPTIONS = [
  { label: "😫 Harder", value: "harder" },
  { label: "👌 As expected", value: "ok" },
  { label: "😊 Easier", value: "easier" },
];
const RATING_RING_RADIUS = 13;
const RATING_RING_CIRC = 2 * Math.PI * RATING_RING_RADIUS;

function buildRatingCloseButton(onClose) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "rating-close";
  btn.setAttribute("aria-label", "Close");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.classList.add("rating-ring");
  const bar = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bar.setAttribute("cx", "16");
  bar.setAttribute("cy", "16");
  bar.setAttribute("r", String(RATING_RING_RADIUS));
  bar.classList.add("rating-ring-bar");
  bar.style.strokeDasharray = String(RATING_RING_CIRC);
  svg.append(bar);
  const x = document.createElement("span");
  x.className = "rating-close-x";
  x.textContent = "×";
  btn.append(svg, x);
  btn.addEventListener("click", onClose);
  return { btn, bar };
}

function promptDifficultyRating(task) {
  if (task.repeat === "none") return;
  if (task.ratedDifficulty != null) return;
  const timeoutMs = Game.RATE_PROMPT_TIMEOUT;
  const panel = document.createElement("div");
  panel.className = "rating-panel";
  let dismissed = false;
  let timer = 0;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(timer);
    panel.remove();
  };
  const q = document.createElement("span");
  q.textContent = `"${task.title}" — how was it?`;
  panel.appendChild(q);
  for (const opt of RATING_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      task.ratedDifficulty = opt.value;
      dismiss();
      if (opt.value === "easier") {
        showToast("😄 Noted! You can edit the task's difficulty.");
      } else {
        showToast("Noted, thanks!");
      }
      Game.saveState();
      render();
    });
    panel.appendChild(btn);
  }
  const { btn: closeBtn, bar } = buildRatingCloseButton(dismiss);
  panel.appendChild(closeBtn);
  document.body.appendChild(panel);
  timer = setTimeout(dismiss, timeoutMs);
  bar.style.transition = `stroke-dashoffset ${timeoutMs}ms linear`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.strokeDashoffset = String(RATING_RING_CIRC);
  }));
}

function buildEditSelectors(task, listSel, diff, rep, scheduleArea, timeLimit) {
  const selectors = document.createElement("div");
  selectors.className = "edit-selectors";
  const mainRow = document.createElement("div");
  mainRow.className = "edit-selectors-row";
  mainRow.appendChild(labeledField("Type", [listSel.el]));
  mainRow.appendChild(labeledField("Difficulty", [diff.el]));
  mainRow.appendChild(labeledField("Repeat", [rep.el]));
  const timeRow = document.createElement("div");
  timeRow.className = "edit-selectors-row";
  timeRow.appendChild(scheduleArea.dueAtField);
  timeRow.appendChild(scheduleArea.deadlineSlot);
  const timeLimitRow = document.createElement("div");
  timeLimitRow.className = "edit-selectors-row";
  timeLimitRow.appendChild(labeledField("⏱️ Time limit", [timeLimit.el]));
  selectors.appendChild(mainRow);
  selectors.appendChild(scheduleArea.scheduleWrap);
  selectors.appendChild(timeRow);
  selectors.appendChild(timeLimitRow);
  return selectors;
}

function syncDeadlineSlot(scheduleArea) {
  const slot = scheduleArea.deadlineSlot;
  slot.innerHTML = "";
  const dl = scheduleArea.schedule && scheduleArea.schedule.el
    ? scheduleArea.schedule.el.querySelector(".deadline-field")
    : null;
  if (dl) {
    slot.appendChild(dl);
    slot.classList.remove("hidden");
  } else {
    slot.classList.add("hidden");
  }
}

// Editor for one schedule rule (deadline / reset / ignore).
function buildRuleEditor(label, rule, allowOffset) {
  const kindSel = document.createElement("select");
  const kinds = [
    ["none", "None"],
    ["fixed", "Fixed day(s) + time"],
  ];
  if (allowOffset) kinds.push(["offset", "Time after completion"]);
  for (const [v, l] of kinds) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = l;
    kindSel.appendChild(o);
  }
  kindSel.value = rule && rule.kind ? rule.kind : "none";

  const daysWrap = document.createElement("div");
  daysWrap.className = "rule-days";
  const selected = new Set(
    rule && rule.kind === "fixed" ? rule.slots.map((s) => s.weekday) : []
  );
  for (let d = 0; d < 7; d++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "rule-day" + (selected.has(d) ? " on" : "");
    b.textContent = Game.WEEKDAY_LABELS[d];
    b.addEventListener("click", () => {
      if (selected.has(d)) {
        selected.delete(d);
        b.classList.remove("on");
      } else {
        selected.add(d);
        b.classList.add("on");
      }
    });
    daysWrap.appendChild(b);
  }
  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.value =
    rule && rule.kind === "fixed" && rule.slots[0] ? rule.slots[0].time : "18:00";
  const fixedWrap = document.createElement("div");
  fixedWrap.className = "rule-fixed";
  fixedWrap.appendChild(daysWrap);
  fixedWrap.appendChild(timeInput);

  const offsetInput = document.createElement("input");
  offsetInput.type = "number";
  offsetInput.min = "1";
  offsetInput.step = "1";
  offsetInput.value = rule && rule.kind === "offset" ? String(rule.ms / 3600000) : "24";
  const offsetWrap = document.createElement("div");
  offsetWrap.className = "rule-offset";
  offsetWrap.appendChild(offsetInput);
  const offsetUnit = document.createElement("span");
  offsetUnit.textContent = "h after completion";
  offsetWrap.appendChild(offsetUnit);

  const controls = document.createElement("div");
  controls.className = "rule-controls";
  controls.appendChild(fixedWrap);
  controls.appendChild(offsetWrap);
  const syncKind = () => {
    const kind = kindSel.value;
    fixedWrap.classList.toggle("hidden", kind !== "fixed");
    offsetWrap.classList.toggle("hidden", kind !== "offset");
  };
  kindSel.addEventListener("change", syncKind);
  syncKind();

  const el = labeledField(label, [kindSel, controls]);
  el.classList.add("rule-editor");
  function read() {
    const kind = kindSel.value;
    if (kind === "none") return null;
    if (kind === "offset") {
      const h = Number(offsetInput.value);
      return Number.isFinite(h) && h > 0 ? { kind: "offset", ms: Math.round(h * 3600000) } : null;
    }
    const time = Game.normalizeTimeOfDay(timeInput.value) || "18:00";
    const slots = [...selected]
      .sort((a, b) => a - b)
      .map((weekday) => ({ weekday, time }));
    return slots.length ? { kind: "fixed", slots } : null;
  }
  return { el, read };
}

// Ignore editor, shown for weekly tasks. (Deadline/reset are defined by the
// weekday + time wheels controlled by the deadline toggle.)
function buildRulesEditor(task) {
  const wrap = document.createElement("div");
  wrap.className = "rules-editor";
  const title = document.createElement("div");
  title.className = "rules-title";
  title.textContent = "Ignore";
  wrap.appendChild(title);
  const ignore = buildRuleEditor("Ignore (reduces urgency)", task.ignoreRule, false);
  wrap.appendChild(ignore.el);
  return { el: wrap, ignore };
}

// For weekly tasks the deadline toggle hides/shows the weekday and time
// wheels; the wheels define the fixed day/time when the task resets.
function syncWeeklyWheels(scheduleArea) {
  const weekly = scheduleArea.repeat === "weekly";
  if (scheduleArea.deadlineToggle) {
    scheduleArea.deadlineToggle.classList.toggle("hidden", !weekly);
  }
  if (scheduleArea.rulesEditor) {
    scheduleArea.rulesEditor.el.classList.toggle("hidden", !weekly);
  }
  if (!weekly) return;
  const show = scheduleArea.deadlineEnabled;
  if (scheduleArea.schedule) scheduleArea.schedule.el.classList.toggle("hidden", !show);
  if (scheduleArea.dueAtField) scheduleArea.dueAtField.classList.toggle("hidden", !show);
}

function buildEditScheduleArea(task) {
  const scheduleValues = scheduleValuesFromTask(task);
  const scheduleWrap = document.createElement("div");
  scheduleWrap.className = "repeat-schedule edit-schedule";
  const deadlineSlot = document.createElement("div");
  deadlineSlot.className = "labeled-field deadline-slot hidden";
  const state = { scheduleValues, scheduleWrap, schedule: null, dueAt: null, dueAtWheelsWrap: null, dueAtField: null, deadlineSlot, deadlineEnabled: task.deadlineEnabled !== false, endOfDayBtn: document.createElement("button"), rulesEditor: null, deadlineToggle: null, repeat: task.repeat };
  state.schedule = buildScheduleControls(task.repeat, scheduleValues, true);
  scheduleWrap.appendChild(state.schedule.el);
  state.rulesEditor = buildRulesEditor(task);
  state.deadlineToggle = createFieldToggle(state.deadlineEnabled, (on) => {
    state.deadlineEnabled = on;
    syncWeeklyWheels(state);
  }, "📅 Deadline", "Show/hide the day & time wheels");
  scheduleWrap.insertBefore(state.deadlineToggle, state.schedule.el);
  scheduleWrap.appendChild(state.rulesEditor.el);
  syncDeadlineSlot(state);
  state.dueAtWheelsWrap = document.createElement("div");
  state.dueAtWheelsWrap.className = "due-at-wheels";
  state.dueAtField = labeledField("\ud83d\udd54 Due at", [state.dueAtWheelsWrap], true, state.endOfDayBtn);
  return state;
}

function refreshEditSchedule(task, edit) {
  const { listSel, rep, scheduleArea } = edit;
  const repeat = listSel.value === "fun" ? "none" : rep.value;
  scheduleArea.repeat = repeat;
  if (scheduleArea.dueAt) scheduleArea.scheduleValues.repeatTime = scheduleArea.dueAt.read();
  Object.assign(scheduleArea.scheduleValues, readScheduleValues(scheduleArea.schedule.read));
  scheduleArea.scheduleWrap.innerHTML = "";
  scheduleArea.schedule = buildScheduleControls(repeat, scheduleArea.scheduleValues, true);
  if (scheduleArea.deadlineToggle) scheduleArea.scheduleWrap.appendChild(scheduleArea.deadlineToggle);
  scheduleArea.scheduleWrap.appendChild(scheduleArea.schedule.el);
  if (scheduleArea.rulesEditor) scheduleArea.scheduleWrap.appendChild(scheduleArea.rulesEditor.el);
  syncDeadlineSlot(scheduleArea);
  scheduleArea.scheduleWrap.classList.toggle("hidden", scheduleArea.schedule.el.childElementCount === 0);
  const showDueAt = scheduleShowsTimeOfDay(repeat);
  scheduleArea.dueAtWheelsWrap.innerHTML = "";
  if (showDueAt) {
    scheduleArea.dueAt = createDueAtWheels(scheduleArea.scheduleValues.repeatTime, true);
    for (const el of scheduleArea.dueAt.els) scheduleArea.dueAtWheelsWrap.appendChild(el);
    const labelRow = scheduleArea.dueAtField.querySelector(".field-label-row");
    labelRow.querySelectorAll(".field-toggle-btn").forEach((b) => b.remove());
    if (repeat !== "weekly") {
      const toggle = createFieldToggle(scheduleArea.deadlineEnabled, (on) => {
        scheduleArea.deadlineEnabled = on;
        syncEditDueAtLabel(scheduleArea);
      }, "Deadline", "Toggle deadline urgency");
      labelRow.insertBefore(toggle, scheduleArea.endOfDayBtn);
    }
    scheduleArea.endOfDayBtn.replaceWith(scheduleArea.dueAt.endOfDayBtn);
    scheduleArea.endOfDayBtn = scheduleArea.dueAt.endOfDayBtn;
  } else {
    scheduleArea.dueAt = null;
  }
  scheduleArea.dueAtField.classList.toggle("hidden", !showDueAt);
  syncEditDueAtLabel(scheduleArea);
  syncWeeklyWheels(scheduleArea);
}

function syncEditDueAtLabel(scheduleArea) {
  const label = scheduleArea.dueAtField.querySelector(".field-label");
  if (label) {
    label.textContent =
      scheduleArea.repeat === "weekly"
        ? "🔁 Resets at"
        : scheduleArea.deadlineEnabled ? "🔔 Due at" : "🔔 Resets at";
  }
}

function updateEditWheelsEnabled(task, edit) {
  const isFun = edit.listSel.value === "fun";
  edit.diff.disabled = isFun || task.subtasks.length > 0;
  edit.rep.disabled = isFun;
  edit.diff.el.title = task.subtasks.length > 0
    ? "Difficulty is derived from the most difficult sub-task"
    : "";
  edit.rep.el.title = isFun ? "Fun tasks never repeat" : "";
}

function saveEditRow(task, edit) {
  const { listSel, rep, diff, timeLimit, scheduleArea } = edit;
  const isFun = listSel.value === "fun";
  const repeat = isFun ? "none" : rep.value;
  const updates = {
    title: edit.titleInput.value,
    repeat,
    list: listSel.value,
    timeLimit: Number(timeLimit.value),
    ...readScheduleValues(scheduleArea.schedule.read),
  };
  if (scheduleArea.dueAt) {
    updates.repeatTime = scheduleArea.dueAt.read();
    updates.deadlineEnabled = scheduleArea.deadlineEnabled;
  }
  if (repeat === "weekly") {
    // The weekday + time wheels define the fixed day/time when the task
    // resets; the same day/time is the deadline. Toggle off = no deadline.
    if (scheduleArea.deadlineEnabled && scheduleArea.dueAt) {
      const weekdays = readScheduleValues(scheduleArea.schedule.read).repeatWeekdays || [1];
      const minutes = scheduleArea.dueAt.read();
      const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
      const mm = String(minutes % 60).padStart(2, "0");
      const rule = { kind: "fixed", slots: weekdays.map((weekday) => ({ weekday, time: `${hh}:${mm}` })) };
      updates.resetRule = rule;
      updates.deadlineRule = rule;
    } else {
      updates.resetRule = null;
      updates.deadlineRule = null;
    }
  }
  if (scheduleArea.rulesEditor) {
    updates.ignoreRule = scheduleArea.rulesEditor.ignore.read();
  }
  if (!isFun) updates.difficulty = diff.value;
  clearEditing();
  Game.editTask(task.id, updates);
}

function openEditRow(task) {
  clearEditing();
  E.taskId = task.id;

  const edit = {
    listSel: createWheel(LIST_OPTIONS, task.list || "todo", "List", null, true),
    diff: createWheel(DIFFICULTY_OPTIONS, task.difficulty ?? "easy", "Difficulty", null, true),
    rep: createWheel(REPEAT_OPTIONS, task.repeat, "Repeat", null, true),
    timeLimit: createWheel(TIME_LIMIT_OPTIONS, task.timeLimit || 0, "Time limit", null, true),
    scheduleArea: null,
    titleInput: null,
  };
  edit.rep.el.title = task.list === "fun" ? "Fun tasks never repeat" : "";
  const onChange = () => {
    updateEditWheelsEnabled(task, edit);
    refreshEditSchedule(task, edit);
  };
  edit.listSel = createWheel(LIST_OPTIONS, task.list || "todo", "List", onChange, true);
  edit.rep = createWheel(REPEAT_OPTIONS, task.repeat, "Repeat", onChange, true);
  edit.scheduleArea = buildEditScheduleArea(task);

  const selectors = buildEditSelectors(task, edit.listSel, edit.diff, edit.rep, edit.scheduleArea, edit.timeLimit);

  updateEditWheelsEnabled(task, edit);
  refreshEditSchedule(task, edit);

  E.pending = {
    kind: "task",
    controls: [selectors],
    onSave: (title) => {
      edit.titleInput = { value: title };
      saveEditRow(task, edit);
    },
  };
  render();
}

export { RATING_OPTIONS, activateEdit, buildEditControlsRow, buildEditScheduleArea, buildEditSelectors, buildTitleInput, clearEditing, editValues, editingSubtaskOf, openEditRow, openSubtaskEdit, outsideEditDown, promptDifficultyRating, refreshEditSchedule, saveEditRow, syncDeadlineSlot, updateEditWheelsEnabled  };
