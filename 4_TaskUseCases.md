# Task Use Cases

A catalog of concrete tasks, grouped by life domain, and the features each one needs from the app. Written task-first (not feature-first): every entry starts from a real task and derives its requirements. Features the app does **not yet** cover are marked **[gap]**.

Legend:
- **Repeat** — recurrence pattern needed
- **Deadline** — whether the task needs a hard deadline, and whether the urgency display (green "x left" / red overdue) should be on or off
- **Availability** — when the task should appear/be doable at all
- **Extras** — subtasks, chaining, time limit, rewards, etc.

---

## Household

### Take out the trash
- Repeat: weekly (on collection day)
- Deadline: on — trash is picked up at a fixed time (e.g. 7:00), missing it means a full bin for a week
- Availability: **[gap]** should only appear ~2 days before pickup; taking it out 6 days early is pointless, and after pickup it should disappear until next cycle
- Extras: streak matters (empty bin every week)

### Change bed sheets
- Repeat: every 2 weeks
- Deadline: off — no external consequence, purely routine
- Availability: **[gap]** flexible window ("due sometime this weekend") rather than an exact time
- Extras: completion-anytime-in-window counting, not a fixed clock

### Water the plants
- Repeat: custom interval (e.g. every 3 days)
- Deadline: off
- Availability: **[gap]** plant-dependent; different plants need different intervals → needs multiple separate tasks or per-task interval presets
- Extras: **[gap]** seasonal adjustment (plants need less water in winter)

### Vacuum / clean the bathroom
- Repeat: weekly
- Deadline: off — but **[gap]** a gentle "overdue since x days" nudge is wanted without red urgency styling
- Extras: **[gap]** assignable to different household members (whoever does it checks it off; shared task state)

### Run the dishwasher / empty it
- Repeat: daily-ish, but really event-driven
- Deadline: off
- Availability: **[gap]** "start when full, empty 2h later" → a two-step chain with a time gap between steps (chaining exists, but the second step should auto-appear after a delay, not immediately)

### Grocery shopping
- Repeat: weekly or when needed
- Deadline: off
- Extras: subtasks as the shopping list (milk, bread, ...); **[gap]** subtasks that don't reset on repeat (list template that comes back every week, check off items as bought)
- Availability: **[gap]** location-based reminder ("when near the store") — out of scope for now, noted for completeness

