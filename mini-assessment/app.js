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
  const scoreEl = document.getElementById("score");
  const dialContainer = document.getElementById("dial");

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

  function showQuestion(idx) {
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
  backBtn.addEventListener("click", () => {
    if (current > 0) showQuestion(current - 1);
  });

  nextBtn.addEventListener("click", () => {
    const wrap = fieldsets[current];
    const fs = wrap.querySelector("fieldset");
    const selected = wrap && wrap.querySelector("input:checked");
    if (!selected) {
      fs.setAttribute("aria-invalid", "true");
      const help = fs.querySelector(".help");
      if (help) help.hidden = false;
      wrap.scrollIntoView({ behavior: "smooth", block: "center" });
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
    backBtn.style.display = "none";
    progress.hidden = true;
    results.hidden = false;
    animateDial(total);
    if (window.dataLayer) {
      window.dataLayer.push({ event: "assessment_complete", score: total });
    }
  });

  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!nextBtn.disabled) nextBtn.click();
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
    showQuestion(0);
    form.style.display = "";
    nextBtn.style.display = "";
    backBtn.style.display = "";
    progress.hidden = false;
    results.hidden = true;
    gapsEl.innerHTML = "";
    headlineEl.textContent = "";
    messageEl.textContent = "";
    scoreEl.textContent = "";
    needle.style.transform = "rotate(-90deg)";
    gapsTitleEl.hidden = true;
    gapsEl.hidden = true;
    setVar("--dial-color", brand.accentBlue);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
