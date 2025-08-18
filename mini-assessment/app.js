(function () {
  const config = window.ASSESSMENT_CONFIG;
  if (!config) {
    console.error("Configuration missing");
    return;
  }
  const root = document.documentElement;
  const setVar = (name, value) => {
    if (value) root.style.setProperty(name, value);
  };
  setVar("--color-bg", config.brand && config.brand.background);
  setVar("--color-text", config.brand && config.brand.text);
  setVar("--color-card-bg", config.brand && config.brand.cardBg);
  setVar("--color-card-text", config.brand && config.brand.cardText);
  setVar("--color-button-text", config.brand && config.brand.buttonText);
  setVar("--color-primary", config.brand && config.brand.primary);
  setVar("--color-accent", config.brand && config.brand.accent);
  setVar("--color-risk-high", config.brand && config.brand.riskHigh);
  setVar("--color-risk-medium", config.brand && config.brand.riskMedium);
  setVar("--color-risk-low", config.brand && config.brand.riskLow);
  setVar("--dial-color", config.brand && config.brand.primary);

  const logoEl = document.getElementById("site-logo");
  const taglineEl = document.getElementById("site-tagline");
  if (logoEl && config.header && config.header.logo)
    logoEl.src = config.header.logo;
  if (taglineEl && config.header && config.header.tagline)
    taglineEl.textContent = config.header.tagline;

  const form = document.getElementById("assessment-form");
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
  const scoreEl = document.getElementById("score");
  const dialContainer = document.getElementById("dial");

  restartBtn.textContent =
    (config.texts && config.texts.startOver) || "Start Over";
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
    svg.setAttribute("viewBox", "0 0 200 100");
    const ranges = [
      {
        start: 180,
        end: 120,
        color: getComputedStyle(root).getPropertyValue("--color-risk-high"),
      },
      {
        start: 120,
        end: 60,
        color: getComputedStyle(root).getPropertyValue("--color-risk-medium"),
      },
      {
        start: 60,
        end: 0,
        color: getComputedStyle(root).getPropertyValue("--color-risk-low"),
      },
    ];
    ranges.forEach((r) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", describeArc(100, 100, 90, r.start, r.end));
      p.setAttribute("stroke", r.color.trim());
      p.setAttribute("stroke-width", "15");
      p.setAttribute("fill", "none");
      svg.appendChild(p);
    });
    const needle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    needle.setAttribute("x1", "100");
    needle.setAttribute("y1", "100");
    needle.setAttribute("x2", "100");
    needle.setAttribute("y2", "20");
    needle.setAttribute("stroke", "var(--dial-color)");
    needle.setAttribute("stroke-width", "4");
    needle.classList.add("needle");
    needle.style.transformOrigin = "100px 100px";
    needle.style.transform = "rotate(-90deg)";
    needle.style.transition = "transform 1.6s ease-out";
    svg.appendChild(needle);
    const center = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    center.setAttribute("cx", "100");
    center.setAttribute("cy", "100");
    center.setAttribute("r", "5");
    center.setAttribute("fill", "var(--dial-color)");
    svg.appendChild(center);
    dialContainer.appendChild(svg);
    return needle;
  }
  const needle = buildDial();

  // Render questions
  const fieldsets = [];
  if (Array.isArray(config.questions)) {
    config.questions.forEach((q, idx) => {
      const fs = document.createElement("fieldset");
      fs.classList.add("card");
      fs.tabIndex = -1;
      fs.hidden = true;
      const lg = document.createElement("legend");
      lg.textContent = q.text || `Question ${idx + 1}`;
      fs.appendChild(lg);
      q.options.forEach((opt) => {
        const label = document.createElement("label");
        label.classList.add("option");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q${idx}`;
        input.value = opt.score;
        if (opt.risk) input.dataset.risk = opt.risk;
        input.dataset.option = opt.label;
        const span = document.createElement("span");
        span.textContent = opt.label;
        label.append(input, span);
        input.addEventListener("change", () => {
          fs.removeAttribute("aria-invalid");
          updateNextState();
        });
        fs.appendChild(label);
      });
      form.appendChild(fs);
      fieldsets.push(fs);
    });
  } else {
    form.textContent = "Configuration error: no questions defined.";
  }

  let current = 0;

  function updateProgress() {
    progressText.textContent = `Question ${current + 1} of ${fieldsets.length}`;
    progressBar.style.width = `${(current / fieldsets.length) * 100}%`;
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

  function showQuestion(idx) {
    current = idx;
    fieldsets.forEach((fs, i) => (fs.hidden = i !== idx));
    updateProgress();
    updateNextState();
    fieldsets[idx].scrollIntoView({ behavior: "smooth", block: "center" });
    fieldsets[idx].focus();
  }

  if (fieldsets.length) {
    progress.hidden = false;
    showQuestion(0);
  }

  function animateDial(score) {
    const max = fieldsets.length * 3;
    const angle = -90 + (score / max) * 180;
    requestAnimationFrame(() => {
      needle.style.transform = `rotate(${angle}deg)`;
    });
  }

  nextBtn.addEventListener("click", () => {
    const fs = fieldsets[current];
    const selected = fs && fs.querySelector("input:checked");
    if (!selected) {
      fs.setAttribute("aria-invalid", "true");
      fs.scrollIntoView({ behavior: "smooth", block: "center" });
      fs.focus();
      return;
    }
    fs.removeAttribute("aria-invalid");
    if (current < fieldsets.length - 1) {
      showQuestion(current + 1);
      return;
    }

    let total = 0;
    const gaps = [];
    fieldsets.forEach((fs, i) => {
      const sel = fs.querySelector("input:checked");
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
    scoreEl.textContent = `${total}/${max}`;
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
    let zoneColor = getComputedStyle(root)
      .getPropertyValue("--color-risk-low")
      .trim();
    if (total <= 10)
      zoneColor = getComputedStyle(root)
        .getPropertyValue("--color-risk-high")
        .trim();
    else if (total <= 20)
      zoneColor = getComputedStyle(root)
        .getPropertyValue("--color-risk-medium")
        .trim();
    setVar("--dial-color", zoneColor);

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
    progress.hidden = true;
    results.hidden = false;
    animateDial(total);
    if (window.dataLayer) {
      window.dataLayer.push({ event: "assessment_complete", score: total });
    }
  });

  restartBtn.addEventListener("click", () => {
    form.reset();
    fieldsets.forEach((fs) => {
      fs.hidden = true;
      fs.removeAttribute("aria-invalid");
    });
    showQuestion(0);
    form.style.display = "";
    nextBtn.style.display = "";
    progress.hidden = false;
    results.hidden = true;
    gapsEl.innerHTML = "";
    headlineEl.textContent = "";
    messageEl.textContent = "";
    scoreEl.textContent = "";
    needle.style.transform = "rotate(-90deg)";
    gapsTitleEl.hidden = true;
    gapsEl.hidden = true;
    setVar("--dial-color", config.brand && config.brand.primary);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
