(function () {
  const config = window.ASSESSMENT_CONFIG;
  if (!config) {
    console.error("Configuration missing");
    return;
  }
  const root = document.documentElement;
  const brand = Object.assign(
    {
      bg: "#000000",
      surface: "#0A0A0A",
      surfaceElev: "#0E0E0E",
      text: "#FFFFFF",
      muted: "#A9B1BC",
      accentOrange: "#FF8A00",
      accentBlue: "#00AEEF",
      headerBarColor: "#00172C",
      headerBarHeight: "8px",
      border: "rgba(0,174,239,0.35)",
      shadow: "0 8px 30px rgba(0,0,0,0.45)",
      strokeWhite: "rgba(255,255,255,0.85)",
    },
    config.brand || {},
  );
  const setVar = (name, value) =>
    value !== undefined && root.style.setProperty(name, value);
  Object.entries({
    "--bg": brand.bg,
    "--surface": brand.surface,
    "--surface-elev": brand.surfaceElev,
    "--text": brand.text,
    "--muted": brand.muted,
    "--accent-orange": brand.accentOrange,
    "--accent-blue": brand.accentBlue,
    "--header-navy": brand.headerBarColor,
    "--header-bar-height": brand.headerBarHeight,
    "--border": brand.border,
    "--shadow": brand.shadow,
    "--stroke-white": brand.strokeWhite,
    "--color-risk-high": brand.riskHigh,
    "--color-risk-medium": brand.riskMedium,
    "--color-risk-low": brand.riskLow,
    "--color-risk-min": brand.riskMin,
    "--dial-color": brand.accentBlue,
  }).forEach(([k, v]) => setVar(k, v));

  const logoEl = document.getElementById("site-logo");
  const taglineEl = document.getElementById("site-tagline");
  if (logoEl && brand.logoUrl) logoEl.src = brand.logoUrl;
  if (taglineEl && brand.tagline) taglineEl.textContent = brand.tagline;

  const form = document.getElementById("assessment-form");
  const backBtn = document.getElementById("back");
  const nextBtn = document.getElementById("next");
  const progress = document.getElementById("progress");
  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");
  const results = document.getElementById("results");
  const headlineEl = document.getElementById("result-headline");
  const messageEl = document.getElementById("result-message");
  const gapsTitleEl = document.getElementById("gaps-title");
  const gapsEl = document.getElementById("gaps");
  const ctaEl = document.getElementById("cta");
  const restartBtn = document.getElementById("restart");
  const scoreValueEl = document.getElementById("score-value");
  const scoreBandEl = document.getElementById("score-band");
  const dialContainer = document.getElementById("dial");
  const selectionLive = document.getElementById("selection-live");

  const wizard = config.wizard || {};
  const autoAdvance = !!wizard.autoAdvance;
  const useHistory = !!wizard.history;
  const advanceDelay = wizard.delay || 220;

  let autoTimer;
  let isAdvancing = false;

  if (autoAdvance) nextBtn.style.display = "none";

  restartBtn.textContent =
    (config.texts && config.texts.startOver) || "Retake assessment";
  gapsTitleEl.textContent =
    (config.texts && config.texts.gapsTitle) || "Where you lost points";
  ctaEl.textContent = (config.cta && config.cta.text) || "";
  ctaEl.href = (config.cta && config.cta.url) || "#";

  // Build dial
  function polarToCartesian(cx, cy, r, angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function describeArc(x, y, r, start, end) {
    const startPt = polarToCartesian(x, y, r, end);
    const endPt = polarToCartesian(x, y, r, start);
    const largeArc = end - start <= 180 ? 0 : 1;
    return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 0 ${endPt.x} ${endPt.y}`;
  }
  function buildDial() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    const max = (config.questions ? config.questions.length : 0) * 3;
    const segments = [
      { size: 10, color: "--color-risk-high" },
      { size: 10, color: "--color-risk-medium" },
      { size: 9, color: "--color-risk-low" },
      { size: 1, color: "--color-risk-min" },
    ];
    let start = -90;
    segments.forEach((seg) => {
      const end = start + (seg.size / max) * 360;
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", describeArc(50, 50, 45, start, end));
      p.setAttribute("stroke", getComputedStyle(root).getPropertyValue(seg.color).trim());
      p.setAttribute("stroke-width", "10");
      p.setAttribute("fill", "none");
      p.setAttribute("stroke-linecap", "round");
      svg.appendChild(p);
      start = end;
    });
    const score = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    score.setAttribute("cx", "50");
    score.setAttribute("cy", "50");
    score.setAttribute("r", "45");
    score.setAttribute("fill", "none");
    score.setAttribute("stroke", "var(--dial-color)");
    score.setAttribute("stroke-width", "10");
    score.setAttribute("stroke-linecap", "round");
    score.setAttribute("transform", "rotate(-90 50 50)");
    const circ = 2 * Math.PI * 45;
    score.setAttribute("stroke-dasharray", circ);
    score.setAttribute("stroke-dashoffset", circ);
    score.classList.add("score-arc");
    svg.appendChild(score);
    dialContainer.appendChild(svg);
    return score;
  }
  const scoreArc = buildDial();

  // Render questions
  const fieldsets = [];
  if (Array.isArray(config.questions)) {
    config.questions.forEach((q, idx) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("q-card");
      wrapper.hidden = true;
      const fs = document.createElement("fieldset");
      fs.tabIndex = -1;
      const lg = document.createElement("legend");
      lg.className = "q-head";
      lg.textContent = q.text || `Question ${idx + 1}`;
      const body = document.createElement("div");
      body.className = "q-body";
      fs.append(lg, body);
      q.options.forEach((opt) => {
        const label = document.createElement("label");
        label.classList.add("option");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q${idx}`;
        input.value = opt.score;
        if (opt.risk) input.dataset.risk = opt.risk;
        input.dataset.option = opt.label;
        const text = document.createElement("span");
        text.className = "option-text";
        text.textContent = opt.label;
        label.append(input, text);
        input.addEventListener("change", () => {
          fs.removeAttribute("aria-invalid");
          const help = fs.querySelector(".help");
          if (help) help.hidden = true;
          wrapper
            .querySelectorAll("label.option")
            .forEach((l) => l.classList.toggle("selected", l === label));
          updateNextState();
          if (selectionLive) {
            selectionLive.textContent = `${opt.label} selected`;
          }
          if (autoAdvance) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => {
              gotoNext();
            }, advanceDelay);
          }
        });
        body.appendChild(label);
      });
      const help = document.createElement("p");
      help.className = "help";
      help.textContent = "Please select an option.";
      help.hidden = true;
      fs.appendChild(help);
      wrapper.appendChild(fs);
      form.appendChild(wrapper);
      fieldsets.push(wrapper);
    });
  } else {
    form.textContent = "Configuration error: no questions defined.";
  }

  let current = 0;

  function updateProgress() {
    progressText.textContent = `Question ${current + 1} of ${fieldsets.length}`;
    const ratio = current / fieldsets.length;
    progressBar.style.transform = `scaleX(${ratio})`;
    nextBtn.textContent =
      current === fieldsets.length - 1
        ? (config.texts && config.texts.seeResults) || "See Results"
        : (config.texts && config.texts.next) || "Next";
  }

  function updateNextState() {
    const sel =
      fieldsets[current] && fieldsets[current].querySelector("input:checked");
    nextBtn.disabled = !sel;
  }

  function showQuestion(idx, opts = {}) {
    clearTimeout(autoTimer);
    current = idx;
    fieldsets.forEach((wrap, i) => {
      if (i === idx) {
        wrap.hidden = false;
        requestAnimationFrame(() => wrap.classList.add("active"));
      } else {
        wrap.classList.remove("active");
        wrap.hidden = true;
      }
    });
    updateProgress();
    updateNextState();
    backBtn.disabled = idx === 0;
    fieldsets[idx].scrollIntoView({ behavior: "smooth", block: "center" });
    fieldsets[idx].querySelector("fieldset").focus();

    if (useHistory && opts.updateHistory !== false) {
      const url = new URL(window.location);
      url.searchParams.set("step", idx + 1);
      if (opts.replace) {
        history.replaceState({ step: idx }, "", url);
      } else {
        history.pushState({ step: idx }, "", url);
      }
    }
  }

  if (fieldsets.length) {
    progress.hidden = false;
    let startIdx = 0;
    if (useHistory) {
      const params = new URLSearchParams(location.search);
      const stepParam = params.get("step");
      const parsed = parseInt(stepParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= fieldsets.length) {
        startIdx = parsed - 1;
      }
    }
    showQuestion(startIdx, { replace: true });
  }

  function animateDial(score) {
    const max = fieldsets.length * 3;
    const circ = 2 * Math.PI * 45;
    const offset = circ * (1 - score / max);
    const prefers = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    scoreArc.style.transition = prefers
      ? "none"
      : "stroke-dashoffset 1.6s ease-out";
    requestAnimationFrame(() => {
      scoreArc.style.strokeDashoffset = offset;
    });
  }
  function complete(opts = {}) {
    let total = 0;
    const gaps = [];
    fieldsets.forEach((wrap, i) => {
      const sel = wrap.querySelector("input:checked");
      const val = parseInt(sel.value, 10);
      total += val;
      if (val < 3) {
        gaps.push({
          q: config.questions[i].text,
          a: sel.dataset.option,
          risk: sel.dataset.risk,
        });
      }
    });
    const max = fieldsets.length * 3;
    scoreValueEl.textContent = `${total}/${max}`;
    scoreValueEl.setAttribute("aria-label", `Score ${total} out of ${max}`);
    const range =
      config.ranges &&
      config.ranges.find((r) => total >= r.min && total <= r.max);
    if (range) {
      headlineEl.textContent = range.title;
      messageEl.textContent = range.message;
    } else {
      headlineEl.textContent = "Score range missing";
      messageEl.textContent = "This score has no configured message.";
    }
    let band = { label: "Low", colorVar: "--color-risk-low" };
    if (total === max) band = { label: "Perfect", colorVar: "--color-risk-min" };
    else if (total <= 10)
      band = { label: "High", colorVar: "--color-risk-high" };
    else if (total <= 20)
      band = { label: "Medium", colorVar: "--color-risk-medium" };
    else if (total <= 29) band = { label: "Low", colorVar: "--color-risk-low" };

    const zoneColor = getComputedStyle(root)
      .getPropertyValue(band.colorVar)
      .trim();
    setVar("--dial-color", zoneColor);
    scoreBandEl.textContent = band.label;
    scoreBandEl.style.backgroundColor = zoneColor;
    dialContainer.setAttribute(
      "aria-label",
      `Score ${total} out of ${max} (${band.label})`,
    );
    dialContainer.setAttribute("role", "img");

    gapsEl.innerHTML = "";
    gaps.forEach((g) => {
      const li = document.createElement("li");
      li.textContent = `${g.q} – ${g.a}: ${g.risk || ""}`;
      gapsEl.appendChild(li);
    });
    if (gaps.length) {
      gapsTitleEl.hidden = false;
      gapsEl.hidden = false;
    } else {
      gapsTitleEl.hidden = true;
      gapsEl.hidden = true;
    }
    form.style.display = "none";
    nextBtn.style.display = "none";
    backBtn.style.display = "none";
    progress.hidden = true;
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
    results.focus();
    animateDial(total);
    const lines = results.querySelectorAll(".fade-line");
    const prefers = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let delay = 0;
    lines.forEach((el) => {
      if (el.hidden) return;
      if (prefers) {
        el.classList.add("show");
      } else {
        setTimeout(() => el.classList.add("show"), delay);
        delay += 500;
      }
    });
    if (window.dataLayer) {
      window.dataLayer.push({ event: "assessment_complete", score: total });
    }
    if (useHistory && opts.updateHistory !== false) {
      const url = new URL(window.location);
      url.searchParams.set("step", "results");
      history.pushState({ step: "results" }, "", url);
    }
  }

  function gotoNext() {
    if (isAdvancing) return;
    isAdvancing = true;
    const wrap = fieldsets[current];
    const fs = wrap.querySelector("fieldset");
    const selected = wrap && wrap.querySelector("input:checked");
    if (!selected) {
      fs.setAttribute("aria-invalid", "true");
      const help = fs.querySelector(".help");
      if (help) help.hidden = false;
      wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      fs.focus();
      isAdvancing = false;
      return;
    }
    fs.removeAttribute("aria-invalid");
    if (current < fieldsets.length - 1) {
      showQuestion(current + 1);
      isAdvancing = false;
      return;
    }
    complete();
    isAdvancing = false;
  }

  backBtn.addEventListener("click", () => {
    if (isAdvancing) return;
    if (current > 0) showQuestion(current - 1);
  });

  nextBtn.addEventListener("click", () => {
    gotoNext();
  });

  if (useHistory) {
    window.addEventListener("popstate", (e) => {
      const step = e.state && e.state.step;
      if (step === "results") {
        complete({ updateHistory: false });
        return;
      }
      if (typeof step === "number" && step >= 0 && step < fieldsets.length) {
        form.style.display = "";
        backBtn.style.display = "";
        if (!autoAdvance) nextBtn.style.display = "";
        progress.hidden = false;
        results.hidden = true;
        showQuestion(step, { updateHistory: false });
      }
    });
  }

  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!nextBtn.disabled) gotoNext();
    }
  });

  restartBtn.addEventListener("click", () => {
    form.reset();
    fieldsets.forEach((wrap) => {
      wrap.hidden = true;
      const fs = wrap.querySelector("fieldset");
      fs.removeAttribute("aria-invalid");
      wrap.querySelectorAll("label.option").forEach((l) => l.classList.remove("selected"));
      const help = fs.querySelector(".help");
      if (help) help.hidden = true;
    });
    showQuestion(0, { replace: true });
    form.style.display = "";
    nextBtn.style.display = autoAdvance ? "none" : "";
    backBtn.style.display = "";
    progress.hidden = false;
    results.hidden = true;
    gapsEl.innerHTML = "";
    headlineEl.textContent = "";
    messageEl.textContent = "";
    scoreValueEl.textContent = "";
    scoreBandEl.textContent = "";
    results.querySelectorAll(".fade-line").forEach((el) => el.classList.remove("show"));
    const circ = 2 * Math.PI * 45;
    scoreArc.style.transition = "none";
    scoreArc.style.strokeDashoffset = circ;
    gapsTitleEl.hidden = true;
    gapsEl.hidden = true;
    setVar("--dial-color", brand.accentBlue);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
