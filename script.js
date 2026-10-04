// ==============================================
// Timetable Generator - simple version
// The user types subjects, rooms and batches on the page.
// Greedy and Backtracking then make the timetable.
// ==============================================

// ----- 1. DATA (starts empty, filled from the page) -----
var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
var periodNames = ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5", "Period 6"];
var periodTimes = ["09:00-09:50", "09:50-10:40", "10:40-11:30", "12:00-12:50", "12:50-13:40", "13:40-14:30"];

var subjects = [];       // each: { name, teacher, lectures, labs }
var lectureRooms = [];   // list of room names
var labRooms = [];       // list of room names
var batches = [];        // list of batch names

// The timetable is a list of classes. One class looks like this:
// { batch: "A1", subject: "DAA", type: "Lecture", day: 0, period: 0, room: "LH-4-5" }
// day 0 = Monday ... 4 = Friday.  period 0 = Period 1 ... 5 = Period 6.

var result = null;   // the latest result is stored here

// ----- 2. SMALL HELPER FUNCTIONS -----
function getTeacher(subjectName) {
  for (var i = 0; i < subjects.length; i++) {
    if (subjects[i].name == subjectName) {
      return subjects[i].teacher;
    }
  }
}

function getRooms(type) {
  if (type == "Lab") {
    return labRooms;
  } else {
    return lectureRooms;
  }
}

// Classes that ONE batch needs per week (all subjects)
function classesPerBatch() {
  var total = 0;
  for (var i = 0; i < subjects.length; i++) {
    total = total + subjects[i].lectures + subjects[i].labs;
  }
  return total;
}

// Make the list of all classes that must be placed
function makeSessions() {
  var labs = [];
  var lectures = [];
  for (var s = 0; s < subjects.length; s++) {
    for (var b = 0; b < batches.length; b++) {
      for (var i = 0; i < subjects[s].labs; i++) {
        labs.push({ batch: batches[b], subject: subjects[s].name, type: "Lab" });
      }
      for (var j = 0; j < subjects[s].lectures; j++) {
        lectures.push({ batch: batches[b], subject: subjects[s].name, type: "Lecture" });
      }
    }
  }
  return labs.concat(lectures);   // labs first (they usually have fewer rooms)
}

// ----- 3. RULE CHECKER (used by both algorithms) -----
// Returns true if the class can be placed at this day, period and room.
function canPlace(schedule, session, day, period, room) {
  var teacher = getTeacher(session.subject);
  for (var i = 0; i < schedule.length; i++) {
    var c = schedule[i];
    if (c.day == day && c.period == period) {
      if (c.batch == session.batch) return false;            // batch already busy
      if (getTeacher(c.subject) == teacher) return false;    // teacher already busy
      if (c.room == room) return false;                      // room already used
      if (c.subject == session.subject) return false;       // same subject in two batches
    }
    if (c.batch == session.batch && c.subject == session.subject && c.day == day) {
      return false;                                          // same subject twice in one day
    }
  }
  return true;
}

function countOnDay(schedule, batch, day) {
  var count = 0;
  for (var i = 0; i < schedule.length; i++) {
    if (schedule[i].batch == batch && schedule[i].day == day) {
      count++;
    }
  }
  return count;
}

// ----- 4. GREEDY ALGORITHM -----
// For every class: check all valid places and pick the best one
// (the day where the batch has the fewest classes). Never undo.
function runGreedy() {
  var sessions = makeSessions();
  var schedule = [];
  var notPlaced = 0;

  for (var s = 0; s < sessions.length; s++) {
    var session = sessions[s];
    var rooms = getRooms(session.type);
    var best = null;
    var bestCount = 1000;

    for (var d = 0; d < 5; d++) {
      for (var p = 0; p < 6; p++) {
        for (var r = 0; r < rooms.length; r++) {
          if (canPlace(schedule, session, d, p, rooms[r])) {
            var count = countOnDay(schedule, session.batch, d);
            if (count < bestCount) {
              bestCount = count;
              best = { day: d, period: p, room: rooms[r] };
            }
          }
        }
      }
    }

    if (best == null) {
      notPlaced++;
    } else {
      schedule.push({ batch: session.batch, subject: session.subject, type: session.type,
                      day: best.day, period: best.period, room: best.room });
    }
  }

  var message = "";
  if (notPlaced > 0) {
    message = "Greedy could not place " + notPlaced + " class(es).";
  }
  return { schedule: schedule, message: message };
}

