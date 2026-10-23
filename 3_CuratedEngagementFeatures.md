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
  

#### Skills
- Can be bought for gems
- Eg. "send notification when pet is there", "send notification when limited time boost has started"


#### Streak freeze
- protects a streak for a day
- Can be bought with gems to protect one streak, all streaks or all streaks for a user specified time (eg. for when the user is on vacation)
  - Notification when multi day freeze is over
- Option to automaticly freeze a streak if it would have been lost 











---

### 📱 C. Feed & Attention Architecture

#### 18. Task Feed with Smart Ordering
- **Implementation:** Intelligent task list ordering
- **Mechanics:**
  - "Smart Sort" mode: show a mix of easy and more difficult tasks. Prioritize tasks that are due soon
  - Manual override by making a task sticky
- **Psychology:** Reduces decision fatigue

#### 20. Autoplay for Tasks
- **Implementation:** "Chain Mode" for tasks
- **Mechanics:**
  - Enable "Chain Mode" for tasks with same tag or by manual selection for repeating tasks
  - Completing one automatically loads next similar task
- **Psychology:** Removes friction between tasks

---

### 🔔 D. Notifications & Re-Engagement

#### 21. Habit-Window Timing
- **Implementation:** Smart notification scheduling
- **Mechanics:**
  - Sends reminders when tasks are soon due, but has to avoid pestering
  - Encouraging: "You're doing great! 3 tasks left!"
  - Urgent: "Your streak is about to expire!"
  - Curiosity: "Something new in your room..."

#### Reengagement ladder
- **Implementation:** Mascot character notifications
- **Mechanics:**
  - Room has a pet/character that reacts to user behavior
  - "I hope you are doing alright. If you have the energy, I have a small and easy task for you." with 2x reward
  - If long absence: "I miss you! How are you doing?" The app has to care about the wellbeing of the user
  - **Important:** Keep it light and cute, not shaming
- **Psychology:** Emotional connection drives return

#### 24. Loss-Warning Pushes
- **Implementation:** Urgent alerts for streak risk
- **Mechanics:**
  - "Your 15-day streak expires in 2 hours!"
  - "Complete 1 task to save your streak!"
  - Only send when streak is genuinely at risk
  - Limit to 1 per day to avoid annoyance

#### 25. Red Badges & Unread Counts
- **Implementation:** Visual indicators
- **Mechanics:**
  - Red badge on app icon for rare positive events
- **Psychology:** Creates curiosity and urgency

#### 26. Boosts
- **Implementation:** Time-limited opportunities
- **Mechanics:**
  - User can use gems to buy XP boosts eg for the weekend, to motivate for a productive weekend.

#### 27. Curiosity-Gap Messages
- **Implementation:** Partial information notifications
- **Mechanics:**
  - "You unlocked something special..."
  - "Your room has a surprise waiting!"
  - "Check what you earned overnight!" -> Maybe user can buy a plant as a seed, without knowing what it will grow into?
- **Psychology:** Need to open app to satisfy curiosity

---

### 👥 E. Social Mechanics

#### 29. Photo mode
- **Implementation:** Reduce UI to make nice screenshots
- **Mechanics:**
  - Ability to share new amazing additions to the room
- **Psychology:** Social validation

#### 32. Reciprocity Pressure
- **Implementation:** Gift system
- **Mechanics:**
  - Send decorations to friends
  - Receive gifts that must be "unwrapped" (opens after completing task)
  - "Gift back" encouragement
- **Implementation:** Difficult without a server but maybe possible with codes and hash verification
- **Psychology:** Obligation to reciprocate/complete task to open gift

#### 35. Parasocial Presence
- **Implementation:** Room character/mascot
- **Mechanics:**
  - Character lives in the room
  - Reacts to user actions (happy when tasks completed, sad when missed)
  - Can be customized (different pets/characters)
  - Has own "happiness" meter affected by user behavior
  - Randomness: eg. a cat that sometimes visits and visits more likely if the user is doing well
- **Psychology:** Emotional attachment to app

---

### ⏰ F. Scarcity, Urgency & Appointment Mechanics

#### 36. Ephemeral Content
- **Implementation:** Limited-time decorations
- **Mechanics:**
  - Seasonal items (Halloween, Christmas, etc.), disappear after season as a currency sink
  - Partially rotating shop inventory (changes weekly)
- **Psychology:** Urgency to acquire before gone

#### 37. Daily Task Rewards
- **Implementation:** First task of the day
- **Mechanics:**
  - Day 1: 10 coins
  - Day 3: 25 coins + chance for gem
  - Day 7: 30 coins + chance for gem
- **Visual:** Calendar in room showing login streak

#### 38. Timed Events
- **Implementation:** Allow user to set prefered times for tasks
- **Mechanics:**
  - Give small reward bonus if finished during this time

#### 39. Countdown Timers
- **Implementation:** Visual countdowns
- **Mechanics:**
  - Event end countdown
  - Sale end countdown
  - Construction completion countdown

---

### 🎮 G. Gamification Layer

#### 42. Badges & Achievements
- **Implementation:** Comprehensive achievement system
- **Categories:**
  - **Task Master:** Complete X tasks
  - **Streak Champion:** Maintain X-day streak
  - **Early Bird:** Complete tasks before noon
  - **Night Owl:** Complete tasks after 8 PM
  - **Weekend Warrior:** Complete tasks on weekends
  - **Perfectionist:** 100% task completion rate for a week
  - **Collector:** Own X decorations
  - **Designer:** Customize room X times

