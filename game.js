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

  // WEEKLY CHALLENGE (needs the leaderboard Worker). The questions are in weekly.js.
  // A wrong answer or a timeout loses `loseFraction` of that question's prize (never below £0) and doesn't end the run.
  // Easy and medium prizes come from `levels` above. Keep `loseFraction` at 0.5 so every amount stays a multiple of £25
  // (half of £250 is £125). Lifelines work as in the main game: once each per run, paid from the winnings.
  weekly: {
    questions: 10,
    loseFraction: 0.5
  },

  // Lifelines. Each can be used once per game (they never refill) and costs money from her winnings.
  // Every cost must be a multiple of £25 so every possible score stays a multiple of £25,
  // which the shared leaderboard requires. Keep the costs in step with LIFELINE_COSTS in leaderboard/src/endless.js.
  lifelines: {
    // `icon` is the little picture shown next to scores on the leaderboards and on the profile page.
    removeWrong: { label: "Remove a wrong answer", cost: 50, icon: "✂️" },
    stopClock:   { label: "Stop the clock",        cost: 50, icon: "⏱️" },
    phoneFriend: { label: "Ask Dec",               cost: 50, icon: "📞" },
    hint:        { label: "Hint",                  cost: 25, icon: "💡" }, // shows the question's `hint` from questions.js / weekly.js
    swap:        { label: "Swap the question",     cost: 50, icon: "🔄" }, // a fresh question at the same level (weekly: one of the topic's spares)
    double:      { label: "Double or nothing",     cost: 25, icon: "🎲" }  // right = double this prize; wrong = all the money goes back to £0
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
  var screens = { start: $("screen-start"), weekly: $("screen-weekly"), weeklyReady: $("screen-weekly-ready"), auth: $("screen-auth"), profile: $("screen-profile"), leaderboard: $("screen-leaderboard"), choose: $("screen-choose"), question: $("screen-question"), end: $("screen-end") };

  // ---- game state
  var money, asked, pools, usedLifelines, current, currentLevel, currentPrize, currentBig, lastQuestion;
  var lives, answeredBy, correctBy, bigCorrect, runId, lastRun;
  var mode = "endless";            // "endless" or "weekly"
  var weeklyState = null, weeklyTopic = null, weeklySlot = 0, wCorrect = 0, wWrong = 0, wLevels = null;
  var answered, endReason, doubleArmed = false, usedSpares = null;
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
    mode = "endless";
    money = CONFIG.startMoney;
    asked = 0;
    lives = CONFIG.endless.lives;
    usedLifelines = {};
    endReason = "";
    answeredBy = { easy: 0, medium: 0, hard: 0 };
    correctBy = { easy: 0, medium: 0, hard: 0 };
    bigCorrect = 0;
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
  function startQuestion(level, prize, big, fixedQuestion) {
    currentLevel = level;
    currentPrize = prize;
    currentBig = !!big;
    current = fixedQuestion || drawQuestion(level);
    asked++;
    answered = false;
    clockStopped = false;
    askDecBusy = false;
    doubleArmed = false;

    var weekly = (mode === "weekly");
    $("q-progress").textContent = weekly ? "Question " + asked + " of " + CONFIG.weekly.questions : "Question " + asked;
    $("q-hearts").hidden = weekly;
    renderHearts($("q-hearts"));
    $("q-topic").hidden = !weekly;
    if (weekly) $("q-topic").textContent = weeklyTopic.emoji + " " + weeklyTopic.title;
    $("q-level").textContent = weekly
      ? level.label + " question: win " + fmt(prize) + ", or lose " + fmt(lossFor(prize))
      : (big ? "Big hard question" : level.label + " question") + " for " + fmt(prize);
    $("q-level").className = "level-tag level-" + level.key + (big ? " level-big" : "");
    $("feedback").hidden = true;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("btn-next").hidden = true;
    $("double-panel").hidden = true;
    renderQuestion();

    updateMoney();
    updateLifelines();
    show("question");
    startTimer(CONFIG.secondsPerQuestion * 1000);
    $("question-text").focus();
  }

  // Shows `current` (its text and four shuffled options). Also used by "Swap the question".
  function renderQuestion() {
    $("question-text").textContent = current.q;
    $("friend-panel").hidden = true;
    $("hint-panel").hidden = true;

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
      b.innerHTML = '<span class="ll-name"><span class="ll-emoji" aria-hidden="true"></span><span class="ll-label"></span></span><span class="ll-cost"></span>';
      b.querySelector(".ll-emoji").textContent = ll.icon + " ";
      b.querySelector(".ll-label").textContent = ll.label;
      b.querySelector(".ll-cost").textContent = used ? "Used" : fmt(ll.cost);
      var unavailable = key === "swap" && !used && !canSwap();   // a weekly topic without spare questions
      b.disabled = answered || askDecBusy || used || !affordable || unavailable;
      b.classList.toggle("used", used);
      var why = used ? "already used" : (unavailable ? "no spare questions for this topic" : (!affordable ? "you can't afford this yet" : "costs " + fmt(ll.cost)));
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

  // Hint: shows the question's hint in a friendly box. The timer keeps running.
  function useHint() {
    if (!spend("hint")) return;
    $("hint-message").textContent = current.hint || "Sorry, there's no hint for this one. Go with your gut!";
    $("hint-panel").hidden = false;
    updateLifelines();
  }

  // Swap the question: a fresh question at the same level. The swapped-out one doesn't count as answered.
  // Endless: the next unseen question from that level's list. Weekly: one of the topic's spare questions,
  // the same level if there is one. The timer starts again (unless the clock has been stopped).
  function nextSpare() {
    var spares = (weeklyTopic && weeklyTopic.spares) || [];
    var fresh = spares.filter(function (sq) { return usedSpares.indexOf(sq) < 0; });
    var same = fresh.filter(function (sq) { return sq.level === currentLevel.key; });
    return same[0] || fresh[0] || null;
  }
  function canSwap() { return mode !== "weekly" || !!nextSpare(); }
  function useSwap() {
    if (!canSwap() || !spend("swap")) return;
    if (mode === "weekly") {
      var sq = nextSpare();
      usedSpares.push(sq);
      if (sq.level !== currentLevel.key) {         // only if a topic has no spare at this level
        currentLevel = levelByKey(sq.level);
        currentPrize = currentLevel.prize;
        $("q-level").textContent = currentLevel.label + " question: win " + fmt(currentPrize) + ", or lose " + fmt(lossFor(currentPrize));
        $("q-level").className = "level-tag level-" + currentLevel.key;
      }
      current = sq;
    } else {
      current = drawQuestion(currentLevel);
    }
    renderQuestion();
    if (clockStopped) renderTimer(); else startTimer(CONFIG.secondsPerQuestion * 1000);
    updateLifelines();
    $("question-text").focus();
  }

  // Double or nothing: right doubles this question's prize; wrong (or out of time) sends the money back to £0.
  function useDouble() {
    if (!spend("double")) return;
    doubleArmed = true;
    $("double-message").textContent = "🎲 Double or nothing! Get this right to win " + fmt(currentPrize * 2) + ". Get it wrong and your money goes back to " + fmt(0) + ".";
    $("double-panel").hidden = false;
    updateLifelines();
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

  function lossFor(prize) { return Math.round(prize * CONFIG.weekly.loseFraction); }

  function choose(button, text) {
    if (answered || askDecBusy) return;
    answered = true;
    pauseTimer();
    revealAnswer(button);
    settle(text === current.answer, false);
  }

  function timeUp() {
    if (answered) return;
    answered = true;
    stopTimer();
    revealAnswer(null);
    settle(false, true);
  }

  // Works out the money (and lives) after an answer or a timeout.
  function settle(right, timedOut) {
    var fb = $("feedback");
    var oops = timedOut ? "⏰ Time's up!" : "✘ " + pick(CONSOLATIONS);
    var reveal = " The right answer was: " + current.answer + (/[.!?]$/.test(current.answer) ? "" : ".");
    var won = doubleArmed ? currentPrize * 2 : currentPrize;   // Double or nothing
    $("double-panel").hidden = true;
    if (mode === "weekly") {
      wLevels[currentLevel.key].answered++;
      if (right) {
        wCorrect++;
        wLevels[currentLevel.key].correct++;
        money += won;
        fb.textContent = "✔ " + pick(CHEERS) + " You win " + fmt(won) + "!" + (doubleArmed ? " Double or nothing paid off! 🎲" : "");
        fb.className = "feedback good";
      } else if (doubleArmed) {
        wWrong++;
        money = 0;
        fb.textContent = oops + reveal + " Double or nothing didn't pay off, so your money goes back to " + fmt(0) + ".";
        fb.className = "feedback bad";
      } else {
        wWrong++;
        var lose = Math.min(money, lossFor(currentPrize));
        money -= lose;
        fb.textContent = oops + reveal + (lose > 0 ? " You lose " + fmt(lose) + "." : " You had nothing to lose, so you're still on " + fmt(money) + ".");
        fb.className = "feedback bad";
      }
      if (asked >= CONFIG.weekly.questions) endReason = "complete";
    } else {
      answeredBy[currentLevel.key]++;
      if (right) {
        correctBy[currentLevel.key]++;
        if (currentBig) bigCorrect++;
        money += won;
        fb.textContent = "✔ " + pick(CHEERS) + " You win " + fmt(won) + "!" + (doubleArmed ? " Double or nothing paid off! 🎲" : "");
        fb.className = "feedback good";
      } else {
        var reset = doubleArmed ? " Double or nothing didn't pay off, so your money goes back to " + fmt(0) + "." : "";
        if (doubleArmed) money = 0;
        loseLife();
        fb.textContent = oops + reveal + reset + lifeLine();
        fb.className = "feedback bad";
      }
    }
    afterAnswer();
  }

  function afterAnswer() {
    $("feedback").hidden = false;
    updateMoney();
    updateLifelines();
    var next = $("btn-next");
    if (mode === "weekly") next.textContent = endReason ? "See my result" : "Next question";
    else next.textContent = endReason ? "See what I won" : "Choose my next question";
    next.hidden = false;
    next.focus();
  }

  function next() {
    if (endReason) { finish(); return; }
    if (mode === "weekly") weeklyNext(); else showChoose();
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
    if (mode === "weekly") { finishWeekly(); return; }
    stopTimer();
    $("end-title").textContent = "Game over";
    $("btn-again").textContent = "Play again";
    var best = loadBest();
    var newBest = (best === null || money > best) && money > 0;
    if (newBest) { saveBest(money); best = money; }
    var total = sum(answeredBy), right = sum(correctBy);
    lastRun = {
      runId: runId,
      score: money,
      answered: { easy: answeredBy.easy, medium: answeredBy.medium, hard: answeredBy.hard },
      correct: { easy: correctBy.easy, medium: correctBy.medium, hard: correctBy.hard },
      bigCorrect: bigCorrect,
      lifelines: Object.keys(CONFIG.lifelines).filter(function (k) { return usedLifelines[k]; }),
      kind: "endless", saved: false, saving: false, result: null
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

  // The Worker's own words are only shown for ordinary "that didn't work" answers (wrong PIN, name taken, too quick...).
  // For anything else (for example the server hasn't been updated yet) we say something kinder.
  function friendlyError(err, doing) {
    if (err.serverMessage && [400, 401, 409, 429].indexOf(err.status) !== -1) return err.serverMessage;
    if (err.status === 0) return "Couldn't reach the game's server just now. Please check your connection and try again.";
    return "Sorry, " + doing + " isn't working just now. Please try again in a little while.";
  }

  function lifelineNames(keys) {
    return keys.map(function (k) { return CONFIG.lifelines[k] ? CONFIG.lifelines[k].label : k; });
  }

  // "12 easy · 5 medium · 3 hard · 2 big" with each part in its own colour. parts: [[count, word, cssClass] ...]
  function mixLine(parts) {
    var line = document.createElement("span");
    line.className = "board-mix";
    parts.filter(Boolean).forEach(function (p, i) {
      if (i > 0) line.appendChild(document.createTextNode(" · "));
      var part = document.createElement("span");
      part.className = "mix mix-" + p[2];
      part.textContent = p[0] + " " + p[1];
      line.appendChild(part);
    });
    return line;
  }

  // "Lifelines: ✂️ 📞" (little icons, each with its name for screen readers and on hover), or "No lifelines".
  function lifelineLine(list, noLifelines) {
    var line = document.createElement("span");
    line.className = "board-lifelines";
    if (!list) list = noLifelines ? [] : null;      // an old Worker only says whether any were used
    if (list && list.length === 0) {
      line.textContent = "No lifelines";
      return line;
    }
    if (!list) { line.textContent = "Used lifelines"; return line; }
    line.setAttribute("aria-label", "Lifelines used: " + lifelineNames(list).join(", "));
    line.title = "Used: " + lifelineNames(list).join(", ");
    line.appendChild(document.createTextNode("Lifelines: "));
    list.forEach(function (k) {
      var ic = document.createElement("span");
      ic.className = "ll-icon";
      ic.setAttribute("aria-hidden", "true");
      ic.textContent = CONFIG.lifelines[k] ? CONFIG.lifelines[k].icon : "?";
      line.appendChild(ic);
    });
    return line;
  }

  // Player names are untrusted: they are only ever put on the page with textContent, never innerHTML.
  function renderBoard(box, scores, kind, weekKey) {
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
        // e.g. "12 easy · 5 medium · 3 hard · 2 big": every question that run answered, by difficulty.
        // `answered.hard` includes the big every-10th ones, so they're taken off the hard count and shown separately.
        var a = row.answered || { easy: 0, medium: 0, hard: 0 };
        var big = Math.min(row.big || 0, a.hard);
        meta.appendChild(mixLine([
          [a.easy, "easy", "easy"], [a.medium, "medium", "medium"], [a.hard - big, "hard", "hard"], big > 0 ? [big, "big", "big"] : null
        ]));
      } else {
        // The one weekly board mixes all three topics, so each row says which topic it was for.
        var content = weekKey ? weekContent(weekKey) : null;
        var topic = content && content.topics[row.slot];
        if (topic) {
          var tp = document.createElement("span");
          tp.className = "board-topic";
          tp.textContent = topic.emoji + " " + topic.title;
          meta.appendChild(tp);
        }
        var wd = document.createElement("span");
        wd.className = "board-detail";
        var wrong = (typeof row.wrong === "number") ? row.wrong : CONFIG.weekly.questions - row.correct;
        wd.textContent = row.correct + "/" + CONFIG.weekly.questions + " right · " + wrong + " wrong";
        meta.appendChild(wd);
      }
      meta.appendChild(lifelineLine(row.lifelines, row.noLifelines));
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
      renderBoard(box, data.scores, kind, data.week);
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

  // ---- the Leaderboard screen from the start page: Top 25 / No lifelines
  var lbTab = "overall";
  var lbBack = null;
  function showLeaderboardScreen() {
    lbBack = showStart;
    lbTab = "overall";
    $("leaderboard-title").textContent = "🏆 Top 25 leaderboard";
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
      ? "The 25 best games. Each player can be on it up to three times, with their best three games."
      : "Only games where no lifeline was used (up to three per player).";
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
    var weekly = (run.kind === "weekly");
    $("end-guest").hidden = true;
    $("btn-end-retry").hidden = true;
    $("btn-end-boards").hidden = true;
    $("board-end").innerHTML = "";
    endStatus("");
    if (!session) {
      $("end-guest").hidden = false;
      $("end-guest-text").textContent = weekly
        ? "You've been signed out. Sign in to save your " + fmt(run.score) + " for this week's leaderboard."
        : run.score > 0
        ? "Want your " + fmt(run.score) + " on the leaderboard? Make a profile (or sign in) and your score is saved."
        : "Make a profile (or sign in) to save your games and join the leaderboards.";
      return;
    }
    if (run.saved) { (weekly ? showSavedWeekly : showSavedResult)(run.result); return; }
    saveRun();
  }

  function showSavedResult(data) {
    var msg;
    if (data.rank && data.rank <= data.scores.length) msg = "🎉 " + (data.newBest ? "New personal best! " : "") + "You're number " + data.rank + " on the leaderboard!";
    else if (data.rank) msg = "Saved! You're number " + data.rank + " on the leaderboard. Keep going to reach the top 25.";
    else if (lastRun.score > 0 && data.rankNoLifelines && lastRun.lifelines.length === 0) msg = "Saved! It isn't one of your best three games overall, but you're number " + data.rankNoLifelines + " on the No lifelines board.";
    else if (lastRun.score > 0) msg = "Saved! That wasn't one of your best three games, so it isn't on the leaderboard.";
    else msg = "Saved to your profile.";
    if (data.rank && data.rankNoLifelines && lastRun.lifelines.length === 0) msg += " And number " + data.rankNoLifelines + " with no lifelines.";
    endStatus(msg, "");
    renderBoard($("board-end"), data.scores, "endless");
    $("btn-end-boards").hidden = false;
  }

  function showSavedWeekly(data) {
    var msg;
    if (data.rank && data.rank <= data.scores.length) msg = "🎉 You're number " + data.rank + " on this week's leaderboard with " + weeklyTopic.title + "!";
    else if (data.rank) msg = "Saved! You're number " + data.rank + " this week. Not in the top 10 this time.";
    else msg = "Saved. No money won this time, but thanks for playing!";
    endStatus(msg, "");
    renderBoard($("board-end"), data.scores, "weekly", data.week);
    $("btn-end-boards").hidden = true;
  }

  function saveRun() {
    var run = lastRun;
    if (!run || run.saved || run.saving) return;
    run.saving = true;
    endStatus("Saving your score...", "plain");
    $("btn-end-retry").hidden = true;
    var weekly = (run.kind === "weekly");
    var request = weekly
      ? apiRequest("POST", "/weekly/finish", { slot: run.slot, score: run.score, correct: run.correct, wrong: run.wrong, lifelines: run.lifelines, levels: run.levels })
      : apiRequest("POST", "/runs", { runId: run.runId, score: run.score, answered: run.answered, correct: run.correct, bigCorrect: run.bigCorrect, lifelines: run.lifelines });
    request.then(function (data) {
      run.saving = false; run.saved = true; run.result = data;
      me = data.profile;
      if (lastRun === run && !screens.end.hidden) (weekly ? showSavedWeekly : showSavedResult)(data);
    }).catch(function (err) {
      run.saving = false;
      if (lastRun !== run || screens.end.hidden) return;
      if (!session) { renderEndSave(); return; }   // our sign-in stopped working: offer to sign in again
      endStatus(friendlyError(err, "saving scores"), "bad");
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
    $("btn-board-back").addEventListener("click", function () { (lbBack || showStart)(); });
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
      msg.textContent = friendlyError(err, authMode === "create" ? "making profiles" : "signing in");
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
    show("profile");
    $("profile-title").focus();
    loadStats();
    refreshMe();
  }
  // ---- the stats page. Everything is worked out by the Worker (GET /me/stats) from the player's saved runs.
  var statsToken = 0;
  function loadStats() {
    var box = $("stats-body");
    var mine = ++statsToken;
    box.innerHTML = "";
    var wait = document.createElement("p");
    wait.className = "small-note";
    wait.textContent = "Loading your stats...";
    box.appendChild(wait);
    apiRequest("GET", "/me/stats").then(function (data) {
      if (mine === statsToken) renderStats(data.stats);
    }).catch(function (err) {
      if (mine !== statsToken) return;
      box.innerHTML = "";
      var msg = document.createElement("p");
      msg.className = "board-error";
      msg.textContent = friendlyError(err, "the stats page");
      var retry = document.createElement("button");
      retry.type = "button";
      retry.className = "btn btn-secondary";
      retry.textContent = "Try again";
      retry.addEventListener("click", loadStats);
      box.appendChild(msg);
      box.appendChild(retry);
    });
  }

  function dash(v, format) { return (v === null || v === undefined) ? "\u2014" : (format ? format(v) : String(v)); }
  function pct(part, whole) { return whole > 0 ? Math.round(part / whole * 100) + "%" : "\u2014"; }
  function num(n) { return Number(n || 0).toLocaleString("en-GB"); }

  function statTiles(items) {
    var dl = document.createElement("dl");
    dl.className = "stats";
    items.forEach(function (it) {
      var div = document.createElement("div");
      if (it.wide) div.className = "wide";
      var dt = document.createElement("dt");
      dt.textContent = it.label;
      var dd = document.createElement("dd");
      dd.textContent = it.value;
      if (it.small) dd.className = "small";
      if (it.sub) {
        var sub = document.createElement("span");
        sub.className = "sub";
        sub.textContent = it.sub;
        dd.appendChild(sub);
      }
      div.appendChild(dt); div.appendChild(dd);
      dl.appendChild(div);
    });
    return dl;
  }

  function statRows(items) {
    var ul = document.createElement("ul");
    ul.className = "stat-rows";
    items.forEach(function (it) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.className = "sr-name";
      name.textContent = it.name;
      var val = document.createElement("span");
      val.className = "sr-val";
      val.textContent = it.value;
      if (it.sub) {
        var small = document.createElement("small");
        small.textContent = it.sub;
        val.appendChild(small);
      }
      li.appendChild(name); li.appendChild(val);
      ul.appendChild(li);
    });
    return ul;
  }

  function statHeading(text) {
    var h = document.createElement("h3");
    h.className = "stats-heading";
    h.textContent = text;
    return h;
  }

  function renderStats(st) {
    var box = $("stats-body");
    box.innerHTML = "";
    var q = st.questions, m = st.money, e = st.endless, w = st.weekly, lv = st.byLevel, ll = st.lifelines;
    var since = st.memberSince ? new Date(st.memberSince) : null;
    var sinceText = since && !isNaN(since.getTime())
      ? since.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }) : "\u2014";

    box.appendChild(statTiles([
      { label: "Questions answered", value: num(q.answered) },
      { label: "Questions right", value: num(q.correct) },
      { label: "Accuracy", value: q.accuracy === null ? "\u2014" : q.accuracy + "%" },
      { label: "Money earned", value: fmt(m.total), sub: "all your games" },
      { label: "Member since", value: sinceText, small: true, wide: true }
    ]));

    box.appendChild(statHeading("Endless game"));
    box.appendChild(statTiles([
      { label: "Best score", value: dash(e.best, fmt) },
      { label: "Average score", value: dash(e.average, fmt) },
      { label: "Games played", value: num(e.games) },
      { label: "Longest run", value: dash(e.longestRun), sub: e.longestRun === null ? "" : (e.longestRun === 1 ? "question" : "questions") }
    ]));

    box.appendChild(statHeading("Questions by difficulty"));
    var rows = [];
    CONFIG.levels.forEach(function (level) {
      var d = lv[level.key] || { answered: 0, correct: 0 };
      rows.push({ name: level.label, value: d.correct + " of " + d.answered + " right", sub: pct(d.correct, d.answered) });
    });
    rows.push({ name: "Big 10th questions", value: st.big.correct + " of " + st.big.answered + " right", sub: pct(st.big.correct, st.big.answered) });
    box.appendChild(statRows(rows));
    var note = document.createElement("p");
    note.className = "stats-note";
    note.textContent = "Hard includes the big ones. Weekly challenge questions count as easy or medium.";
    box.appendChild(note);

    box.appendChild(statHeading("Lifelines used"));
    var lrows = Object.keys(CONFIG.lifelines).map(function (k) {
      return { name: CONFIG.lifelines[k].icon + " " + CONFIG.lifelines[k].label, value: num(ll[k]) + (ll[k] === 1 ? " time" : " times") };
    });
    box.appendChild(statRows(lrows));

    box.appendChild(statHeading("Weekly challenge"));
    box.appendChild(statTiles([
      { label: "Runs played", value: num(w.runs) },
      { label: "Best weekly score", value: dash(w.best, fmt) },
      { label: "Total weekly winnings", value: fmt(w.winnings), wide: true }
    ]));
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
      msg.textContent = friendlyError(err, "deleting your profile");
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

  // ---------------------------------------------------------------- weekly challenge
  // 3 topics a week, 10 questions each, ONE go at each topic per profile. The Worker decides which week it is
  // (UK time) and remembers who has started what; the questions are in weekly.js, keyed by the Monday's date.
  function weekContent(key) {
    return (typeof WEEKLY !== "undefined" && WEEKLY[key]) ? WEEKLY[key] : null;
  }

  function longDate(iso) {
    var d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: iso.length === 10 ? "UTC" : "Europe/London" });
  }

  function showWeekly(note) {
    stopTimer();
    mode = "weekly-menu";
    $("weekly-msg").hidden = true;
    $("weekly-guest").hidden = true;
    $("weekly-topics").innerHTML = "";
    $("weekly-sub").textContent = "";
    $("weekly-note").hidden = !(typeof note === "string" && note);
    $("weekly-note").textContent = (typeof note === "string") ? note : "";
    show("weekly");
    $("weekly-title").focus();
    weeklyMessage("Loading this week's challenge...", false);
    apiRequest("GET", "/weekly/state").then(function (state) {
      weeklyState = state;
      renderWeekly();
    }).catch(function () {
      weeklyMessage("Couldn't load the weekly challenge just now. Please try again in a little while.", true);
    });
  }

  function weeklyMessage(text, withRetry) {
    var box = $("weekly-msg");
    box.hidden = false;
    box.innerHTML = "";
    var p = document.createElement("p");
    p.className = withRetry ? "board-error" : "small-note";
    p.textContent = text;
    box.appendChild(p);
    if (withRetry) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-secondary";
      b.textContent = "Try again";
      b.addEventListener("click", function () { showWeekly(); });
      box.appendChild(b);
    }
  }

  function runForSlot(slot) {
    var runs = (weeklyState && weeklyState.runs) || [];
    for (var i = 0; i < runs.length; i++) if (runs[i].slot === slot) return runs[i];
    return null;
  }

  function renderWeekly() {
    $("weekly-msg").hidden = true;
    var key = weeklyState.week.key;
    var content = weekContent(key);
    var signedIn = !!session && weeklyState.signedIn;
    var endsOn = longDate(new Date(Date.parse(weeklyState.week.endsAt) - 60000).toISOString());
    $("weekly-sub").textContent = "Week of " + longDate(key) + ". Ends Sunday night, " + endsOn + ". New topics every Monday.";
    $("weekly-guest").hidden = signedIn;
    if (!content) {
      weeklyMessage("There's no weekly challenge ready for this week yet. Please check back soon!", false);
      $("weekly-guest").hidden = true;
      return;
    }
    var box = $("weekly-topics");
    box.innerHTML = "";
    content.topics.forEach(function (topic, slot) {
      var run = runForSlot(slot);
      var card = document.createElement("div");
      card.className = "topic-card" + (run ? " played" : "");
      var head = document.createElement("div");
      head.className = "topic-head";
      var em = document.createElement("span");
      em.className = "topic-emoji";
      em.textContent = topic.emoji;
      em.setAttribute("aria-hidden", "true");
      var title = document.createElement("span");
      title.className = "topic-title";
      title.textContent = topic.title;
      head.appendChild(em); head.appendChild(title);
      var blurb = document.createElement("p");
      blurb.className = "topic-blurb";
      blurb.textContent = topic.blurb;
      card.appendChild(head); card.appendChild(blurb);

      if (run) {
        var st = document.createElement("p");
        st.className = "topic-status " + (run.status === "finished" ? "done" : "partial");
        st.textContent = run.status === "finished"
          ? "✔ Played. You scored " + fmt(run.score) + " (" + run.correct + " of " + CONFIG.weekly.questions + " right)."
          : "You started this one but didn't finish it, so it counts as your go.";
        card.appendChild(st);
      } else if (signedIn) {
        var play = document.createElement("button");
        play.type = "button";
        play.className = "btn btn-primary";
        play.textContent = "Play " + topic.title;
        play.addEventListener("click", function () { showWeeklyReady(slot); });
        card.appendChild(play);
      }
      box.appendChild(card);
    });
  }

  function showWeeklyReady(slot) {
    var content = weekContent(weeklyState.week.key);
    weeklyTopic = content.topics[slot];
    weeklySlot = slot;
    $("ready-topic").textContent = weeklyTopic.emoji + " " + weeklyTopic.title;
    $("ready-msg").textContent = "";
    $("btn-ready-start").disabled = false;
    $("btn-ready-start").textContent = "Start (one go only)";
    $("ready-rules").innerHTML = "";
    [
      weeklyTopic.questions.length + " questions, " + CONFIG.secondsPerQuestion + " seconds each.",
      "A right answer wins the prize: " + fmt(levelByKey("easy").prize) + " for an easy question, " + fmt(levelByKey("medium").prize) + " for a medium one.",
      "A wrong answer, or running out of time, loses half that prize. You can't go below " + fmt(0) + ", and a wrong answer doesn't end your go.",
      "Lifelines cost " + fmt(CONFIG.lifelines.hint.cost) + " or " + fmt(CONFIG.lifelines.removeWrong.cost) + ", come out of your winnings, and can be used once each. Double or nothing doubles a right answer, but a wrong one sends your money back to " + fmt(0) + ".",
      "You only get ONE go at this topic this week. Once you press Start it counts as played, even if you close the page."
    ].forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      $("ready-rules").appendChild(li);
    });
    show("weeklyReady");
    $("ready-title").focus();
  }

  function startWeeklyRun() {
    var btn = $("btn-ready-start");
    btn.disabled = true;
    btn.textContent = "Starting...";
    $("ready-msg").textContent = "";
    apiRequest("POST", "/weekly/start", { slot: weeklySlot }).then(function () {
      weeklyBegin();
    }).catch(function (err) {
      if (err.status === 409) { showWeekly("You've already had your go at that topic this week."); return; }
      if (!session) { showWeekly("Please sign in again."); return; }
      btn.disabled = false;
      btn.textContent = "Start (one go only)";
      $("ready-msg").textContent = friendlyError(err, "the weekly challenge");
    });
  }

  function weeklyBegin() {
    mode = "weekly";
    money = 0;
    asked = 0;
    usedLifelines = {};
    usedSpares = [];
    endReason = "";
    wCorrect = 0;
    wWrong = 0;
    wLevels = { easy: { answered: 0, correct: 0 }, medium: { answered: 0, correct: 0 } };
    lastRun = null;
    weeklyNext();
  }

  function weeklyNext() {
    var q = weeklyTopic.questions[asked];
    var level = levelByKey(q.level);
    startQuestion(level, level.prize, false, q);
  }

  function weeklyMessageFor(won) {
    if (won >= 2000) return "Amazing! You really know your stuff.";
    if (won >= 1000) return "Brilliant scoring!";
    if (won > 0) return "Nice one! See how you got on against everyone else below.";
    return "Not this time, but there are two more topics to try!";
  }

  function finishWeekly() {
    stopTimer();
    $("end-title").textContent = "Weekly challenge done!";
    $("end-reason").textContent = weeklyTopic.emoji + " " + weeklyTopic.title;
    $("end-won").textContent = "You scored " + fmt(money);
    $("end-summary").textContent = wCorrect + " right, " + wWrong + " wrong or timed out.";
    $("end-message").textContent = weeklyMessageFor(money);
    $("end-best").textContent = "";
    $("btn-again").textContent = "Back to the weekly challenge";
    lastRun = {
      kind: "weekly", slot: weeklySlot, score: money, correct: wCorrect, wrong: wWrong,
      levels: wLevels,
      lifelines: Object.keys(CONFIG.lifelines).filter(function (k) { return usedLifelines[k]; }),
      saved: false, saving: false, result: null
    };
    show("end");
    renderEndSave();
    $("end-title").focus();
  }

  // One leaderboard for the whole week, all three topics together (each topic go is its own row).
  function showWeeklyBoard() {
    lbBack = function () { showWeekly(); };
    $("leaderboard-title").textContent = "🏆 This week's top 10";
    $("lb-tabs").hidden = true;
    $("lb-sub").textContent = "All three topics together. Each go is its own row, so a player can be on it up to three times. The board starts afresh every Monday.";
    show("leaderboard");
    loadBoard($("board-main"), "/weekly/leaderboard", "weekly");
    $("leaderboard-title").focus();
  }

  function setupWeeklyUi() {
    if (!lbOn || typeof WEEKLY === "undefined") return;
    $("btn-weekly").hidden = false;
    $("btn-weekly").addEventListener("click", function () { showWeekly(); });
    $("btn-weekly-back").addEventListener("click", function () { showStart(); });
    $("btn-weekly-board").addEventListener("click", showWeeklyBoard);
    $("btn-ready-start").addEventListener("click", startWeeklyRun);
    $("btn-ready-back").addEventListener("click", function () { showWeekly(); });
    $("btn-weekly-create").addEventListener("click", function () { showAuth("create", showWeekly, showWeekly); });
    $("btn-weekly-signin").addEventListener("click", function () { showAuth("signin", showWeekly, showWeekly); });
  }

  // ---------------------------------------------------------------- wire up
  $("btn-start").addEventListener("click", newGame);
  $("btn-next").addEventListener("click", next);
  $("btn-again").addEventListener("click", function () { if (lastRun && lastRun.kind === "weekly") showWeekly(); else newGame(); });
  $("ll-removeWrong").addEventListener("click", useRemoveWrong);
  $("ll-stopClock").addEventListener("click", useStopClock);
  $("ll-phoneFriend").addEventListener("click", usePhoneFriend);
  $("ll-hint").addEventListener("click", useHint);
  $("ll-swap").addEventListener("click", useSwap);
  $("ll-double").addEventListener("click", useDouble);

  setupLeaderboardUi();
  setupProfileUi();
  setupWeeklyUi();
  showStart();
})();