// ----- 5. BACKTRACKING ALGORITHM -----
var tries = 0;   // counts attempts so the program never runs forever

// Place class number "index". Then try the next class.
// If the next classes fail, remove this one (pop) and try another place.
function backtrack(sessions, index, schedule) {
  if (index == sessions.length) {
    return true;                       // all classes placed
  }
  tries++;
  if (tries > 200000) {
    return false;
  }

  var session = sessions[index];
  var rooms = getRooms(session.type);

  for (var d = 0; d < 5; d++) {
    for (var p = 0; p < 6; p++) {
      for (var r = 0; r < rooms.length; r++) {
        if (canPlace(schedule, session, d, p, rooms[r])) {
          schedule.push({ batch: session.batch, subject: session.subject, type: session.type,
                          day: d, period: p, room: rooms[r] });          // place
          if (backtrack(sessions, index + 1, schedule)) {
            return true;                                                 // success
          }
          schedule.pop();                                                // undo (backtrack)
        }
      }
    }
  }
  return false;
}

function runBacktracking() {
  var sessions = makeSessions();
  var schedule = [];
  tries = 0;
  var success = backtrack(sessions, 0, schedule);
  var message = "";
  if (success == false) {
    schedule = [];
    message = "Backtracking could not find a valid timetable.";
  }
  return { schedule: schedule, message: message };
}

// ----- 6. VALIDATION (checks the finished timetable) -----
function countClasses(schedule, batch, subject, type) {
  var count = 0;
  for (var i = 0; i < schedule.length; i++) {
    var c = schedule[i];
    if (c.batch == batch && c.subject == subject && c.type == type) {
      count++;
    }
  }
  return count;
}

function validate(schedule) {
  var problems = [];
  var teacherClashes = 0;
  var roomClashes = 0;
  var subjectClashes = 0;

  // compare every pair of classes at the same day and period
  for (var i = 0; i < schedule.length; i++) {
    for (var j = i + 1; j < schedule.length; j++) {
      var a = schedule[i];
      var b = schedule[j];
      if (a.day == b.day && a.period == b.period) {
        var when = days[a.day] + " " + periodNames[a.period];
        if (getTeacher(a.subject) == getTeacher(b.subject)) {
          teacherClashes++;
          problems.push("Teacher clash: " + getTeacher(a.subject) + " on " + when);
        }
        if (a.room == b.room) {
          roomClashes++;
          problems.push("Room clash: " + a.room + " on " + when);
        }
        if (a.subject == b.subject) {
          subjectClashes++;
          problems.push("Same subject " + a.subject + " in two batches on " + when);
        }
        if (a.batch == b.batch) {
          problems.push("Batch " + a.batch + " has two classes on " + when);
        }
      }
    }
  }

  // check room type of every class
  for (var k = 0; k < schedule.length; k++) {
    var rooms = getRooms(schedule[k].type);
    if (rooms.indexOf(schedule[k].room) == -1) {
      problems.push("Wrong room type for " + schedule[k].subject + " (" + schedule[k].batch + ")");
    }
  }

  // check weekly counts for each batch
  for (var x = 0; x < batches.length; x++) {
    var total = 0;
    for (var y = 0; y < subjects.length; y++) {
      var lec = countClasses(schedule, batches[x], subjects[y].name, "Lecture");
      var lab = countClasses(schedule, batches[x], subjects[y].name, "Lab");
      total = total + lec + lab;
      if (lec != subjects[y].lectures || lab != subjects[y].labs) {
        problems.push(batches[x] + " " + subjects[y].name + " has wrong lecture/lab count");
      }
    }
    if (total != classesPerBatch()) {
      problems.push("Batch " + batches[x] + " has " + total + " classes (need " + classesPerBatch() + ")");
    }
  }

  return { problems: problems, teacher: teacherClashes, room: roomClashes,
           subject: subjectClashes, valid: problems.length == 0 };
}