#### 45. Avatar & Pet System
- **Implementation:** Room companion
- **Mechanics:**
  - Adopt a pet that lives in your room
  - Pet needs "care" (feed, play) by completing tasks/spending coins from tasks. Eg "go for a walk" requires you to finish a task. "Feed" needs coins.
  - Pet grows and evolves with user's streak
- **Psychology:** Moral obligation to care for pet

#### 46. Identity Investment
- **Implementation:** Room as self-expression
- **Mechanics:**
  - Room themes (modern, fantasy, nature, etc.)
  - "Room Tour" feature to show friends. High resolution picture/video of room.
- **Psychology:** Room becomes part of user's identity

---

### ⚙️ H. Friction & Ease Engineering

#### 47. Radical Friction Reduction
- **Mechanics:**
  - No complicated clicking to complete actions
  - Automation of actions
- **Psychology:** Make actions effortless

---

### 💖 I. Emotional & Parasocial Hooks

#### 51. Internal-Trigger Capture
- **Implementation:** Attach to emotions
- **Mechanics:**
  - "Feeling overwhelmed? Break tasks down!"
  - "Bored? Complete a quick task for a reward!"
  - ...
- **Psychology:** App becomes coping mechanism

---

## Notification Strategy
Ask user how many notifications they would want per day. Suggest to reduce if user ignores them.

### Notification Types

#### 1. Routine Reminders
- **Frequency:** 1-2 per day max
- **Timing:** When due, or if user hasnt done anything on that day

#### 2. Streak Warnings
- **Trigger:** Streak at risk (2-4 hours before reset)
- **Content:** Urgent but positive
- **Limit:** 1 per day, but can be more if it is a long streak

#### 3. Reward Notifications
- **Trigger:** New reward available
- **Content:** "Your chest is ready!"
- **Frequency:** As earned

#### 5. Re-engagement
- **Trigger:** User inactive
- **Frequency:** Day 1, 3, 7, 14

---

## Onboarding Flow

### Phase 1: Immediate Value (Day 1)
1. **Welcome screen** with beautiful room visualization, to show a goal
2. **Quick tutorial:** Add first task
3. **Immediate reward:** Earn first decoration
4. **Room customization:** Place first item
5. **Streak started:** Day 1 complete
6. Ask user if they want all options at once (skip Phase 2) or start slow
   - "You did great! Come back tomorrow, to learn how to set up repeating task!"

### Phase 2: Habit Formation (Days 2-7)
1. **Daily reminders** to return
2. **Introduce new features** gradually:
   - Day 2: Repetitive tasks
   - Day 3: Room upgrades
   - Day 4: Achievements
   - Day 5: Social features (if enabled)
   - Day 6: Limited-time event
   - Day 7: Weekly review
3. **Celebrate first streak** milestone

### Phase 3: Deep Engagement (Days 8-30)
1. **Unlock advanced features:**
   - Multiple rooms
   - Premium decorations
   - Advanced analytics
2. **Introduce scarcity:** Limited-time items
4. **Celebrate 30-day** milestone with special reward

---

## Ethical Considerations

### Do's
✅ Use positive reinforcement primarily
✅ Make features optional where possible
✅ Respect user boundaries (quiet hours, etc.)
✅ Be transparent about odds and mechanics
✅ Allow users to disable addictive features
✅ Be transparent about psychological techniques, eg. why daily return is important for real life habit forming

### Don'ts
❌ Don't use guilt or shame
❌ Don't hide important information
❌ Don't spam notifications



---

## Rejected  Ideas
### Paid features
- Rejection reason: The app will be completely free

### Demotion
- Feature: Room degrades significantly if neglected, Character looks sad
- Rejection reason: The app is for users that struggle with achieving their goals. Hard consequences can leave the user feel very unhappy with their life. Not completing tasks already has real life consequences and demotion techniques should be very limited in the app and should be easy to recover from.

### Artifical Friction
- Feature: Tasks cost energy/stamina, you get 1 energy/stamin per hour.
- Rejection reason: Completing a task should be as easy as possible, as its already difficult to complete the real life task. Making it cost something is completely wrong.

### User tracking
- Feature: track habits of the user to eg. optimize notifications
- Rejection reason: Too complicated and not worth it.

### FOMO notifications
- Feature: "Special decoration available for 24 hours only!", ...
- Rejection reason: Too trashy, the app should feel like a positive place.

### Social features
- Feature: anything that connects users
- Rejection reason: Too complicated. There will be no server for data exchange, the app is completely local. 

### Artifical scarcity
- Feature: Item x can only be owned 5 times
- Rejection reason: One problem of the app will be inflation. Making items scarce does not help with that. Currency sinks are needed.

### Login
- Rejection reason: The app is completely local. There will be no login, user profile or data saved on a server.

### AI integration
- Rejection reason: too complicated


---


## Conclusion

This document provides a brainstormed list of engagement-maximizing features which are candidates for our TODO app. The key is to create a happy place that the user likes and comes back to although it is a list of tasks that cost real life energy to complete. Beyond this the app has to motivate the user to complete tasks through the use of psychological techniques.

**Core Philosophy:** Make productivity enjoyable, not obligatory. The room visualization serves as both a reward and a motivation - users should look forward to returning to their beautiful, evolving space.


---

*Document Status: Draft*
*Last Updated: [Date]*
*Author: Vibe Code Agent, refined by Human*
*Based on: [Addiction Techniques Document](how-apps-engineer-addiction-techniques-science-books-&-the-duolingo-case.md)*
