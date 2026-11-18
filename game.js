(function () {
  "use strict";

  var ROUND_LENGTH = 10;
  var STORAGE_KEY = "melsQuiz.best";

  var $ = function (id) { return document.getElementById(id); };
  var screens = { start: $("screen-start"), question: $("screen-question"), end: $("screen-end") };

  var round = [];
  var index = 0;
  var score = 0;
  var answered = false;

  // ---- helpers
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

  // ---- best score (localStorage may be unavailable, so never let it crash the game)
  function loadBest() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data && typeof data.score === "number" && typeof data.total === "number") return data;
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveBest(data) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function bestText(best) {
    return best ? "Your best score: " + best.score + " out of " + best.total : "";
  }

  function showStart() {
    var best = loadBest();
    var el = $("best-start");
    el.hidden = !best;
    el.textContent = bestText(best);
    show("start");
    $("btn-start").focus();
  }

  // ---- a round
  function startRound() {
    round = shuffle(QUESTIONS).slice(0, ROUND_LENGTH); // no repeats within a round
    index = 0;
    score = 0;
    show("question");
    showQuestion();
  }

  function showQuestion() {
    answered = false;
    var item = round[index];
    $("progress-text").textContent = "Question " + (index + 1) + " of " + round.length;
    $("score-text").textContent = "Score: " + score;
    $("progress-fill").style.width = (index / round.length * 100) + "%";
    $("question-text").textContent = item.q;
    $("feedback").hidden = true;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("btn-next").hidden = true;

    var box = $("options");
    box.innerHTML = "";
    shuffle(item.options).forEach(function (text) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn option";
      b.textContent = text;
      b.addEventListener("click", function () { choose(b, text); });
      box.appendChild(b);
    });
    $("question-text").focus();
  }

  var CHEERS = ["Well done!", "Brilliant!", "Spot on!", "Lovely, that's right!", "Great answer!", "You've got it!"];
  var CONSOLATIONS = ["Never mind!", "Oh, so close!", "Not to worry!", "Good try!", "Don't worry, that was a tricky one!"];

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function choose(button, text) {
    if (answered) return;
    answered = true;
    var item = round[index];
    var right = (text === item.answer);
    var fb = $("feedback");

    Array.prototype.forEach.call($("options").children, function (b) {
      b.disabled = true;
      if (b.textContent === item.answer) b.classList.add("correct");
      else if (b === button) b.classList.add("wrong");
      else b.classList.add("dim");
    });

    if (right) {
      score++;
      fb.textContent = "✔ " + pick(CHEERS);
      fb.className = "feedback good";
    } else {
      fb.textContent = "✘ " + pick(CONSOLATIONS) + " The right answer was: " + item.answer;
      fb.className = "feedback bad";
    }
    fb.hidden = false;
    $("score-text").textContent = "Score: " + score;
    $("progress-fill").style.width = ((index + 1) / round.length * 100) + "%";

    var next = $("btn-next");
    next.textContent = (index === round.length - 1) ? "See my score" : "Next question";
    next.hidden = false;
    next.focus();
  }

  function next() {
    if (index < round.length - 1) {
      index++;
      showQuestion();
    } else {
      finish();
    }
  }

  function message(s, total) {
    var ratio = s / total;
    if (s === total) return "Perfect score! You're a quiz star! 🌟";
    if (ratio >= 0.8) return "Fantastic! You really know your stuff!";
    if (ratio >= 0.6) return "Very well done! That's a cracking score.";
    if (ratio >= 0.4) return "Good effort! Have another go and see if you can beat it.";
    return "Thanks for playing! Every quiz teaches you something new, so have another go.";
  }

  function finish() {
    var total = round.length;
    var best = loadBest();
    var newBest = !best || score > best.score;
    if (newBest) { best = { score: score, total: total }; saveBest(best); }

    $("end-score").textContent = score + " out of " + total;
    $("end-message").textContent = message(score, total);
    $("end-best").textContent = newBest && score > 0
      ? "🎉 That's a new best score!"
      : bestText(best);
    show("end");
    $("end-title").focus();
  }

  $("btn-start").addEventListener("click", startRound);
  $("btn-next").addEventListener("click", next);
  $("btn-again").addEventListener("click", startRound);

  showStart();
})();
