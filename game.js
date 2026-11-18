/* ================================================================
   Mel's Quiz - a game-show style money quiz.

   CHANGE THE GAME HERE. Everything Dec might want to tweak is in
   this one CONFIG object.
   ================================================================ */
var CONFIG = {
  currency: "£",
  startMoney: 0,          // money at the start of every game
  secondsPerQuestion: 30, // time allowed for each question

  // The three question types she can pick from. `prize` is what a right answer wins.
  // `set` is which list in questions.js the questions come from.
  levels: [
    { key: "easy",   label: "Easy",   prize: 100, set: "easy" },
    { key: "medium", label: "Medium", prize: 250, set: "medium" },
    { key: "hard",   label: "Hard",   prize: 500, set: "hard" }
  ],

  // ENDLESS MODE: the game goes on until all the lives are gone.
  // A wrong answer or running out of time costs a life. Every `bigEvery`th question is a forced hard one,
  // worth `bigPrize` instead of the usual hard prize. There is no "take the money" and no refills.
  // Keep the prizes, lifeline costs, lives and bigEvery/bigPrize in step with the Worker
  // (leaderboard/src/endless.js, "game rules") and keep every amount a multiple of £25.
  endless: {
    lives: 3,
    bigEvery: 10,
    bigPrize: 1000
  },

  // Lifelines. Each can be used once per game (they never refill) and costs money from her winnings.
  // Ask Dec is £50 (not £40) so every possible score stays a multiple of £25,
  // which the shared leaderboard still requires.
  lifelines: {
    removeWrong: { label: "Remove a wrong answer", cost: 50 },
    stopClock:   { label: "Stop the clock",        cost: 50 },
    phoneFriend: { label: "Ask Dec",               cost: 50 }
  },

  // Ask Dec is a gamble. The three odds should add up to 1.
  // To try one outcome while testing, add ?debugAskDec=right, knockout or wrong to the address.
  askDec: {
    thinkMs: 3000, // short pause while Dec "thinks"; the timer is paused only for this
    odds: {
      suggestRight: 0.50, // Dec suggests the correct answer
      knockOut:     0.30, // Dec knocks out one or two wrong answers
      suggestWrong: 0.20  // Dec confidently suggests a wrong answer
    },
    thinkingLine: "Asking Dec...",
    suggestLine: "Dec says: I'm pretty sure it's {letter}!",
    knockOutLine: "Dec isn't sure, but it's definitely not these.",
    knockOutLineOne: "Dec isn't sure, but it's definitely not this."
  },

  // The best winnings on this device are remembered in the browser under this name.
  // (Endless mode is a different game from the old 10-question one, so its best starts afresh.)
  storageKey: "melsQuiz.bestEndless",

  // SHARED LEADERBOARD. Paste the web address of the Cloudflare Worker here (see leaderboard/README.md),
  // for example "https://mels-quiz-leaderboard.your-name.workers.dev".
  // While this is empty ("") the leaderboard is switched off and hidden, and the game works as normal.
  leaderboardUrl: "https://mels-quiz-leaderboard.decgagan.workers.dev",
  maxNameLength: 20,             // longest name allowed (the Worker enforces this too)

  // PLAYER PROFILES (need the leaderboard Worker above). The device remembers who is signed in under this name.
  sessionStorageKey: "melsQuiz.session"
};

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var screens = { start: $("screen-start"), auth: $("screen-auth"), profile: $("screen-profile"), leaderboard: $("screen-leaderboard"), choose: $("screen-choose"), question: $("screen-question"), end: $("screen-end") };

  // ---- game state
  var money, asked, pools, usedLifelines, current, currentLevel, currentPrize, currentBig, lastQuestion;
  var lives, answeredBy, correctBy, runId, lastRun;
  var answered, endReason;
  // timer state
  var timerId = null, remainingMs = 0, lastTick = 0, running = false, clockStopped = false, askDecBusy = false;

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
  function showStart(flash) {
    stopTimer();
    var fl = $("start-flash");
    fl.hidden = !(typeof flash === "string" && flash);
    fl.textContent = (typeof flash === "string") ? flash : "";
    renderPlayerBox();
    var best = loadBest();
    var el = $("best-start");
    el.hidden = (best === null);
    el.textContent = best === null ? "" : "Your best winnings: " + fmt(best);
    $("rule-seconds").textContent = CONFIG.secondsPerQuestion;
    show("start");
    $("btn-start").focus();
  }

  function makeRunId() {
    try {
      var bytes = new Uint8Array(12);
      window.crypto.getRandomValues(bytes);
      return Array.prototype.map.call(bytes, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    } catch (e) {
      return String(Date.now()) + Math.floor(Math.random() * 1e9);
    }
  }

  function newGame() {
    money = CONFIG.startMoney;
    asked = 0;
    lives = CONFIG.endless.lives;
    usedLifelines = {};
    endReason = "";
    answeredBy = { easy: 0, medium: 0, hard: 0 };
    correctBy = { easy: 0, medium: 0, hard: 0 };
    runId = makeRunId();
    lastRun = null;
    pools = {};
    lastQuestion = null;
    showChoose();
  }

  // The next question for a level. Nothing repeats in a run until that level's whole list has been used,
  // then the list is reshuffled.
  function drawQuestion(level) {
    var list = pools[level.key];
    if (!list || !list.length) {
      list = shuffle(QUESTIONS[level.set]);
      if (list.length > 1 && list[list.length - 1] === lastQuestion) { var t = list[0]; list[0] = list[list.length - 1]; list[list.length - 1] = t; }
      pools[level.key] = list;
    }
    lastQuestion = list.pop();
    return lastQuestion;
  }

  function isBigQuestion(n) { return n % CONFIG.endless.bigEvery === 0; }

  function renderHearts(el) {
    var html = "";
    for (var i = 0; i < CONFIG.endless.lives; i++) html += '<span class="heart' + (i < lives ? "" : " lost") + '">♥</span>';
    el.innerHTML = html;
    el.setAttribute("aria-label", lives + (lives === 1 ? " life" : " lives") + " left");
  }

  // ---------------------------------------------------------------- choose
  function showChoose() {
    stopTimer();
    var n = asked + 1;
    var big = isBigQuestion(n);
    var every = CONFIG.endless.bigEvery;
    $("choose-progress").textContent = "Question " + n;
    renderHearts($("choose-hearts"));
    $("choose-money").textContent = fmt(money);
    $("choose-title").textContent = big ? "Question " + n + " is the big one!" : "Pick your question";
    $("choose-note").textContent = big
      ? "Every " + every + "th question is a hard one, worth double. Good luck!"
      : "Question " + (n + every - (n % every)) + " will be a big hard one for " + fmt(CONFIG.endless.bigPrize) + ".";
    var box = $("choices");
    box.innerHTML = "";
    CONFIG.levels.forEach(function (lv) {
      if (big && lv.key !== "hard") return;
      var prize = big ? CONFIG.endless.bigPrize : lv.prize;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn choice choice-" + lv.key + (big ? " choice-big" : "");
      b.innerHTML = '<span class="choice-name"></span><span class="choice-prize"></span>';
      b.querySelector(".choice-name").textContent = big ? "Big hard question" : lv.label;
      b.querySelector(".choice-prize").textContent = "Win " + fmt(prize);
      b.addEventListener("click", function () { startQuestion(lv, prize, big); });
      box.appendChild(b);
    });

    var left = Object.keys(CONFIG.lifelines).filter(function (k) { return !usedLifelines[k]; })
      .map(function (k) { return CONFIG.lifelines[k].label + " (" + fmt(CONFIG.lifelines[k].cost) + ")"; });
    $("lifelines-left").textContent = left.length ? "Lifelines left, one use each: " + left.join(", ") : "No lifelines left.";
    show("choose");
    $("choose-title").focus();
  }

  // ---------------------------------------------------------------- question
  function startQuestion(level, prize, big) {
    currentLevel = level;
    currentPrize = prize;
    currentBig = !!big;
    current = drawQuestion(level);
    asked++;
    answered = false;
    clockStopped = false;
    askDecBusy = false;

    $("q-progress").textContent = "Question " + asked;
    renderHearts($("q-hearts"));
    $("q-level").textContent = (big ? "Big hard question" : level.label + " question") + " for " + fmt(prize);
    $("q-level").className = "level-tag level-" + level.key + (big ? " level-big" : "");
    $("question-text").textContent = current.q;
    $("feedback").hidden = true;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("btn-next").hidden = true;
    $("friend-panel").hidden = true;

    var box = $("options");
    box.innerHTML = "";
    shuffle(current.options).forEach(function (text, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn option";
      b.setAttribute("data-text", text);
      b.innerHTML = '<span class="option-letter"></span><span class="option-text"></span>';
      b.querySelector(".option-letter").textContent = "ABCD".charAt(i);
      b.querySelector(".option-text").textContent = text;
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
    if (clockStopped && !askDecBusy) note = "Clock stopped. Take your time!";
    else if (askDecBusy) note = "Asking Dec...";
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
    if (answered || clockStopped || askDecBusy) return;
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
      b.disabled = answered || askDecBusy || used || !affordable;
      b.classList.toggle("used", used);
      var why = used ? "already used" : (!affordable ? "you can't afford this yet" : "costs " + fmt(ll.cost));
      b.setAttribute("aria-label", ll.label + ", " + why);
      b.title = why;
    });
  }

  function spend(key) {
    var ll = CONFIG.lifelines[key];
    if (answered || askDecBusy || usedLifelines[key] || money < ll.cost) return false;
    money -= ll.cost;
    usedLifelines[key] = true;
    updateMoney();
    return true;
  }

  function optionButtons() { return Array.prototype.slice.call($("options").children); }
  function optionText(b) { return b.getAttribute("data-text") || b.textContent; }
  function optionLetter(b) {
    var i = optionButtons().indexOf(b);
    return "ABCD".charAt(i);
  }
  function remainingWrongs() {
    return optionButtons().filter(function (b) {
      return optionText(b) !== current.answer && !b.classList.contains("removed");
    });
  }
  function findCorrect() {
    var found = null;
    optionButtons().forEach(function (b) {
      if (optionText(b) === current.answer) found = b;
    });
    return found;
  }
  function removeOption(b) {
    b.disabled = true;
    b.classList.add("removed");
    b.setAttribute("aria-label", optionText(b) + " (removed)");
  }

  function useRemoveWrong() {
    if (!spend("removeWrong")) return;
    var wrongs = remainingWrongs();
    if (wrongs.length) removeOption(pick(wrongs));
    updateLifelines();
  }

  function useStopClock() {
    if (!spend("stopClock")) return;
    pauseTimer();
    clockStopped = true;
    renderTimer();
    updateLifelines();
  }

  // Hidden test hook: ?debugAskDec=right, knockout or wrong. Ignored for ordinary play.
  function debugAskDecOutcome() {
    try {
      var q = new URLSearchParams(window.location.search).get("debugAskDec");
      if (q === "right") return "suggestRight";
      if (q === "knockout") return "knockOut";
      if (q === "wrong") return "suggestWrong";
    } catch (e) { /* ignore */ }
    return null;
  }

  function rollAskDec() {
    var forced = debugAskDecOutcome();
    if (forced) return forced;
    var odds = CONFIG.askDec.odds;
    var r = Math.random();
    if (r < odds.suggestRight) return "suggestRight";
    if (r < odds.suggestRight + odds.knockOut) return "knockOut";
    return "suggestWrong";
  }

  function markSuggested(b) {
    b.classList.add("suggested");
    b.setAttribute("aria-label", optionLetter(b) + ", " + optionText(b) + ", Dec thinks this is the answer");
    $("friend-message").textContent = CONFIG.askDec.suggestLine.replace("{letter}", optionLetter(b));
  }

  function applyAskDec(outcome) {
    var wrongs = remainingWrongs();
    var correct = findCorrect();

    if (outcome === "knockOut") {
      if (!wrongs.length) {
        $("friend-message").textContent = "Dec isn't sure this time.";
        return;
      }
      // Randomly one or two, but never more than the wrong answers still in play.
      // A forced knockout knocks out two when it can, so the test screenshot is clear.
      var want = (wrongs.length === 1) ? 1 : (debugAskDecOutcome() === "knockOut" || Math.random() < 0.5 ? 2 : 1);
      if (want > wrongs.length) want = wrongs.length;
      shuffle(wrongs).slice(0, want).forEach(removeOption);
      $("friend-message").textContent = (want === 1) ? CONFIG.askDec.knockOutLineOne : CONFIG.askDec.knockOutLine;
      return;
    }

    // suggestRight and suggestWrong use the same wording, so players can't tell which it is.
    if (outcome === "suggestRight" && correct) {
      markSuggested(correct);
      return;
    }
    if (outcome === "suggestWrong" && wrongs.length) {
      markSuggested(pick(wrongs));
      return;
    }
    $("friend-message").textContent = "Dec isn't sure this time.";
  }

  function usePhoneFriend() {
    if (!spend("phoneFriend")) return;
    askDecBusy = true;
    if (!clockStopped) pauseTimer();
    $("friend-message").textContent = CONFIG.askDec.thinkingLine;
    $("friend-panel").hidden = false;
    setOptionsDisabled(true);
    renderTimer();
    updateLifelines();

    window.setTimeout(function () {
      if (answered) { askDecBusy = false; return; }
      applyAskDec(rollAskDec());
      askDecBusy = false;
      setOptionsDisabled(false);
      renderTimer();
      if (!clockStopped) resumeTimer();
      updateLifelines();
    }, CONFIG.askDec.thinkMs);
  }

  function setOptionsDisabled(flag) {
    optionButtons().forEach(function (b) { b.disabled = flag || b.classList.contains("removed"); });
  }

  // ---------------------------------------------------------------- answering
  var CHEERS = ["Well done!", "Brilliant!", "Spot on!", "Lovely, that's right!", "Great answer!", "You've got it!"];
  var CONSOLATIONS = ["Oh, so close!", "Not to worry!", "Good try!", "Don't worry, that was a tricky one!"];

  function revealAnswer(chosenButton) {
    Array.prototype.forEach.call($("options").children, function (b) {
      b.disabled = true;
      if (optionText(b) === current.answer) b.classList.add("correct");
      else if (b === chosenButton) b.classList.add("wrong");
      else b.classList.add("dim");
    });
  }

  // Wrong answers and timeouts both cost a life.
  function loseLife() {
    lives--;
    renderHearts($("q-hearts"));
    if (lives <= 0) endReason = "lives";
  }
  function lifeLine() {
    if (lives <= 0) return " That was your last life, so the game is over. You keep your " + fmt(money) + ".";
    return " You lose a life. " + lives + (lives === 1 ? " life" : " lives") + " left.";
  }

  function choose(button, text) {
    if (answered || askDecBusy) return;
    answered = true;
    pauseTimer();
    var right = (text === current.answer);
    var fb = $("feedback");
    revealAnswer(button);
    answeredBy[currentLevel.key]++;

    if (right) {
      correctBy[currentLevel.key]++;
      money += currentPrize;
      fb.textContent = "✔ " + pick(CHEERS) + " You win " + fmt(currentPrize) + "!";
      fb.className = "feedback good";
    } else {
      loseLife();
      fb.textContent = "✘ " + pick(CONSOLATIONS) + " The right answer was: " + current.answer + "." + lifeLine();
      fb.className = "feedback bad";
    }
    afterAnswer();
  }

  function timeUp() {
    if (answered) return;
    answered = true;
    stopTimer();
    revealAnswer(null);
    answeredBy[currentLevel.key]++;
    loseLife();
    var fb = $("feedback");
    fb.textContent = "⏰ Time's up! The right answer was: " + current.answer + "." + lifeLine();
    fb.className = "feedback bad";
    afterAnswer();
  }

  function afterAnswer() {
    $("feedback").hidden = false;
    updateMoney();
    updateLifelines();
    var next = $("btn-next");
    next.textContent = endReason ? "See what I won" : "Choose my next question";
    next.hidden = false;
    next.focus();
  }

  function next() {
    if (endReason) { finish(); return; }
    showChoose();
  }

  // ---------------------------------------------------------------- end
  function endMessage(won) {
    if (won >= 10000) return "Absolutely fantastic! You're a quiz superstar!";
    if (won >= 5000) return "Brilliant playing! That's a cracking amount of money.";
    if (won >= 2000) return "Well done! That's a really good win.";
    if (won > 0) return "Nice one! Have another go and see if you can win even more.";
    return "Thanks for playing! Every game teaches you something new, so have another go.";
  }

  function sum(o) { return o.easy + o.medium + o.hard; }

  function finish() {
    stopTimer();
    var best = loadBest();
    var newBest = (best === null || money > best) && money > 0;
    if (newBest) { saveBest(money); best = money; }
    var total = sum(answeredBy), right = sum(correctBy);
    lastRun = {
      runId: runId,
      score: money,
      answered: { easy: answeredBy.easy, medium: answeredBy.medium, hard: answeredBy.hard },
      correct: { easy: correctBy.easy, medium: correctBy.medium, hard: correctBy.hard },
      lifelines: Object.keys(CONFIG.lifelines).filter(function (k) { return usedLifelines[k]; }),
      saved: false, saving: false, result: null
    };
    $("end-reason").textContent = "You ran out of lives, so the game is over.";
    $("end-won").textContent = "You won " + fmt(money) + "!";
    $("end-summary").textContent = "You answered " + total + (total === 1 ? " question" : " questions") + " and got " + right + " right.";
    $("end-message").textContent = endMessage(money);
    $("end-best").textContent = newBest ? "🎉 That's your best winnings on this device!" :
      (best === null ? "" : "Your best winnings on this device: " + fmt(best));
    show("end");
    renderEndSave();
    $("end-title").focus();
  }

  // ---------------------------------------------------------------- shared leaderboard
  // Everything here is switched off when CONFIG.leaderboardUrl is empty.
  function lbBase() {
    var u = String(CONFIG.leaderboardUrl || "").replace(/^\s+|\s+$/g, "");
    if (!u) return "";
    return u.replace(/\/+$/, "").replace(/\/scores$/, "");
  }
  var lbOn = !!lbBase();
  
  // Talks to the Worker. Resolves with the parsed JSON, or rejects with an Error that has
  // .status (HTTP status, or 0 for a network problem) and .serverMessage (the Worker's own words).
  // path is like "/me". Signed-in players send their token automatically.
  function apiRequest(method, path, body, noAuth) {
    return new Promise(function (resolve, reject) {
      var ctl = (typeof AbortController !== "undefined") ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
      var opts = { method: method, cache: "no-store", headers: {} };
      if (ctl) opts.signal = ctl.signal;
      if (body) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
      if (session && !noAuth) opts.headers["Authorization"] = "Bearer " + session.token;
      fetch(lbBase() + path, opts).then(function (res) {
        clearTimeout(timer);
        return res.json().catch(function () { return null; }).then(function (data) {
          if (res.ok && data) { resolve(data); return; }
          var err = new Error("HTTP " + res.status);
          err.status = res.status;
          err.serverMessage = data && data.error;
          if (res.status === 401 && session && !noAuth && path !== "/login") signedOutByServer();
          reject(err);
        });
      }).catch(function (e) {
        clearTimeout(timer);
        if (e && typeof e.status === "number") { reject(e); return; }
        var err = new Error("network"); err.status = 0; reject(err);
      });
    });
  }

  // How a row's mix of questions is described.
  function mixBadge(answered) {
    var total = answered ? answered.easy + answered.medium + answered.hard : 0;
    if (!total) return null;
    if (answered.hard / total >= 0.5) return { text: "Mostly hard", cls: "badge-hard" };
    if (answered.easy / total >= 0.5) return { text: "Mostly easy", cls: "badge-easy" };
    return { text: "Mixed", cls: "badge-mixed" };
  }

  function lifelineNames(keys) {
    return keys.map(function (k) { return CONFIG.lifelines[k] ? CONFIG.lifelines[k].label : k; });
  }

  // Player names are untrusted: they are only ever put on the page with textContent, never innerHTML.
  function renderBoard(box, scores, kind) {
    box.innerHTML = "";
    if (!scores || !scores.length) {
      var empty = document.createElement("p");
      empty.className = "small-note";
      empty.textContent = kind === "weekly" ? "No scores yet this week. Be the first on the board!" : "No scores yet. Be the first on the board!";
      box.appendChild(empty);
      return;
    }
    var list = document.createElement("ol");
    list.className = "board";
    scores.forEach(function (row, i) {
      var li = document.createElement("li");
      li.className = "board-row" + (row.me ? " me" : "");
      var rank = document.createElement("span");
      rank.className = "board-rank";
      rank.textContent = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1);
      rank.setAttribute("aria-label", "Place " + (i + 1));
      var who = document.createElement("span");
      who.className = "board-who";
      var nm = document.createElement("span");
      nm.className = "board-name";
      nm.textContent = row.name;
      who.appendChild(nm);
      var meta = document.createElement("span");
      meta.className = "board-meta";
      if (kind === "endless") {
        var badge = mixBadge(row.answered);
        if (badge) {
          var pill = document.createElement("span");
          pill.className = "badge " + badge.cls;
          pill.textContent = badge.text;
          meta.appendChild(pill);
        }
        var qn = row.answered ? row.answered.easy + row.answered.medium + row.answered.hard : 0;
        var tail = document.createElement("span");
        tail.className = "board-detail";
        var ll = row.lifelines || [];
        tail.textContent = qn + " questions · " + (ll.length ? ll.length + (ll.length === 1 ? " lifeline" : " lifelines") : "no lifelines");
        tail.title = ll.length ? "Used: " + lifelineNames(ll).join(", ") : "No lifelines used";
        meta.appendChild(tail);
      } else if (row.noLifelines) {
        var nl = document.createElement("span");
        nl.className = "board-detail";
        nl.textContent = "No lifelines";
        meta.appendChild(nl);
      }
      if (meta.childNodes.length) who.appendChild(meta);
      if (row.me) {
        var tag = document.createElement("span");
        tag.className = "board-you";
        tag.textContent = "That's you!";
        who.appendChild(tag);
      }
      var pts = document.createElement("span");
      pts.className = "board-score";
      pts.textContent = fmt(row.score);
      li.appendChild(rank); li.appendChild(who); li.appendChild(pts);
      list.appendChild(li);
    });
    box.appendChild(list);
  }

  // path is like "/leaderboard/endless?board=overall"; kind is "endless" or "weekly"
  function loadBoard(box, path, kind) {
    box.innerHTML = "";
    var wait = document.createElement("p");
    wait.className = "small-note";
    wait.textContent = "Loading the leaderboard...";
    box.appendChild(wait);
    apiRequest("GET", path).then(function (data) {
      renderBoard(box, data.scores, kind);
    }).catch(function () {
      box.innerHTML = "";
      var msg = document.createElement("p");
      msg.className = "board-error";
      msg.textContent = "Couldn't load the leaderboard just now. Please try again in a little while.";
      var retry = document.createElement("button");
      retry.type = "button";
      retry.className = "btn btn-secondary";
      retry.textContent = "Try again";
      retry.addEventListener("click", function () { loadBoard(box, path, kind); });
      box.appendChild(msg);
      box.appendChild(retry);
    });
  }

  // ---- the Leaderboard screen from the start page: Top 10 / No lifelines
  var lbTab = "overall";
  function showLeaderboardScreen() {
    lbTab = "overall";
    $("leaderboard-title").textContent = "🏆 Top 10 leaderboard";
    $("lb-tabs").hidden = false;
    renderLbTabs();
    show("leaderboard");
    loadEndlessBoard();
    $("leaderboard-title").focus();
  }
  function renderLbTabs() {
    $("tab-lb-overall").setAttribute("aria-selected", lbTab === "overall" ? "true" : "false");
    $("tab-lb-nolifelines").setAttribute("aria-selected", lbTab === "nolifelines" ? "true" : "false");
    $("lb-sub").textContent = lbTab === "overall"
      ? "Each player's best game. How much money did you win before you ran out of lives?"
      : "Only games where no lifeline was used.";
  }
  function loadEndlessBoard() {
    loadBoard($("board-main"), "/leaderboard/endless?board=" + lbTab, "endless");
  }

  // ---- saving a finished game (the end screen)
  var savingTimer = null;
  function endStatus(text, cls) {
    var el = $("end-save-msg");
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "board-result" + (cls ? " " + cls : "");
  }

  // Works out what the end screen should show: saving, saved, a problem, or an invitation to sign in.
  function renderEndSave() {
    var run = lastRun;
    var wrap = $("end-leaderboard");
    if (!lbOn || !run) { wrap.hidden = true; return; }
    wrap.hidden = false;
    $("end-guest").hidden = true;
    $("btn-end-retry").hidden = true;
    $("btn-end-boards").hidden = true;
    $("board-end").innerHTML = "";
    endStatus("");
    if (!session) {
      $("end-guest").hidden = false;
      $("end-guest-text").textContent = run.score > 0
        ? "Want your " + fmt(run.score) + " on the leaderboard? Make a profile (or sign in) and your score is saved."
        : "Make a profile (or sign in) to save your games and join the leaderboards.";
      return;
    }
    if (run.saved) { showSavedResult(run.result); return; }
    saveRun();
  }

  function showSavedResult(data) {
    var msg;
    if (data.rank && data.rank <= data.scores.length) msg = "🎉 " + (data.newBest ? "New personal best! " : "") + "You're number " + data.rank + " on the leaderboard!";
    else if (data.rank) msg = "Saved! You're number " + data.rank + " on the leaderboard. Keep going to reach the top 10.";
    else msg = "Saved to your profile.";
    if (data.rankNoLifelines && lastRun.lifelines.length === 0) msg += " And number " + data.rankNoLifelines + " with no lifelines.";
    endStatus(msg, "");
    renderBoard($("board-end"), data.scores, "endless");
    $("btn-end-boards").hidden = false;
  }

  function saveRun() {
    var run = lastRun;
    if (!run || run.saved || run.saving) return;
    run.saving = true;
    endStatus("Saving your score...", "plain");
    $("btn-end-retry").hidden = true;
    apiRequest("POST", "/runs", { runId: run.runId, score: run.score, answered: run.answered, correct: run.correct, lifelines: run.lifelines }).then(function (data) {
      run.saving = false; run.saved = true; run.result = data;
      me = data.profile;
      if (lastRun === run && !screens.end.hidden) showSavedResult(data);
    }).catch(function (err) {
      run.saving = false;
      if (lastRun !== run || screens.end.hidden) return;
      if (!session) { renderEndSave(); return; }   // our sign-in stopped working: offer to sign in again
      endStatus(err.serverMessage || "Couldn't save your score just now. Please check your connection and try again.", "bad");
      $("btn-end-retry").hidden = false;
    });
  }

  function backToEnd() {
    show("end");
    renderEndSave();
    $("end-title").focus();
  }

  function setupLeaderboardUi() {
    if (!lbOn) return;
    $("btn-leaderboard").hidden = false;
    $("footer-note").textContent = "No email needed and no tracking. Your best winnings are saved on this device. If you make a profile, your name, PIN (scrambled) and scores are kept on the game's server, and your name and scores are shown to everyone who plays.";
    $("btn-leaderboard").addEventListener("click", showLeaderboardScreen);
    $("btn-board-back").addEventListener("click", function () { showStart(); });
    $("tab-lb-overall").addEventListener("click", function () { lbTab = "overall"; renderLbTabs(); loadEndlessBoard(); });
    $("tab-lb-nolifelines").addEventListener("click", function () { lbTab = "nolifelines"; renderLbTabs(); loadEndlessBoard(); });
    $("btn-end-retry").addEventListener("click", saveRun);
    $("btn-end-boards").addEventListener("click", showLeaderboardScreen);
    $("btn-end-create").addEventListener("click", function () { showAuth("create", backToEnd, backToEnd); });
    $("btn-end-signin").addEventListener("click", function () { showAuth("signin", backToEnd, backToEnd); });
  }

  // ---------------------------------------------------------------- player profiles
  // A profile is a name + 4-digit PIN kept on the Worker. This device remembers who is signed in.
  var session = loadSession();   // { token, name } or null
  var me = null;                 // the signed-in player's details from the Worker (stats), or null
  var authMode = "create";       // "create" or "signin"
  var afterAuth = null;          // what to do once someone has signed in or created a profile
  var authBack = null;           // where "Back" goes from the sign-in screen

  function loadSession() {
    try {
      var s = JSON.parse(window.localStorage.getItem(CONFIG.sessionStorageKey));
      if (s && typeof s.token === "string" && typeof s.name === "string") return s;
    } catch (e) { /* ignore */ }
    return null;
  }
  function saveSession(s) {
    session = s;
    try {
      if (s) window.localStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(s));
      else window.localStorage.removeItem(CONFIG.sessionStorageKey);
    } catch (e) { /* ignore */ }
  }

  // The Worker says our saved sign-in has stopped working (for example the profile was deleted).
  function signedOutByServer() {
    saveSession(null);
    me = null;
  }

  function statsLine(p) {
    if (!p) return "";
    return "Best " + fmt(p.bestEndless) + " · " + p.gamesPlayed + (p.gamesPlayed === 1 ? " game" : " games") + " · " + p.totalCorrect + " right";
  }

  function renderPlayerBox() {
    var box = $("player-box");
    if (!lbOn) { box.hidden = true; return; }
    box.hidden = false;
    $("player-in").hidden = !session;
    $("player-out").hidden = !!session;
    if (session) {
      $("player-name").textContent = session.name;
      $("player-stats").textContent = statsLine(me);
    }
  }

  // Ask the Worker who we are and how we're doing. Fails quietly: the game still works without it.
  function refreshMe() {
    if (!lbOn || !session) return Promise.resolve(null);
    var token = session.token;
    return apiRequest("GET", "/me").then(function (data) {
      if (!session || session.token !== token) return null;
      me = data.profile;
      if (session.name !== me.name) saveSession({ token: session.token, name: me.name });
      renderPlayerBox();
      return me;
    }).catch(function () {
      renderPlayerBox();
      if (!session && !screens.start.hidden) showStart("Please sign in again.");
      return null;
    });
  }

  function showAuth(mode, then, back) {
    authMode = mode;
    afterAuth = then || null;
    authBack = back || showStart;
    $("auth-name").value = "";
    $("auth-pin").value = "";
    $("auth-pin2").value = "";
    $("auth-show").checked = false;
    setPinVisible(false);
    $("auth-msg").textContent = "";
    renderAuthMode();
    show("auth");
    $("auth-title").focus();
  }

  function renderAuthMode() {
    var create = (authMode === "create");
    $("auth-title").textContent = create ? "Create your profile" : "Sign in";
    $("tab-create").setAttribute("aria-selected", create ? "true" : "false");
    $("tab-signin").setAttribute("aria-selected", create ? "false" : "true");
    $("auth-pin2-wrap").hidden = !create;
    $("btn-auth").textContent = create ? "Create my profile" : "Sign in";
    $("auth-pin").autocomplete = "off";
    $("auth-msg").textContent = "";
  }

  function setPinVisible(on) {
    $("auth-pin").type = on ? "text" : "password";
    $("auth-pin2").type = on ? "text" : "password";
  }

  var authBusy = false;
  function submitAuth(ev) {
    ev.preventDefault();
    if (authBusy) return;
    var msg = $("auth-msg");
    var name = String($("auth-name").value).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    var pin = $("auth-pin").value;
    var len = Array.from(name).length;
    if (len < 1) { msg.textContent = "Please type your name first."; $("auth-name").focus(); return; }
    if (len > CONFIG.maxNameLength) { msg.textContent = "Names can be up to " + CONFIG.maxNameLength + " letters long. Could you shorten it?"; $("auth-name").focus(); return; }
    if (!/^[0-9]{4}$/.test(pin)) { msg.textContent = "Your PIN must be 4 numbers, like 1234."; $("auth-pin").focus(); return; }
    if (authMode === "create" && $("auth-pin2").value !== pin) { msg.textContent = "The two PINs don't match. Please type them again."; $("auth-pin2").focus(); return; }

    authBusy = true;
    var btn = $("btn-auth");
    btn.disabled = true;
    btn.textContent = authMode === "create" ? "Creating..." : "Signing in...";
    msg.textContent = "";
    apiRequest("POST", authMode === "create" ? "/profiles" : "/login", { name: name, pin: pin }, true).then(function (data) {
      authBusy = false;
      btn.disabled = false;
      saveSession({ token: data.token, name: data.profile.name });
      me = data.profile;
      var go = afterAuth;
      afterAuth = null;
      if (go) go(); else showStart((authMode === "create" ? "Welcome, " : "Welcome back, ") + data.profile.name + "!");
    }).catch(function (err) {
      authBusy = false;
      btn.disabled = false;
      renderAuthMode();
      msg.textContent = err.serverMessage || (err.status === 0
        ? "Couldn't reach the game's server just now. Please check your connection and try again."
        : "That didn't work. Please try again in a little while.");
    });
  }

  function switchPlayer() {
    if (session) apiRequest("POST", "/logout", {}).catch(function () { /* ignore */ });
    saveSession(null);
    me = null;
    showAuth("signin", null, showStart);
  }

  function showProfile() {
    if (!session) { showAuth("signin"); return; }
    $("profile-name").textContent = session.name;
    $("delete-confirm").hidden = true;
    $("btn-delete").hidden = false;
    $("delete-msg").textContent = "";
    renderStats();
    show("profile");
    $("profile-title").focus();
    refreshMe().then(function () { if (!screens.profile.hidden) renderStats(); });
  }
  function renderStats() {
    $("stat-best").textContent = me ? fmt(me.bestEndless) : "-";
    $("stat-games").textContent = me ? String(me.gamesPlayed) : "-";
    $("stat-correct").textContent = me ? String(me.totalCorrect) : "-";
  }

  function deleteProfile() {
    var msg = $("delete-msg");
    var btn = $("btn-delete-yes");
    btn.disabled = true;
    msg.textContent = "";
    apiRequest("POST", "/me/delete", {}).then(function () {
      btn.disabled = false;
      saveSession(null);
      me = null;
      showStart("Your profile and scores have been deleted.");
    }).catch(function (err) {
      btn.disabled = false;
      if (!session) { showStart("Please sign in again."); return; }
      msg.textContent = err.serverMessage || "Couldn't delete it just now. Please check your connection and try again.";
    });
  }

  function setupProfileUi() {
    if (!lbOn) return;
    $("btn-create").addEventListener("click", function () { showAuth("create"); });
    $("btn-signin").addEventListener("click", function () { showAuth("signin"); });
    $("btn-profile").addEventListener("click", showProfile);
    $("btn-switch").addEventListener("click", switchPlayer);
    $("btn-profile-switch").addEventListener("click", switchPlayer);
    $("btn-profile-back").addEventListener("click", function () { showStart(); });
    $("tab-create").addEventListener("click", function () { authMode = "create"; renderAuthMode(); });
    $("tab-signin").addEventListener("click", function () { authMode = "signin"; renderAuthMode(); });
    $("auth-form").addEventListener("submit", submitAuth);
    $("auth-show").addEventListener("change", function () { setPinVisible($("auth-show").checked); });
    $("btn-auth-back").addEventListener("click", function () { afterAuth = null; (authBack || showStart)(); });
    $("btn-delete").addEventListener("click", function () { $("delete-confirm").hidden = false; $("btn-delete").hidden = true; $("btn-delete-no").focus(); });
    $("btn-delete-no").addEventListener("click", function () { $("delete-confirm").hidden = true; $("btn-delete").hidden = false; });
    $("btn-delete-yes").addEventListener("click", deleteProfile);
    refreshMe();
  }

  // ---------------------------------------------------------------- wire up
  $("btn-start").addEventListener("click", newGame);
  $("btn-next").addEventListener("click", next);
  $("btn-again").addEventListener("click", newGame);
  $("ll-removeWrong").addEventListener("click", useRemoveWrong);
  $("ll-stopClock").addEventListener("click", useStopClock);
  $("ll-phoneFriend").addEventListener("click", usePhoneFriend);

  setupLeaderboardUi();
  setupProfileUi();
  showStart();
})();