### Sort the mail / paperwork pile
- Repeat: monthly
- Deadline: off
- Extras: **[gap]** "snooze" — if not done this month, roll to next month without breaking a streak (routine tasks shouldn't punish)

### Defrost the freezer, descale the kettle, wash the curtains
- Repeat: every N months (3–6)
- Deadline: off
- Availability: **[gap]** monthly repeat with a flexible window ("do it sometime in March") — current monthly repeat is a fixed weekday-of-month, not a window

## Health & Fitness

### Take medication (morning/evening)
- Repeat: daily, fixed times
- Deadline: on — timing is health-critical; overdue must be visible and red
- Availability: should appear at the time, not midnight
- Extras: **[gap]** time-of-day grouping (morning/evening batches); missed dose escalation (if unchecked by noon, surface prominently)

### Brush teeth / floss
- Repeat: daily (floss maybe every other day)
- Deadline: off — habit building, not urgency
- Extras: streak is the main motivator; **[gap]** twice-a-day tasks (two checkmarks per day for one task)

### Go for a run / gym session
- Repeat: 3x per week
- Deadline: off
- Availability: **[gap]** "N times per period" repeat — complete any 3 days out of 7, not fixed weekdays; the week counter resets Monday
- Extras: time limit (track session duration), XP as the reward

### Drink enough water
- Repeat: multiple times a day (e.g. every 3h)
- Deadline: off
- Availability: **[gap]** "N times per day" repeat with a progress ring (2/8 glasses) instead of one checkbox
- Extras: **[gap]** tiny rewards per check-in — too small for full task rewards

### 10,000 steps
- Repeat: daily
- Deadline: off
- Extras: **[gap]** numeric/counter tasks (enter today's step count; auto-complete at goal)

### Doctor/dentist appointment
- Repeat: none (or every 6 months for checkups)
- Deadline: on — fixed date and time
- Availability: **[gap]** appears a few days before; **[gap]** needs a "time of day" deadline display, not just "x left"
- Extras: **[gap]** link to calendar / notification at a specific hour

### Stretch break (office workers)
- Repeat: every 2h during work hours
- Deadline: off
- Availability: **[gap]** active-hours-only repeat (8:00–18:00, not at night); **[gap]** auto-reset even if not done (missed break just lapses, no overdue pile-up)

### Sleep before 23:00
- Repeat: daily
- Deadline: on (soft) — the "deadline" is the target bedtime
- Extras: **[gap]** check-in style (did I do it?) rather than a to-do; morning review ("did you sleep by 23:00 yesterday?")

## Work & Study

### Finish report by Friday 15:00
- Repeat: none
- Deadline: on — hard external deadline, red overdue justified
- Availability: **[gap]** start-date / "becomes available on" so it doesn't clutter the list all week
- Extras: subtasks (gather data → draft → review → send); chaining (review can't start before draft done — covered); time limit per work session (pomodoro)

### Daily standup prep
- Repeat: daily, workdays only
- Deadline: on (soft) — must be done before the standup time
- Availability: **[gap]** workday-only repeat (Mon–Fri) exists via weekly weekdays, but combined with "every workday + skip holidays" is a **[gap]**
- Extras: small fixed reward, low friction

### Study 30 minutes of Spanish
- Repeat: daily
- Deadline: off
- Extras: time limit (30 min timer as the core mechanic, not just a cap); streak + XP; **[gap]** session-based tracking (start/stop, total hours this week)

### Review flashcards
- Repeat: custom interval that grows (1d → 3d → 7d → 14d)
- Deadline: off
- Availability: **[gap]** spaced repetition / adaptive interval — next occurrence depends on how well it went, not a fixed schedule
- Extras: **[gap]** "again/hard/easy" rating on completion changing the next interval

### Submit tax declaration
- Repeat: yearly (fixed legal deadline, e.g. 31 July)
- Deadline: on — hard, externally enforced
- Availability: **[gap]** yearly repeat; **[gap]** long lead time (show 4 weeks before, not 6 months)
- Extras: many subtasks, some dependent (chaining covered)

### Weekly review (GTD-style: inbox zero, plan next week)
- Repeat: weekly (e.g. Sunday evening)
- Deadline: off — but tied to the week rollover: **[gap]** if skipped, it should roll into the new week rather than show overdue forever
- Extras: checklist subtasks

### Respond to emails
- Repeat: daily
- Deadline: off
- Availability: **[gap]** appears only during work hours
- Extras: **[gap]** "done when inbox is at 0" — a condition, not a checkbox

## Personal Admin & Finance

### Pay rent
- Repeat: monthly (1st of month)
- Deadline: on — late payment has real consequences
- Availability: **[gap]** should appear ~3 days before the 1st, not all month
- Extras: **[gap]** fixed-date monthly repeat ("1st of every month") — current monthly repeat is weekday-based (first Monday etc.), not date-based

### Check bank statements for weird charges
- Repeat: monthly
- Deadline: off
- Extras: low reward, low friction

### Cancel subscription before renewal
- Repeat: none
- Deadline: on — the renewal date is a real deadline
- Availability: **[gap]** "snooze until" (hide until 2 weeks before renewal)
- Extras: **[gap]** after completion: task should be fully done forever, not reset — covered by repeat "none", but **[gap]** an "archived/completed history" view to find it again later

### Renew passport / driver's license
- Repeat: yearly or multi-year
- Deadline: on
- Availability: **[gap]** multi-year repeat (every 5 years); **[gap]** long-lead visibility
- Extras: subtasks (photos, form, appointment)

### Back up the computer
- Repeat: monthly
- Deadline: off
- Extras: **[gap]** "verify last backup" as an automatic follow-up subtask a day later

## Social & Relationships

### Call mom
- Repeat: weekly
- Deadline: off — guilt-inducing red counters are exactly wrong here
- Availability: **[gap]** flexible weekly window ("call sometime this week") with a soft end-of-week nudge
- Extras: **[gap]** rotating list of people (call a different family member each week)

### Plan date night
- Repeat: monthly
- Deadline: off
- Availability: **[gap]** "by end of month" flexible window
- Extras: subtasks (book restaurant, arrange babysitter)

### Reply to friend's message
- Repeat: none
- Deadline: soft — **[gap]** "respond within 2 days" style deadline that decays in urgency rather than going red
- Extras: fast completion, tiny reward

### Send birthday wishes
- Repeat: yearly
- Deadline: on (soft) — the day itself
- Availability: **[gap]** yearly repeat with a fixed date; **[gap]** reminder at a specific hour (9:00), and **[gap]** advance prep task ("buy gift") 2 weeks before
- Extras: **[gap]** contact/event data as task metadata

## Creative & Hobbies

### Practice guitar 20 minutes
- Repeat: daily
- Deadline: off
- Extras: time limit as the mechanic (20 min timer); streak; **[gap]** practice log / notes per completion

### Work on side project
- Repeat: weekly (e.g. 2 evenings)
- Deadline: off
- Availability: **[gap]** "N sessions per week" flexible repeat
- Extras: **[gap]** long-running project view — a parent "project" that tracks total sessions/progress across months, not just this week's recurrence

### Read 20 pages
- Repeat: daily
- Deadline: off
- Extras: **[gap]** counter-style progress (pages read this week); book finishes → task auto-completes/archives

### Tidy the hobby corner
- Repeat: every 3 weeks
- Deadline: off
- Extras: **[gap]** "done well enough" tolerance — the app should accept 80% done without punishing

## Digital Hygiene

### Clean up email inbox
- Repeat: weekly
- Deadline: off
- Extras: **[gap]** numeric goal (inbox count below 50)

### Update phone/apps
- Repeat: monthly
- Deadline: off
- Extras: tiny reward; **[gap]** some tasks are "5-minute tasks" — a quick-task category with reduced friction and reward

### Review privacy settings / passwords
- Repeat: every 6 months
- Deadline: off
- Availability: **[gap]** half-year repeat

### Back up photos
- Repeat: monthly
- Deadline: off
- Extras: **[gap]** conditional skip ("if auto-backup is on, auto-complete")

## Family & Pets

### Walk the dog
- Repeat: multiple times daily
- Deadline: off
- Availability: **[gap]** "N times per day" repeat with per-day counter
- Extras: **[gap]** shared check-off between household members

### Feed the cat (morning/evening)
- Repeat: daily, two fixed times
- Deadline: on (soft) — health of the pet; two separate time-of-day instances
- Availability: appear at their time of day
- Extras: **[gap]** per-time-of-day checkmarks on one task

### Kids' school forms / permission slips
- Repeat: none, event-driven
- Deadline: on — school's due date
- Availability: **[gap]** appears when received (manual entry), deadline often "tomorrow morning" → **[gap]** quick-add preset with short deadline
- Extras: **[gap]** photo attachment (photo of the form)

### Schedule vet appointment
- Repeat: yearly-ish
- Deadline: on (soft) — before vaccine expires
- Availability: **[gap]** "due by" date with lead time
- Extras: subtasks (find slot, book, put in calendar)

## Seasonal & Environmental

### Switch summer/winter tires
- Repeat: twice a year (fixed-ish windows: Oct / Apr)
- Deadline: on (soft) — weather-dependent
- Availability: **[gap]** seasonal window ("do it during October") instead of a fixed date; **[gap]** weather-aware suggestion ("cold nights coming this week")
- Extras: **[gap]** twice-a-year repeat pattern

### Prep garden for winter
- Repeat: yearly
- Deadline: off
- Availability: **[gap]** seasonal window
- Extras: many subtasks spread over weeks; **[gap]** a task that spans multiple days (partial completion)

### Decorate for holidays
- Repeat: yearly
- Deadline: off
- Availability: **[gap]** appears at a fixed season

### Service the bike
- Repeat: every 6 months or event-driven ("after winter")
- Deadline: off
- Extras: **[gap]** event-triggered creation ("chain is rusty") — quick capture that later gets a repeat assigned

---

## Cross-cutting requirements derived from the tasks above

These are not features to build now — they are the patterns that showed up repeatedly, to inform prioritization:

1. **Availability windows / lead time** — by far the most common gap: tasks should appear N days before they become relevant and hide again after (trash, rent, appointments, renewals, birthdays). Includes "becomes available on" start dates and "snooze until".
2. **Flexible quota repeats** — "N times per day/week/period" (runs, dog walks, water, side-project sessions) instead of fixed clock times.
3. **Windows instead of instants** — "sometime this weekend", "during October", "by end of month" — completion counts whenever done inside the window; no red overdue.
4. **Date-based and long-period repeats** — "1st of month", yearly, multi-year; the current monthly repeat is weekday-based only.
5. **Per-time-of-day instances** — morning/evening medication or feeding as one task with two checkmarks.
6. **Soft deadline decay** — between "deadline on" and "deadline off": a gentle "overdue since x days" without red styling (the new neutral reset label is a first step in this direction).
7. **Delayed chain steps** — step B appears hours after step A (dishwasher), not immediately.
8. **List-template subtasks** — subtasks that reset with the repeat (grocery list) vs. subtasks that persist.
9. **Projects / long-running parents** — a recurring session that accumulates into something bigger (side project, practice log, book).
10. **Quick capture with presets** — fast entry for tiny/urgent one-offs (school form due tomorrow).