// ----- 7. CHECK THE USER'S INPUT BEFORE GENERATING -----
// Returns a list of problems. If the list is empty, the input is fine.
function checkInput() {
  var problems = [];
  var needLecture = false;
  var needLab = false;

  if (subjects.length == 0) problems.push("Add at least one subject.");
  if (batches.length == 0) problems.push("Add at least one batch.");

  for (var i = 0; i < subjects.length; i++) {
    if (subjects[i].lectures > 0) needLecture = true;
    if (subjects[i].labs > 0) needLab = true;
    if (subjects[i].lectures + subjects[i].labs > 5) {
      problems.push(subjects[i].name + " has more than 5 classes per week, but a subject can come only once per day (5 days).");
    }
    // total classes of this teacher (all subjects of the teacher, all batches)
    var teacherTotal = 0;
    for (var j = 0; j < subjects.length; j++) {
      if (subjects[j].teacher == subjects[i].teacher) {
        teacherTotal = teacherTotal + subjects[j].lectures + subjects[j].labs;
      }
    }
    teacherTotal = teacherTotal * batches.length;
    var msg = subjects[i].teacher + " has " + teacherTotal + " classes per week, but there are only 30 slots.";
    if (teacherTotal > 30 && problems.indexOf(msg) == -1) problems.push(msg);
  }

  if (needLecture && lectureRooms.length == 0) problems.push("Add at least one lecture room.");
  if (needLab && labRooms.length == 0) problems.push("Add at least one lab room.");
  if (classesPerBatch() > 30) problems.push("One batch needs " + classesPerBatch() + " classes, but there are only 30 slots per week.");
  return problems;
}

// ----- 8. ADD / REMOVE DATA (called by the buttons) -----
function readText(id) {
  return document.getElementById(id).value.trim();
}

function nameExists(list, name) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].toLowerCase() == name.toLowerCase()) return true;
  }
  return false;
}

function addSubject() {
  var name = readText("subjName");
  var teacher = readText("subjTeacher");
  var lec = Number(readText("subjLec"));
  var lab = Number(readText("subjLab"));

  if (name == "" || teacher == "") {
    alert("Please enter the subject name and the teacher name.");
    return;
  }
  if (lec < 0 || lab < 0 || lec != Math.floor(lec) || lab != Math.floor(lab) || lec + lab == 0) {
    alert("Enter whole numbers for lectures and labs (at least one class per week).");
    return;
  }
  for (var i = 0; i < subjects.length; i++) {
    if (subjects[i].name.toLowerCase() == name.toLowerCase()) {
      alert("This subject is already added.");
      return;
    }
  }
  subjects.push({ name: name, teacher: teacher, lectures: lec, labs: lab });
  document.getElementById("subjName").value = "";
  document.getElementById("subjTeacher").value = "";
  document.getElementById("subjLec").value = "";
  document.getElementById("subjLab").value = "";
  dataChanged();
}

function removeSubject(index) {
  subjects.splice(index, 1);
  dataChanged();
}

function addRoom(type) {
  var box = (type == "Lab") ? "labRoomInput" : "lecRoomInput";
  var name = readText(box);
  if (name == "") {
    alert("Please enter a room name.");
    return;
  }
  if (nameExists(lectureRooms, name) || nameExists(labRooms, name)) {
    alert("This room is already added.");
    return;
  }
  getRooms(type).push(name);
  document.getElementById(box).value = "";
  dataChanged();
}

function removeRoom(type, index) {
  getRooms(type).splice(index, 1);
  dataChanged();
}

function addBatch() {
  var name = readText("batchInput");
  if (name == "") {
    alert("Please enter a batch name.");
    return;
  }
  if (nameExists(batches, name)) {
    alert("This batch is already added.");
    return;
  }
  batches.push(name);
  document.getElementById("batchInput").value = "";
  dataChanged();
}

