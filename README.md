# Smart College Timetable Generator (Greedy and Backtracking)

## How to run
1. Keep `index.html`, `style.css` and `script.js` in one folder.
2. Double-click `index.html`.

## How to use
1. **Step 1:** type college, program/field and choose semester (labels only).
2. **Step 2:** add subjects with teacher, lectures per week and labs per week.
3. **Step 3:** add lecture rooms and lab rooms.
4. **Step 4:** add batches (for example A1, A2, A3).
5. **Step 5:** choose batch and algorithm, then click **Generate Timetable**.
   Use **Load Example Data** to fill a sample quickly and **Clear All Data** to start fresh.

## Files
- `index.html` - page structure (forms, dropdowns, empty boxes)
- `style.css` - colours and layout
- `script.js` - all logic (data, Greedy, Backtracking, validation, display)

## Rules used (function `canPlace`)
- A batch has only one class in a slot.
- A teacher teaches only one class in a slot (all batches together).
- A room is used by only one class in a slot.
- Two batches never have the same subject at the same time.
- A subject appears only once per day for a batch.
- Labs use lab rooms, lectures use lecture rooms (each class is one slot).
- Timetable: Monday to Friday, 6 periods per day, lunch after Period 3 (not a class slot).

## Input checks (function `checkInput`)
Before generating, the page warns if there is no subject, batch or room, if a batch needs more than 30 classes, if a subject has more than 5 classes, or if a teacher has more than 30 classes.

## Viva answers
**Greedy:** takes each class in order (labs first), checks all days, periods and rooms, and picks the day where the batch has the fewest classes. It never changes an earlier choice. If nothing is valid, it reports failure.

**Backtracking:** places a class, then tries the next one (recursion). If the next one cannot be placed, it removes the last class (`pop`) and tries another slot or room. It stops after 200000 attempts.

**Validation:** compares every pair of classes in the same slot and checks teacher, room, batch and subject clashes. It also checks the counts for every subject and the room types.

## Limits
Room capacity and teacher preferences are not considered. Each lab is one period. The result is the same every time for the same data.
