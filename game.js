/* ================================================================
   Mel's Quiz - a game-show style money quiz.

   CHANGE THE GAME HERE. Everything Dec might want to tweak is in
   this one CONFIG object.
   ================================================================ */
var CONFIG = {
  currency: "£",
  startMoney: 0,          // money at the start of every game
  maxQuestions: 10,       // a game ends after this many questions
  secondsPerQuestion: 30, // time allowed for each question

  // The three question types she can pick from. `prize` is what a right answer wins.
  // `set` is which list in questions.js the questions come from.
  levels: [
    { key: "easy",   label: "Easy",   prize: 100, set: "easy" },
    { key: "medium", label: "Medium", prize: 250, set: "medium" },
    { key: "hard",   label: "Hard",   prize: 500, set: "hard" }
  ],

  // Lifelines. Each can be used once per game and costs money from her winnings.
  lifelines: {
    removeWrong: { label: "Remove a wrong answer", cost: 50 },
    stopClock:   { label: "Stop the clock",        cost: 50 },
    phoneFriend: { label: "Phone a friend",        cost: 75 }
  },
  phoneFriendMessage: "Ask Dec! Take your time.", // shown while the clock is paused

  // The best winnings are remembered in the browser under this name.
  storageKey: "melsQuiz.bestWinnings"
};

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var screens = { start: $("screen-start"), choose: $("screen-choose"), question: $("screen-question"), end: $("screen-end") };

  // ---- game state
  var money, asked, pools, usedLifelines, current, currentLevel;
  var answered, endReason;
  // timer state
  var timerId = null, remainingMs = 0, lastTick = 0, running = false, clockStopped = false, friendOpen = false;

  // ---------------------------------------------------------------- helpers
  function fmt(n) { return CONFIG.currency + Number(n).toLocaleString("en-GB"); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].hidden = (k !== name); });
  }
  function levelByKey(key) {
    for (var i = 0; i < CONFIG.levels.length; i++) if (CONFIG.levels[i].key === key) return CONFIG.levels[i];
  }

  // ---------------------------------------------------------------- best winnings
  // (localStorage can be unavailable, e.g. private browsing, so never let it crash the game)
  function loadBest() {
    try {
      var raw = window.localStorage.getItem(CONFIG.storageKey);
      if (raw === null) return null;
      var n = JSON.parse(raw);
      return (typeof n === "number" && isFinite(n)) ? n : null;
    } catch (e) { return null; }
  }
  function saveBest(n) {
    try { window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(n)); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- start
  function showStart() {
    stopTimer();
    var best = loadBest();
    var el = $("best-start");
    el.hidden = (best === null);
    el.textContent = best === null ? "" : "Your best winnings: " + fmt(best);
    $("rule-seconds").textContent = CONFIG.secondsPerQuestion;
    show("start");
    $("btn-start").focus();
  }

  function newGame() {
    money = CONFIG.startMoney;
    asked = 0;
    usedLifelines = {};
    endReason = "";
    pools = {};
    CONFIG.levels.forEach(function (lv) { pools[lv.key] = shuffle(QUESTIONS[lv.set]); }); // no repeats in a game
    showChoose();
  }

  // ---------------------------------------------------------------- choose
  function showChoose() {
    stopTimer();
    $("choose-progress").textContent = "Question " + (asked + 1) + " of " + CONFIG.maxQuestions;
    $("choose-money").textContent = fmt(money);
    var box = $("choices");
    box.innerHTML = "";
    CONFIG.levels.forEach(function (lv) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn choice choice-" + lv.key;
      b.innerHTML = '<span class="choice-name"></span><span class="choice-prize"></span>';
      b.querySelector(".choice-name").textContent = lv.label;
      b.querySelector(".choice-prize").textContent = "Win " + fmt(lv.prize);
      b.addEventListener("click", function () { startQuestion(lv); });
      box.appendChild(b);
    });

    var left = Object.keys(CONFIG.lifelines).filter(function (k) { return !usedLifelines[k]; })
      .map(function (k) { return CONFIG.lifelines[k].label + " (" + fmt(CONFIG.lifelines[k].cost) + ")"; });
    $("lifelines-left").textContent = left.length ? "Lifelines left: " + left.join(", ") : "No lifelines left.";

    var take = $("btn-take");
    take.hidden = (money <= 0);
    take.textContent = "Take the money and stop (" + fmt(money) + ")";
    show("choose");
    $("choose-title").focus();
  }

  // ---------------------------------------------------------------- question
  function startQuestion(level) {
    currentLevel = level;
    current = pools[level.key].pop();
    asked++;
    answered = false;
    clockStopped = false;
    friendOpen = false;

    $("q-progress").textContent = "Question " + asked + " of " + CONFIG.maxQuestions;
    $("q-level").textContent = level.label + " question for " + fmt(level.prize);
    $("q-level").className = "level-tag level-" + level.key;
    $("question-text").textContent = current.q;
    $("feedback").hidden = true;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("btn-next").hidden = true;
    $("friend-panel").hidden = true;

    var box = $("options");
    box.innerHTML = "";
    shuffle(current.options).forEach(function (text) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn option";
      b.textContent = text;
      b.addEventListener("click", function () { choose(b, text); });
      box.appendChild(b);
    });

    updateMoney();
    updateLifelines();
    show("question");
    startTimer(CONFIG.secondsPerQuestion * 1000);
    $("question-text").focus();
  }

  function updateMoney() { $("q-money").textContent = fmt(money); }

  // ---------------------------------------------------------------- timer
  function renderTimer() {
    var secs = Math.max(0, Math.ceil(remainingMs / 1000));
    var total = CONFIG.secondsPerQuestion * 1000;
    $("timer-seconds").textContent = secs;
    $("timer-fill").style.width = Math.max(0, remainingMs / total * 100) + "%";
    var low = remainingMs <= 10000 && !clockStopped;
    $("timer-fill").className = low ? "low" : "";
    $("timer-seconds").className = "timer-seconds" + (low ? " low" : "");
    var note = "seconds left";
    if (clockStopped) note = "Clock stopped. Take your time!";
    else if (friendOpen) note = "Paused";
    else if (secs === 1) note = "second left";
    $("timer-note").textContent = note;
  }

  function startTimer(ms) {
    stopTimer();
    remainingMs = ms;
    renderTimer();
    resumeTimer();
  }

  function resumeTimer() {
    if (answered || clockStopped || friendOpen) return;
    lastTick = Date.now();
    running = true;
    clearInterval(timerId);
    timerId = setInterval(tick, 100);
  }

  function pauseTimer() {
    if (running) { remainingMs -= (Date.now() - lastTick); }
    running = false;
    clearInterval(timerId);
    timerId = null;
  }

  function stopTimer() {
    running = false;
    clearInterval(timerId);
    timerId = null;
  }

  function tick() {
    if (!running) return;
    var now = Date.now();
    remainingMs -= (now - lastTick);
    lastTick = now;
    if (remainingMs <= 0) {
      remainingMs = 0;
      renderTimer();
      timeUp();
    } else {
      renderTimer();
    }
  }

  // ---------------------------------------------------------------- lifelines
  function updateLifelines() {
    Object.keys(CONFIG.lifelines).forEach(function (key) {
      var ll = CONFIG.lifelines[key];
      var b = $("ll-" + key);
      var used = !!usedLifelines[key];
      var affordable = money >= ll.cost;
      b.innerHTML = '<span class="ll-name"></span><span class="ll-cost"></span>';
      b.querySelector(".ll-name").textContent = ll.label;
      b.querySelector(".ll-cost").textContent = used ? "Used" : fmt(ll.cost);
      b.disabled = answered || friendOpen || used || !affordable;
      b.classList.toggle("used", used);
      var why = used ? "already used" : (!affordable ? "you can't afford this yet" : "costs " + fmt(ll.cost));
      b.setAttribute("aria-label", ll.label + ", " + why);
      b.title = why;
    });
  }

  function spend(key) {
    var ll = CONFIG.lifelines[key];
    if (answered || friendOpen || usedLifelines[key] || money < ll.cost) return false;
    money -= ll.cost;
    usedLifelines[key] = true;
    updateMoney();
    return true;
  }

  function useRemoveWrong() {
    if (!spend("removeWrong")) return;
    var wrongs = Array.prototype.filter.call($("options").children, function (b) {
      return b.textContent !== current.answer && !b.disabled;
    });
    if (wrongs.length) {
      var gone = pick(wrongs);
      gone.disabled = true;
      gone.classList.add("removed");
      gone.setAttribute("aria-label", gone.textContent + " (removed)");
    }
    updateLifelines();
  }

  function useStopClock() {
    if (!spend("stopClock")) return;
    pauseTimer();
    clockStopped = true;
    renderTimer();
    updateLifelines();
  }

  function usePhoneFriend() {
    if (!spend("phoneFriend")) return;
    pauseTimer();
    friendOpen = true;
    $("friend-message").textContent = CONFIG.phoneFriendMessage;
    $("friend-panel").hidden = false;
    setOptionsDisabled(true);
    renderTimer();
    updateLifelines();
    $("btn-friend-back").focus();
  }

  function friendBack() {
    friendOpen = false;
    $("friend-panel").hidden = true;
    Array.prototype.forEach.call($("options").children, function (b) {
      if (!b.classList.contains("removed")) b.disabled = false;
    });
    renderTimer();
    resumeTimer();
    updateLifelines();
    $("question-text").focus();
  }

  function setOptionsDisabled(flag) {
    Array.prototype.forEach.call($("options").children, function (b) { b.disabled = flag || b.classList.contains("removed"); });
  }

  // ---------------------------------------------------------------- answering
  var CHEERS = ["Well done!", "Brilliant!", "Spot on!", "Lovely, that's right!", "Great answer!", "You've got it!"];
  var CONSOLATIONS = ["Oh, so close!", "Not to worry!", "Good try!", "Don't worry, that was a tricky one!"];

  function revealAnswer(chosenButton) {
    Array.prototype.forEach.call($("options").children, function (b) {
      b.disabled = true;
      if (b.textContent === current.answer) b.classList.add("correct");
      else if (b === chosenButton) b.classList.add("wrong");
      else b.classList.add("dim");
    });
  }

  function choose(button, text) {
    if (answered || friendOpen) return;
    answered = true;
    pauseTimer();
    var right = (text === current.answer);
    var fb = $("feedback");
    revealAnswer(button);

    if (right) {
      money += currentLevel.prize;
      fb.textContent = "✔ " + pick(CHEERS) + " You win " + fmt(currentLevel.prize) + "!";
      fb.className = "feedback good";
    } else {
      endReason = "wrong";
      fb.textContent = "✘ " + pick(CONSOLATIONS) + " The right answer was: " + current.answer + ". The game is over, but you keep your " + fmt(money) + ".";
      fb.className = "feedback bad";
    }
    afterAnswer(right);
  }

  function timeUp() {
    if (answered) return;
    answered = true;
    stopTimer();
    endReason = "time";
    revealAnswer(null);
    var fb = $("feedback");
    fb.textContent = "⏰ Time's up! The right answer was: " + current.answer + ". The game is over, but you keep your " + fmt(money) + ".";
    fb.className = "feedback bad";
    afterAnswer(false);
  }

  function afterAnswer(right) {
    $("feedback").hidden = false;
    updateMoney();
    updateLifelines();
    var next = $("btn-next");
    if (!right) next.textContent = "See what I won";
    else if (asked >= CONFIG.maxQuestions) next.textContent = "See what I won";
    else next.textContent = "Choose my next question";
    next.hidden = false;
    next.focus();
  }

  function next() {
    if (endReason) { finish(); return; }
    if (asked >= CONFIG.maxQuestions) { endReason = "complete"; finish(); return; }
    showChoose();
  }

  // ---------------------------------------------------------------- end
  function endMessage(won) {
    if (won >= 2000) return "Absolutely fantastic! You're a quiz superstar!";
    if (won >= 1000) return "Brilliant playing! That's a cracking amount of money.";
    if (won >= 500) return "Well done! That's a really good win.";
    if (won > 0) return "Nice one! Have another go and see if you can win even more.";
    return "Thanks for playing! Every game teaches you something new, so have another go.";
  }

  var REASONS = {
    wrong: "That answer wasn't right, so the game is over.",
    time: "The time ran out, so the game is over.",
    take: "You took the money and stopped.",
    complete: "You answered all " + CONFIG.maxQuestions + " questions!"
  };

  function finish() {
    stopTimer();
    var best = loadBest();
    var newBest = (best === null || money > best) && money > 0;
    if (newBest) { saveBest(money); best = money; }
    $("end-reason").textContent = REASONS[endReason] || "";
    $("end-won").textContent = "You won " + fmt(money) + "!";
    $("end-message").textContent = endMessage(money);
    $("end-best").textContent = newBest ? "🎉 That's your best winnings so far!" :
      (best === null ? "" : "Your best winnings: " + fmt(best));
    show("end");
    $("end-title").focus();
  }

  function takeMoney() {
    endReason = "take";
    finish();
  }

  // ---------------------------------------------------------------- wire up
  $("btn-start").addEventListener("click", newGame);
  $("btn-take").addEventListener("click", takeMoney);
  $("btn-next").addEventListener("click", next);
  $("btn-again").addEventListener("click", newGame);
  $("ll-removeWrong").addEventListener("click", useRemoveWrong);
  $("ll-stopClock").addEventListener("click", useStopClock);
  $("ll-phoneFriend").addEventListener("click", usePhoneFriend);
  $("btn-friend-back").addEventListener("click", friendBack);

  showStart();
})();