function removeBatch(index) {
  batches.splice(index, 1);
  dataChanged();
}

function clearAll() {
  subjects = [];
  lectureRooms = [];
  labRooms = [];
  batches = [];
  dataChanged();
}

// Fills the lists with a sample so you can test quickly
function loadExample() {
  subjects = [
    { name: "DAA", teacher: "DR. Shruti Yagnik",    lectures: 3, labs: 1 },
    { name: "WT",  teacher: "Mrs. Poonam Patel",    lectures: 3, labs: 1 },
    { name: "CG",  teacher: "Mr. Sanjay Prajapati", lectures: 3, labs: 1 },
    { name: "PSC", teacher: "Mrs. Sheetal Panchal", lectures: 3, labs: 1 },
    { name: "CN",  teacher: "Mrs. Dhwani Goradiya", lectures: 3, labs: 1 },
    { name: "BST", teacher: "Mr. Prashant Chauhan", lectures: 2, labs: 2 }
  ];
  lectureRooms = ["LH-4-5", "LH-4-6", "B-425"];
  labRooms = ["LAB-4", "LAB-5"];
  batches = ["A1", "A2"];
  dataChanged();
}

// ----- 9. SHOW EVERYTHING ON THE PAGE -----
function showLists() {
  // subject table
  var rows = "";
  for (var i = 0; i < subjects.length; i++) {
    rows += "<tr><td>" + subjects[i].name + "</td><td>" + subjects[i].teacher + "</td><td>" +
            subjects[i].lectures + "</td><td>" + subjects[i].labs + "</td>" +
            "<td><button class='remove' onclick='removeSubject(" + i + ")'>Remove</button></td></tr>";
  }
  document.getElementById("subjectTable").innerHTML = rows;

  // room list
  var html = "<p><b>Lecture rooms:</b> ";
  for (var a = 0; a < lectureRooms.length; a++) {
    html += "<span class='item'>" + lectureRooms[a] + "<button class='remove' onclick=\"removeRoom('Lecture'," + a + ")\">x</button></span>";
  }
  html += "</p><p><b>Lab rooms:</b> ";
  for (var b = 0; b < labRooms.length; b++) {
    html += "<span class='item'>" + labRooms[b] + "<button class='remove' onclick=\"removeRoom('Lab'," + b + ")\">x</button></span>";
  }
  document.getElementById("roomList").innerHTML = html + "</p>";

  // batch list and batch dropdown
  var batchHtml = "";
  var options = "";
  for (var c = 0; c < batches.length; c++) {
    batchHtml += "<span class='item'>" + batches[c] + "<button class='remove' onclick='removeBatch(" + c + ")'>x</button></span>";
    options += "<option value='" + batches[c] + "'>Batch " + batches[c] + "</option>";
  }
  document.getElementById("batchList").innerHTML = batchHtml;
  var select = document.getElementById("batchSelect");
  var old = select.value;
  select.innerHTML = options;
  if (old != "" && batches.indexOf(old) != -1) {
    select.value = old;       // keep the batch the user had chosen
  }
}

// The heading shows college, program, semester and batches (labels only)
function getSemesterText() {
  return "Semester " + document.getElementById("semesterSelect").value;
}

function showHeading() {
  document.getElementById("infoLine").innerText =
    readText("collegeInput") + " | " + readText("programInput") + " | " + getSemesterText() +
    " | Batches: " + batches.join(", ");
  if (result != null) {
    showTimetable();
  }
}

function findClass(batch, day, period) {
  for (var i = 0; i < result.schedule.length; i++) {
    var c = result.schedule[i];
    if (c.batch == batch && c.day == day && c.period == period) {
      return c;
    }
  }
  return null;
}

function makeRow(batch, p) {
  var row = "<tr><th>" + periodNames[p] + "<br>" + periodTimes[p] + "</th>";
  for (var d = 0; d < 5; d++) {
    var c = findClass(batch, d, p);
    if (c == null) {
      row += "<td class='free'>Free</td>";
    } else {
      row += "<td class='" + c.type.toLowerCase() + "'><b>" + c.subject + "</b> (" + c.type + ")<br>" +
             getTeacher(c.subject) + "<br>Room: " + c.room + "</td>";
    }
  }
  return row + "</tr>";
}

