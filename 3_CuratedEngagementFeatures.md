# Features to implement in TODO App

Curated from 2_EngagemetFeatures.md
---

#### Currency
- XP
  - earned from completing task
  - can not be spend
  - unlocks new tiles and items in the shop (which are teased before)
- Coins
  - earned from completing task
  - spent on new items and interaction with items
- Gems
  - randomly earned from completing tasks, can be bought with coins (but expensive)
  - spent on special items, streak freeze, ...
- Chests
  - earned as daily reward for first completed task
  - contains random coins, gems, items
  - opens after 12h

#### Task 
- Can be created by user
- User can select difficulty too easy, easy, medium, hard
- User can select a deadline in hours or as a date
- Option for sub-tasks to break down larger tasks (but not further nested)
- Option to set a time limit for task. If the user finishes the task within the time after marking it as "task started", the user gets more rewards.
- Task can be chained, to promote real life habit building. If tasks in a streak are solved right after another, give x1.2 bonus per task
- Option for autoplay tasks, that enable a task after another task has been done. This is a convenience, eg. after "wash clothes" the user could set up the autoplay task "hang clothes".
- Option to set preferred times for task finish. Give small bonus if task was finished during this time.
- Option for repeating task: user can select when a task returns
  - Daily, weekly, monthly
  - Repetitive tasks display a streak, how many times in a row the task was completed before deadline or repetition
  - "Certificate of Awesomeness" for completing streak milestones, that can be placed in the room. Longer streaks update the one certificate belonging to the task.
    - More fancy visuals for longer streaks
    - If a streak is lost, the visuals become more bland, but you never lose it completely
- Tasks give a coin reward when completed. "Too easy" gives no reward, higher difficulty -> higher reward.
  - Random multiplier 1x-1.3x
  - Streak bonus: after day 3: 1.1x for every additional day until day 12 (1.9x)
  - Random additional gems or item reward on medium and hard.
  - Randomly declare in advance that a task will reward additional gems/item
  - User has option to rate difficulty after completion
  - Very satisfying animation and sound on completion, confetti, banner, fanfare, reward trickeling into coin/gem inventory. It should be fun but not startling.
- If streak becomes long without the user reporting it as difficult, suggest reducing its difficulty after completion
- Sort tasks, always show some easy medium and hard tasks, so the user can easly select one fitting their current energy level. Prioritize tasks that are due soon. Manual override with sticky pin.


#### Milestones/Quests
- Daily task completions: give rewards after 5, 10, 15, 25 completed tasks. Indicate progress prominently
- Weekly task completion: give rewards after 50, 100, 150, 250 completed tasks
- Limited time boost: for 1h increase task completion rewards. Start randomly (consider asking user for times where they can not complete tasks and don't start it there).
- Could be implemented as clocks integrated into the room (clocks could be bought?)
- Very satisfying animation on completion
- Eg. "3/5 lamps collected"


### Statistics
- Total value of room/number of items/total completed tasks indicators
- Week/Month in review showing completed tasks and room evolution

#### Items
- Can be bought in the store for coins or gems
- Some items take time to completely appear in the room, creating anticipation
- Stay permanently (after app restart) expect for seasonal items
- Moving big things costs coins or needs a task to be completed

#### Skills
- Can be bought for gems
- Eg. "send notification when pet is there", "send notification when limited time boost has started"


#### Streak freeze
- protects a streak for a day
- Can be bought with gems to protect one streak, all streaks or all streaks for a user specified time (eg. for when the user is on vacation)
  - Notification when multi day freeze is over
- Option to automaticly freeze a streak if it would have been lost 

#### Notifications
- Ask user whats the maximum amount of notifications they want per day. Option for flexible limit for important streaks.
- When tasks are due soon
- When a streak is in danger (except for daily tasks)
- When a special event started (but not always, sometimes just set the notification number on the app, be transparent about this, so the user checks the app on their own). Sometimes leave out what has happened to increase curiosity.
- Encouragements "You are doing great", "Just 3 tasks left for ..."
- When a delayed event has completed (eg. chest). Sometimes don't mention what has happened in the notification to increase curiosity.
- Inactivity: Day 1, 3, 7, 14
- Always have to be positive and welcoming. Completing tasks in real life is already overwhelming

#### Companion
- Eg. a cat
- Very cute, can be pet/interacted
- Can be customized, eg collar
- Needs some care, can be completed by coins or completing tasks
  - Eg "go for a walk" requires you to finish a task. "Feed" needs coins.
- Gives 2x bonus for one task if the user hasn't done much recently
- Gives supportive messages
- Can cause cute trouble in the room that needs more care (eg knocking over plant)
- Can help with things in the room that need care, but struggles with it

#### Boost
- User can buy reward boost for gems in the shop, to eg. motivate them for a productive weekend

#### Photo mode
- Photo/video mode, fullscreen and no UI, so that users can share nice pictures/videos of their room

#### Gifts
- Users can buy (random) gifts in the shop, that they send to friends (sender can select difficulty)
- On receiver side it gets attached to a task and can only be opened after finishing the task
- Implementation difficult without a server, could be done with code sharing, hash checking, keeping lists of what has been bought and received.

#### Events
- Eg neighbours cat could visit
  - Just as cute as Companion
  - Brings 1.5x reward bonus for 1h
  - visits more likely after a task has been completed
- Seasonal items
  - disappear after season
- Partially rotating items in shop? Increases engagement, but is annoying. 

#### First task of the day
- Streak:
  - Day 1-2: coins
  - Day 2: coin
  - Day 3-6: 2.5x coins + chance for gem
  - Day 7+: 3x coins + chance for gem


#### Small achievements
- Eg.:
  - **Task Master:** Complete X tasks
  - **Streak Champion:** Maintain X-day streak
  - **Early Bird:** Complete tasks before noon
  - **Night Owl:** Complete tasks after 8 PM
  - **Weekend Warrior:** Complete tasks on weekends
  - **Perfectionist:** 100% task completion rate for a week
  - **Collector:** Own X decorations
  - **Redecorator:** Move items around X times
- No reward, just shown somewhere

#### Room
- Items can be placed in a virtual room to decorate it
- Has treasure room showing coins, gems, chest
- Can be redecorated
- Companion walks around
- Needs (very little) care

#### Transparency
- Psychological mechanics that can be used to improve real life task completion should be taught
  - Eg. habit building or breaking down big tasks

#### Design goals
- Friction reduction: minimal clicking for actions and automation to avoid unnecessary clicking


#### Onboarding
- Short tutorial
- Ask if all features should be shown right away or if tutorial should show one per day to avoid overwhelming






---

*Document Status: Draft*
*Author: Human*
