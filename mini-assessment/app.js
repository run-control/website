(function () {
  const config = window.ASSESSMENT_CONFIG;
  if (!config) {
    console.error("Configuration missing");
    return;
  }
  const root = document.documentElement;
  let quizSessionId =
    self.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.location.hash)
    history.replaceState(null, '', window.location.pathname + window.location.search);
  requestAnimationFrame(() => window.scrollTo(0, 0));
  window.addEventListener('load', () => window.scrollTo(0, 0));
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

  const chartSettings = Object.assign(
    { size: 220, thickness: 35 },
    config.chart || {},
  );
  setVar("--donut-size", `${chartSettings.size}px`);

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
  const gateSection = document.getElementById("lead-gate");
  const messageEl = document.getElementById("result-message");
  const gapsTitleEl = document.getElementById("gaps-title");
  const gapsEl = document.getElementById("gaps");
  if (!gapsTitleEl)
    console.warn('Element with id "gaps-title" not found; defaulting to section observer');
  const restartBtn = document.getElementById("restart");
  const scoreValueEl = document.getElementById("score-value");
  const scoreGradeEl = document.getElementById("score-grade");
  const chartContainer = document.getElementById("severity-chart");
  const chartHolder = chartContainer.querySelector(".chart-holder");
  const scoreOverlay = chartHolder.querySelector(".score-overlay");
  const selectionLive = document.getElementById("selection-live");
  const navCta = document.getElementById("nav-cta");
  const stickyBar = document.getElementById("sticky-cta");
  const stickyCtaBtn = document.getElementById("sticky-cta-button");
  let assessmentStarted = false;
  let prefetchDone = false;
  const DEBUG_MODE = new URLSearchParams(window.location.search).has("debug");
  const trackEvent = (name, params = {}) => {
    if (typeof window.gtag !== "function") return;
    const payload = Object.assign({ quiz_session_id: quizSessionId }, params);
    if (DEBUG_MODE) payload.debug_mode = true; // enable via ?debug
    window.gtag("event", name, payload);
  };
  window.addEventListener(
    "scroll",
    () => {
      if (prefetchDone) return;
      prefetchDone = true;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href =
        (config.nextSteps && config.nextSteps.ctaHref) || "";
      if (link.href) document.head.appendChild(link);
    },
    { once: true, passive: true },
  );
  const assessmentHeading = document.querySelector(".assessment-heading");
  const assessmentNote = document.querySelector(".assessment-note");
  let stickyObserver;

  const wizard = config.wizard || {};
  const autoAdvance = !!wizard.autoAdvance;
  const useHistory = !!wizard.history;
  const advanceDelay = wizard.delay || 220;
  const STORAGE_KEY = "miniAssessmentResults";
  const searchParams = new URLSearchParams(window.location.search);
  const shouldRevealResults = searchParams.get("results") === "1";

  let autoTimer;
  let isAdvancing = false;

  if (autoAdvance) nextBtn.style.display = "none";

  const getStoredResults = () => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to parse stored assessment results.", err);
      return null;
    }
  };

  const storeResults = (data) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const clearStoredResults = () => {
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const header = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 0) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  });

  restartBtn.textContent =
    (config.texts && config.texts.startOver) || "Retake assessment";
  if (gapsTitleEl)
    gapsTitleEl.textContent =
      (config.texts && config.texts.gapsTitle) || "Opportunities for improvement";

  // Build severity chart
  function buildChart() {
    const severities = [
      {
        key: 0,
        label: (config.texts && config.texts.severityCritical) || "Critical",
        color: "--color-risk-high",
      },
      {
        key: 1,
        label: (config.texts && config.texts.severityMajor) || "Major",
        color: "--color-risk-medium",
      },
      {
        key: 2,
        label: (config.texts && config.texts.severityMinor) || "Minor",
        color: "--color-risk-low",
      },
      {
        key: 3,
        label: (config.texts && config.texts.severityPerfect) || "Perfect",
        color: "--color-risk-min",
      },
    ];
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.classList.add("severity-donut");
    const g = document.createElementNS(ns, "g");
    g.setAttribute("transform", "rotate(-90 50 50)");
    svg.appendChild(g);
    const legend = document.createElement("ul");
    legend.className = "severity-legend";
    const sliceMap = {};
    const stroke = (chartSettings.thickness / chartSettings.size) * 100;
    const radius = 50 - stroke / 2;
    severities.forEach((sev) => {
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", "50");
      circle.setAttribute("cy", "50");
      circle.setAttribute("r", radius);
      circle.setAttribute("fill", "transparent");
      circle.setAttribute("stroke", `var(${sev.color})`);
      circle.setAttribute("stroke-width", stroke);
      circle.setAttribute("stroke-dasharray", "0 100");
      circle.setAttribute("stroke-dashoffset", "0");
      circle.setAttribute("pathLength", "100");
      g.appendChild(circle);
      const li = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.backgroundColor = `var(${sev.color})`;
      const labelEl = document.createElement("span");
      labelEl.className = "label";
      labelEl.textContent = sev.label;
      const countEl = document.createElement("span");
      countEl.className = "count";
      li.append(swatch, labelEl, countEl);
      li.style.display = "none";
      legend.appendChild(li);
      sliceMap[sev.key] = {
        circle,
        label: sev.label,
        legendCount: countEl,
        legendItem: li,
      };
    });
    chartHolder.appendChild(svg);
    chartHolder.appendChild(scoreOverlay);
    chartContainer.appendChild(legend);
    return { sliceMap, svg };
  }
  const chart = buildChart();

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
          trackEvent("question_answered", {
            question_index: idx + 1,
            answer: opt.label,
          });
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
      if (idx === 0 && !assessmentStarted) {
        trackEvent("assessment_start");
        assessmentStarted = true;
      }
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
      if (!opts.skipScroll)
        fieldsets[idx].scrollIntoView({ behavior: "smooth", block: "center" });
      if (!opts.skipFocus)
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
    const storedResults = shouldRevealResults ? getStoredResults() : null;
    if (storedResults) {
      renderResults(storedResults, { skipHistory: true, skipTracking: true });
    } else {
      showQuestion(startIdx, { replace: true, skipScroll: true, skipFocus: true });
    }
  }

  function renderChart(counts, animate = true) {
    const total = fieldsets.length;
    const prefers = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const summaries = [];
    let offset = 0;
    [0, 1, 2, 3].forEach((key) => {
      const info = chart.sliceMap[key];
      const count = counts[key] || 0;
      const pct = total ? (count / total) * 100 : 0;
      info.legendCount.textContent = `${count} (${Math.round(pct)}%)`;
      info.legendItem.style.display = count ? "flex" : "none";
      info.circle.style.transition = !prefers && animate
        ? "stroke-dasharray 1s ease"
        : "none";
      info.circle.setAttribute("stroke-dashoffset", offset);
      requestAnimationFrame(() => {
        info.circle.setAttribute("stroke-dasharray", `${pct} ${100 - pct}`);
      });
      offset -= pct;
      if (count) summaries.push(`${info.label} ${count} (${Math.round(pct)}%)`);
    });
    chart.svg.setAttribute("role", "img");
    chart.svg.setAttribute("aria-label", summaries.join(", "));
  }

  function animateScore(total, max) {
    const prefers = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefers) {
      scoreValueEl.textContent = `${total}/${max}`;
      return;
    }
    const start = performance.now();
    const duration = 1000;
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const val = Math.round(p * total);
      scoreValueEl.textContent = `${val}/${max}`;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function buildResultsData() {
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
    scoreValueEl.setAttribute("aria-label", `Score ${total} out of ${max}`);
    const range =
      config.ranges &&
      config.ranges.find((r) => total >= r.min && total <= r.max);
    if (range) {
      messageEl.textContent = range.message;
    } else {
      messageEl.textContent = "This score has no configured message.";
    }
    let grade;
    if (total === max) grade = "Perfect";
    else if (total <= 10) grade = "Critical";
    else if (total <= 20) grade = "Fair";
    else grade = "Good";

    const baseHref =
      (config.nextSteps && config.nextSteps.ctaHref) || "#";
    const buildLink = (content) => {
      const url = new URL(baseHref);
      url.searchParams.set("utm_source", "meta");
      url.searchParams.set("utm_medium", "ads");
      url.searchParams.set("utm_campaign", "quiz");
      url.searchParams.set("utm_content", content);
      url.searchParams.set("score", total);
      url.searchParams.set("grade", grade);
      url.searchParams.set("quiz_session_id", quizSessionId);
      return url.toString();
    };
    const counts = {
      0: gapsBySeverity[0].length,
      1: gapsBySeverity[1].length,
      2: gapsBySeverity[2].length,
      3:
        fieldsets.length -
        (gapsBySeverity[0].length + gapsBySeverity[1].length + gapsBySeverity[2].length),
    };

    return {
      total,
      max,
      grade,
      message: messageEl.textContent,
      counts,
      gapsBySeverity,
      quizSessionId,
      links: {
        nav: buildLink("nav_top"),
        sticky: buildLink("sticky_bottom"),
      },
    };
  }

  function showGate() {
    form.style.display = "none";
    nextBtn.style.display = "none";
    backBtn.style.display = "none";
    progress.hidden = true;
    if (assessmentHeading) assessmentHeading.hidden = true;
    if (assessmentNote) assessmentNote.hidden = true;
    results.hidden = true;
    if (gateSection) {
      gateSection.hidden = false;
      gateSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderResults(data, opts = {}) {
    scoreValueEl.setAttribute("aria-label", `Score ${data.total} out of ${data.max}`);
    messageEl.textContent = data.message;
    scoreGradeEl.textContent = data.grade;
    navCta.href = data.links.nav;
    stickyCtaBtn.href = data.links.sticky;

    gapsEl.innerHTML = "";
    if (gapsTitleEl) gapsEl.appendChild(gapsTitleEl);
    const severityMap = {
      0: { label: (config.texts && config.texts.severityCritical) || "Critical" },
      1: { label: (config.texts && config.texts.severityMajor) || "Major" },
      2: { label: (config.texts && config.texts.severityMinor) || "Minor" },
    };
    const order = [0, 1, 2];
    let totalGaps = 0;
    order.forEach((sev) => {
      const list = data.gapsBySeverity[sev];
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
        const text = document.createElement("div");
        text.className = "gap-text";
        const qEl = document.createElement("p");
        qEl.className = "gap-question";
        qEl.textContent = g.q;
        const aEl = document.createElement("p");
        aEl.className = "gap-answer";
        aEl.textContent = `Your answer: ${g.a}`;
        const rEl = document.createElement("p");
        rEl.className = "gap-explanation";
        rEl.textContent = `Why it's not optimal: ${g.risk || ""}`;
        text.append(qEl, aEl, rEl);
        li.appendChild(text);
        ul.appendChild(li);
      });
      group.appendChild(ul);
      gapsEl.appendChild(group);
      totalGaps += list.length;
    });
    if (totalGaps) {
      if (gapsTitleEl) gapsTitleEl.hidden = false;
      if (gapsEl) gapsEl.hidden = false;
    } else {
      if (gapsTitleEl) gapsTitleEl.hidden = false;
      if (gapsEl) {
        gapsEl.hidden = false;
        const p = document.createElement("p");
        p.textContent =
          (config.texts && config.texts.noGaps) || "No immediate gaps detected";
        gapsEl.appendChild(p);
      }
    }
    form.style.display = "none";
    nextBtn.style.display = "none";
    backBtn.style.display = "none";
    progress.hidden = true;
    results.hidden = false;
    if (gateSection) gateSection.hidden = true;
    if (assessmentHeading) assessmentHeading.hidden = true;
    if (assessmentNote) assessmentNote.hidden = true;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
    results.focus();
    const card = results.querySelector(".results-content");
    const prefers = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    card.classList.add("show");
    const scoreLines = results.querySelectorAll(".score-heading, #severity-chart");
    scoreLines.forEach((el) => el.classList.add("show"));
    const revealRest = () => {
      [
        "result-message",
        "gaps-title",
        "gaps",
        "guidance",
        "restart",
      ].forEach((id, idx) => {
        const el = document.getElementById(id);
        if (!el || el.hidden) return;
        if (prefers) el.classList.add("show");
        else setTimeout(() => el.classList.add("show"), idx * 80);
      });
      const items = gapsEl.querySelectorAll(".gap-item");
      items.forEach((li, idx) => {
        if (prefers) li.classList.add("show");
        else {
          li.style.transitionDelay = `${idx * 60}ms`;
          li.classList.add("show");
        }
      });
    };
    if (prefers) {
      renderChart(data.counts, false);
      scoreValueEl.textContent = `${data.total}/${data.max}`;
      revealRest();
    } else {
      setTimeout(() => {
        renderChart(data.counts, true);
        animateScore(data.total, data.max);
      }, 400);
      setTimeout(revealRest, 1400);
    }
    if (!opts.skipTracking) {
      trackEvent("assessment_complete", {
        score: data.total,
        critical_gaps: data.gapsBySeverity[0].length,
        major_gaps: data.gapsBySeverity[1].length,
        minor_gaps: data.gapsBySeverity[2].length,
      });
    }
    if (useHistory && opts.updateHistory !== false) {
      const url = new URL(window.location);
      url.searchParams.set("step", "results");
      history.pushState({ step: "results" }, "", url);
    }

    stickyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Show the sticky bar as soon as the opportunities section enters
        // the viewport and keep it visible while it remains in view or has
        // been scrolled past. Hide the bar only when the section has not yet
        // been reached (i.e., is still below the viewport).
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          stickyBar.classList.add("show");
          header.classList.add("hidden");
        } else {
          stickyBar.classList.remove("show");
          header.classList.remove("hidden");
        }
      });
    });
    if (gapsTitleEl) {
      stickyObserver.observe(gapsTitleEl);
    } else if (gapsEl) {
      console.warn(
        'gaps title element missing; observing entire gaps section for sticky CTA',
      );
      stickyObserver.observe(gapsEl);
    } else {
      console.warn('gaps elements not found; sticky CTA will not be observed');
    }

    const track = (loc) => {
      const params = { location: loc, score: data.total };
      if (data.grade) params.grade = data.grade;
      trackEvent("booking_link_click", params);
    };
    navCta.addEventListener("click", () => track("nav_top"));
    stickyCtaBtn.addEventListener("click", () => track("sticky_bottom"));
  }

  function complete(opts = {}) {
    const data = buildResultsData();
    storeResults(data);
    if (gateSection && !shouldRevealResults) {
      showGate();
      return;
    }
    renderResults(data, opts);
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
    quizSessionId =
      self.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    clearStoredResults();
    assessmentStarted = false;
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
    if (assessmentHeading) assessmentHeading.hidden = false;
    if (assessmentNote) assessmentNote.hidden = false;
    gapsEl.innerHTML = "";
    if (gapsTitleEl) gapsEl.appendChild(gapsTitleEl);
    messageEl.textContent = "";
    scoreValueEl.textContent = "";
    scoreGradeEl.textContent = "";
    results.querySelectorAll(".fade-line").forEach((el) =>
      el.classList.remove("show"),
    );
    const card = results.querySelector(".results-content");
    if (card) card.classList.remove("show");
    if (gapsTitleEl) gapsTitleEl.hidden = true;
    if (gapsEl) gapsEl.hidden = true;
    Object.values(chart.sliceMap).forEach((info) => {
      info.circle.style.transition = "none";
      info.circle.setAttribute("stroke-dasharray", "0 100");
      info.legendCount.textContent = "";
      info.legendItem.style.display = "none";
    });
    chart.svg.removeAttribute("aria-label");
    chart.svg.removeAttribute("role");
    stickyBar.classList.remove("show");
    header.classList.remove("hidden");
    if (stickyObserver) stickyObserver.disconnect();
    if (gateSection) gateSection.hidden = true;
    if (shouldRevealResults) {
      const url = new URL(window.location);
      url.searchParams.delete("results");
      history.replaceState({ step: 0 }, "", url);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