function showTimetable() {
  if (result == null) {
    document.getElementById("grid").innerHTML = "<p>Click Generate Timetable to see the timetable.</p>";
    document.getElementById("gridTitle").innerText = "Timetable";
    return;
  }
  var batch = document.getElementById("batchSelect").value;
  var html = "<table><tr><th>Period</th>";
  for (var d = 0; d < 5; d++) {
    html += "<th>" + days[d] + "</th>";
  }
  html += "</tr>";
  for (var p = 0; p < 3; p++) {
    html += makeRow(batch, p);
  }
  html += "<tr><td class='lunch' colspan='6'>LUNCH BREAK (11:30-12:00)</td></tr>";
  for (var q = 3; q < 6; q++) {
    html += makeRow(batch, q);
  }
  html += "</table>";
  document.getElementById("grid").innerHTML = html;
  document.getElementById("gridTitle").innerText =
    "Timetable - " + readText("programInput") + " | " + getSemesterText() + " | Batch " + batch;
}

function showReport() {
  var r = result.report;
  var name = (result.algorithm == "greedy") ? "Greedy" : "Backtracking";
  var expected = classesPerBatch() * batches.length;

  document.getElementById("summary").innerHTML =
    "<b>Algorithm:</b> " + name +
    " | <b>Classes scheduled:</b> " + result.schedule.length + " / " + expected +
    " | <b>Teacher conflicts:</b> " + r.teacher +
    " | <b>Room conflicts:</b> " + r.room +
    " | <b>Same-subject conflicts:</b> " + r.subject +
    " | <b>Time:</b> " + result.time.toFixed(2) + " ms";

  var html = "";
  if (r.valid) {
    html = "<div class='good'>Timetable generated successfully. All teacher, room, batch, and weekly requirement checks passed.</div>";
  } else {
    html = "<div class='bad'>Timetable is NOT valid. " + result.message + "</div><ul>";
    for (var i = 0; i < r.problems.length; i++) {
      html += "<li>" + r.problems[i] + "</li>";
    }
    html += "</ul>";
  }
  document.getElementById("report").innerHTML = html;
}

// Called whenever the user adds or removes data: old timetable is cleared
function dataChanged() {
  result = null;
  showLists();
  showHeading();
  showTimetable();
  document.getElementById("summary").innerHTML = "";
  document.getElementById("report").innerHTML = "<p>Add subjects, rooms and batches, then click Generate Timetable.</p>";
}

function generate() {
  var problems = checkInput();
  if (problems.length > 0) {
    result = null;
    showTimetable();
    document.getElementById("summary").innerHTML = "";
    var html = "<div class='bad'>Cannot generate the timetable yet:</div><ul>";
    for (var i = 0; i < problems.length; i++) {
      html += "<li>" + problems[i] + "</li>";
    }
    document.getElementById("report").innerHTML = html + "</ul>";
    return;
  }

  var chosen = document.getElementById("algoSelect").value;
  var start = performance.now();
  var output;
  if (chosen == "greedy") {
    output = runGreedy();
  } else {
    output = runBacktracking();
  }
  var time = performance.now() - start;

  result = { algorithm: chosen, schedule: output.schedule, message: output.message,
             report: validate(output.schedule), time: time };
  showTimetable();
  showReport();
}

// ----- 10. START THE PAGE -----
if (typeof document != "undefined") {
  document.getElementById("generateBtn").onclick = generate;
  document.getElementById("printBtn").onclick = function () { window.print(); };
  document.getElementById("batchSelect").onchange = showTimetable;
  document.getElementById("semesterSelect").onchange = showHeading;
  document.getElementById("programInput").oninput = showHeading;
  document.getElementById("collegeInput").oninput = showHeading;
  dataChanged();
} else {
  module.exports = { runGreedy: runGreedy, runBacktracking: runBacktracking, validate: validate };
}
