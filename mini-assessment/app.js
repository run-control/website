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
  const gaugeContainer = document.getElementById("gauge");
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
    (config.texts && config.texts.gapsTitle) || "Opportunities for improvement";
  ctaEl.textContent = (config.cta && config.cta.text) || "";
  ctaEl.href = (config.cta && config.cta.url) || "#";

  // Build gauge
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
  function buildGauge() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    const max = (config.questions ? config.questions.length : 0) * 3;
    const segments = [
      { size: 10, color: "--color-risk-high" },
      { size: 10, color: "--color-risk-medium" },
      { size: 9, color: "--color-risk-low" },
      { size: 1, color: "--color-risk-min" },
    ];
    let start = -120;
    segments.forEach((seg) => {
      const end = start + (seg.size / max) * 240;
      const p = document.createElementNS(svgNS, "path");
      p.setAttribute("d", describeArc(100, 100, 90, start, end));
      p.setAttribute(
        "stroke",
        getComputedStyle(root).getPropertyValue(seg.color).trim(),
      );
      p.setAttribute("stroke-width", "20");
      p.setAttribute("fill", "none");
      svg.appendChild(p);
      start = end;
    });
    for (let i = 0; i <= max; i += 5) {
      const angle = -120 + (i / max) * 240;
      const outer = polarToCartesian(100, 100, 90, angle);
      const inner = polarToCartesian(100, 100, i % 10 === 0 ? 70 : 80, angle);
      const tick = document.createElementNS(svgNS, "line");
      tick.setAttribute("x1", inner.x);
      tick.setAttribute("y1", inner.y);
      tick.setAttribute("x2", outer.x);
      tick.setAttribute("y2", outer.y);
      tick.setAttribute("stroke", "var(--stroke-white)");
      tick.setAttribute("stroke-width", i % 10 === 0 ? 3 : 1.5);
      svg.appendChild(tick);
    }
    [0, 10, 20, 30].forEach((val) => {
      const angle = -120 + (val / max) * 240;
      const pt = polarToCartesian(100, 100, 60, angle);
      const txt = document.createElementNS(svgNS, "text");
      txt.setAttribute("x", pt.x);
      txt.setAttribute("y", pt.y);
      txt.setAttribute("fill", "var(--text)");
      txt.setAttribute("font-size", "12");
      txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("dominant-baseline", "central");
      txt.textContent = val;
      svg.appendChild(txt);
    });
    const needleGroup = document.createElementNS(svgNS, "g");
    needleGroup.style.transformOrigin = "100px 100px";
    const needle = document.createElementNS(svgNS, "line");
    needle.setAttribute("x1", "100");
    needle.setAttribute("y1", "100");
    needle.setAttribute("x2", "100");
    needle.setAttribute("y2", "20");
    needle.setAttribute("stroke", "var(--accent-blue)");
    needle.setAttribute("stroke-width", "4");
    needleGroup.appendChild(needle);
    svg.appendChild(needleGroup);
    const hub = document.createElementNS(svgNS, "circle");
    hub.setAttribute("cx", "100");
    hub.setAttribute("cy", "100");
    hub.setAttribute("r", "6");
    hub.setAttribute("fill", "var(--surface)");
    hub.setAttribute("stroke", "var(--accent-blue)");
    hub.setAttribute("stroke-width", "2");
    svg.appendChild(hub);
    gaugeContainer.appendChild(svg);
    needleGroup.style.transform = "rotate(-120deg)";
    return needleGroup;
  }
  const needle = buildGauge();

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

  function animateGauge(score) {
    const max = fieldsets.length * 3;
    const angle = -120 + (score / max) * 240;
    const prefers = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    needle.style.transition = prefers ? "none" : "transform 1.6s ease-out";
    requestAnimationFrame(() => {
      needle.style.transform = `rotate(${angle}deg)`;
    });
  }
  function complete(opts = {}) {
    let total = 0;
    const gapsBySeverity = { 0: [], 1: [], 2: [] };
    fieldsets.forEach((wrap, i) => {
      const sel = wrap.querySelector("input:checked");
      const val = parseInt(sel.value, 10);
      total += val;
      if (val < 3) {
        gapsBySeverity[val].push({
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
    scoreBandEl.textContent = band.label;
    scoreBandEl.style.backgroundColor = zoneColor;
    gaugeContainer.setAttribute(
      "aria-label",
      `Score ${total} out of ${max}, ${band.label}`,
    );
    gaugeContainer.setAttribute("role", "img");

    gapsEl.innerHTML = "";
    const severityMap = {
      0: { label: (config.texts && config.texts.severityCritical) || "Critical" },
      1: { label: (config.texts && config.texts.severityMajor) || "Major" },
      2: { label: (config.texts && config.texts.severityMinor) || "Minor" },
    };
    const order = [0, 1, 2];
    let totalGaps = 0;
    order.forEach((sev) => {
      const list = gapsBySeverity[sev];
      if (!list.length) return;
      const group = document.createElement("section");
      group.className = `gap-group severity-${sev}`;
      const h = document.createElement("h5");
      h.textContent = `${severityMap[sev].label} (${list.length})`;
      group.appendChild(h);
      const ul = document.createElement("ul");
      ul.setAttribute("role", "list");
      list.forEach((g) => {
        const li = document.createElement("li");
        li.className = "gap-item";
        li.textContent = `${g.q} – ${g.a}: ${g.risk || ""}`;
        ul.appendChild(li);
      });
      group.appendChild(ul);
      gapsEl.appendChild(group);
      totalGaps += list.length;
    });
    if (totalGaps) {
      gapsTitleEl.hidden = false;
      gapsEl.hidden = false;
    } else {
      gapsTitleEl.hidden = false;
      gapsEl.hidden = false;
      const p = document.createElement("p");
      p.textContent =
        (config.texts && config.texts.noGaps) || "No immediate gaps detected";
      gapsEl.appendChild(p);
    }
    form.style.display = "none";
    nextBtn.style.display = "none";
    backBtn.style.display = "none";
    progress.hidden = true;
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
    results.focus();
    animateGauge(total);
    const lines = results.querySelectorAll(".fade-line");
    const prefers = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    lines.forEach((el) => {
      if (el.hidden) return;
      if (prefers) {
        el.classList.add("show");
      } else if (el.id === "gaps" || el.id === "gaps-title") {
        setTimeout(() => el.classList.add("show"), 1600);
      } else {
        el.classList.add("show");
      }
    });
    setTimeout(() => {
      const items = gapsEl.querySelectorAll(".gap-item");
      items.forEach((li, idx) => {
        if (prefers) {
          li.classList.add("show");
        } else {
          li.style.transitionDelay = `${idx * 60}ms`;
          li.classList.add("show");
        }
      });
    }, prefers ? 0 : 1600);
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "assessment_complete",
        score: total,
        critical_gaps: gapsBySeverity[0].length,
        major_gaps: gapsBySeverity[1].length,
        minor_gaps: gapsBySeverity[2].length,
      });
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
    gapsTitleEl.hidden = true;
    gapsEl.hidden = true;
    needle.style.transition = "none";
    needle.style.transform = "rotate(-120deg)";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
