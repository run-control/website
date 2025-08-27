// Frameworks bundle: carousel + fold

// Frameworks Carousel v2: tighter spacing + interactive drag/pause/resume
(() => {
  const data = [
    { key:"soc2", title:"SOC 2", blurb:"For SaaS & service providers, ensures data security across your supply chain.", details:"SOC 2 applies to organizations handling customer data. It focuses on security, availability, processing integrity, confidentiality, and privacy. We guide gap assessments, remediation, evidence prep, and audit readiness." },
    { key:"iso27001", title:"ISO 27001", blurb:"For global enterprises & tech, a comprehensive ISMS standard.", details:"ISO 27001 provides a risk-based ISMS with Annex A controls. We design the ISMS, run risk treatment, develop policies, and prepare you for Stage 1/2 certification and surveillance cycles." },
    { key:"hipaa", title:"HIPAA", blurb:"For healthcare & life sciences, protects patient data.", details:"HIPAA Security, Privacy, and Breach Notification Rules. We deliver risk assessments, safeguards, BAAs, training, and incident response readiness." },
    { key:"ftc", title:"FTC Safeguards", blurb:"For financial institutions & fintech, protects consumer information.", details:"Safeguards Rule requires a written program, risk assessments, encryption, access controls, vendor oversight, and annual reporting. We map controls and stand up an audit-ready program." },
    { key:"pci", title:"PCI DSS", blurb:"For retail & e‑commerce, secures cardholder data.", details:"Whether SAQ or full ROC, we manage scoping, segmentation, policy/technical controls, and QSA liaison to achieve/maintain PCI compliance." },
    { key:"nist800", title:"NIST 800‑171/53", blurb:"For defense/federal contractors, CUI & moderate/high baselines.", details:"We align your environment to 800‑171/CMMC or 800‑53 baselines, with SSP/POA&M, control implementations, and continuous monitoring." },
    { key:"ccpa", title:"CCPA/GDPR", blurb:"For consumer businesses, privacy rights & data governance.", details:"Data mapping, DPIAs, DSAR workflows, consent, retention, and vendor risk. We operationalize privacy with pragmatic controls integrated with security." },
    { key:"cmmc", title:"CMMC", blurb:"For defense industrial base, maturity model for DoD contracts.", details:"CMMC L1/L2 readiness, scoping enclaves, policy/technical uplift, evidence collection, and C3PAO prep." },
    { key:"sspa", title:"Microsoft SSPA", blurb:"For Microsoft suppliers, privacy & security assurance.", details:"We map SSPA requirements, align security/privacy controls, close gaps, and prepare attestations and evidence packages." },
    { key:"csa", title:"CSA CCM", blurb:"For cloud providers & customers, cloud controls map.", details:"We implement CCM controls, map to SOC 2/ISO 27001, and prepare you for customer security reviews and questionnaires." }
  ];

  const shell = document.querySelector("#frameworks-carousel");
  const root = shell?.querySelector(".track");
  if(!root) return;

  // Build slides (+ duplicate head for smooth wrap)
  const all = [...data, ...data.slice(0,6)];
  for(const item of all){
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.dataset.key = item.key;
    slide.innerHTML = `
      <button aria-expanded="false" aria-controls="fw-${item.key}">
        <div class="inner">
          <h3>${item.title}</h3>
          <div class="summary"><p>${item.blurb}</p></div>
          <div class="details" id="fw-${item.key}" ><p>${item.details}</p></div>
        </div>
      </button>`;
    root.appendChild(slide);
  }

  const slides = [...root.querySelectorAll(".slide")];

  let maxScroll = root.scrollWidth - root.clientWidth;
  window.addEventListener('resize', () => {
    maxScroll = root.scrollWidth - root.clientWidth;
  });

  // Toggle expanded state and pause while open
  function closeAll(){
    slides.forEach(s => {
      s.classList.remove("expanded");
      const btn = s.querySelector("button");
      const d = s.querySelector(".details");
      if(btn && d){ btn.setAttribute("aria-expanded","false"); d.hidden = true; }
    });
  }
  function anyOpen(){ return root.querySelector(".slide.expanded"); }

  slides.forEach(s => {
    const btn = s.querySelector("button");
    const details = s.querySelector(".details");
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const isOpen = s.classList.contains("expanded");
      if(!isOpen){
        closeAll();
        s.classList.add("expanded");
        btn.setAttribute("aria-expanded","true");
        details.hidden = false;
        pauseCarousel();
      }else{
        s.classList.remove("expanded");
        btn.setAttribute("aria-expanded","false");
        details.hidden = true;
        delayedResume();
      }
    });
  });

  // --- Interactive scrolling using scrollLeft ---
  let paused = false;
  let speed = 0.70; // pixels per frame (~24px/s)
  let resumeTimer = 0;

  function tick(){
    if(!paused){
      root.scrollLeft += speed;
      if(root.scrollLeft >= maxScroll - 1){
        root.scrollLeft = 0;
      }
    }
    requestAnimationFrame(tick);
  }

  function pauseCarousel(){
    paused = true;
    if(resumeTimer){ clearTimeout(resumeTimer); resumeTimer = 0; }
  }
  function resumeCarousel(){ paused = false; }
  function delayedResume(){
    if(resumeTimer){ clearTimeout(resumeTimer); }
    resumeTimer = setTimeout(()=>{ resumeTimer=0; if(!anyOpen()) resumeCarousel(); }, 4000);
  }

  // Drag / swipe
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let rect;

  function down(clientX){
    pauseCarousel();
    isDown = true;
    root.classList.add("dragging");
    rect = root.getBoundingClientRect();
    startX = clientX - rect.left;
    startScroll = root.scrollLeft;
  }
  function move(clientX){
    if(!isDown) return;
    const x = clientX - rect.left;
    const walk = (x - startX) * 1.6; // drag speed multiplier
    root.scrollLeft = startScroll - walk;
  }
  function up(){
    if(!isDown) return;
    isDown = false;
    rect = null;
    root.classList.remove("dragging");
    delayedResume();
  }

  // Mouse events
  root.addEventListener("mousedown", (e)=> down(e.clientX));
  root.addEventListener("mousemove", (e)=> move(e.clientX));
  window.addEventListener("mouseup", up);

  // Touch events
  root.addEventListener("touchstart", (e)=> down(e.touches[0].clientX), {passive:true});
  root.addEventListener("touchmove", (e)=> move(e.touches[0].clientX), {passive:true});
  window.addEventListener("touchend", up);

  // Pause when hovering/focusing the carousel area
  shell.addEventListener("focusin", ()=> pauseCarousel());
  shell.addEventListener("focusout", ()=> delayedResume());

  // Close on outside click / Esc
  document.addEventListener("click", (e)=>{
    if(!shell.contains(e.target)){
      closeAll();
      delayedResume();
    }
  });
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      closeAll();
      delayedResume();
    }
  });

  // Kick off the animation loop
  tick();
})();


// Frameworks v9.1: correct grouping + clean toggle
(function(){
  function within(el, root){ return root && (el===root || root.contains(el)); }

  function init(){
    const root = document.querySelector('#frameworks, section#frameworks, section[id*="frameworks"]');
    if(!root) return;

    const cards = [...root.querySelectorAll('.card')];
    cards.forEach(card => {
      const title = card.querySelector('h3, .framework-title');
      if(!title) return;

      // Snapshot ALL siblings after the title (current DOM) BEFORE inserting reveal
      const toMove = [];
      let n = title.nextSibling;
      while(n){ toMove.push(n); n = n.nextSibling; }

      // Ensure single reveal after title
      let reveal = card.querySelector('.reveal');
      if(!reveal){
        reveal = document.createElement('div');
        reveal.className = 'reveal';
        title.after(reveal);
      }else{
        reveal.innerHTML = '';
      }

      // Move the previously snapshotted nodes into reveal
      toMove.forEach(node => reveal.appendChild(node));

      // Start collapsed & bind
      card.setAttribute('aria-expanded','false');
      title.tabIndex = 0;
      if(!card.__bound){
        const toggle = ()=>{
          const open = card.getAttribute('aria-expanded')==='true';
          cards.forEach(c=>{ if(c!==card) c.setAttribute('aria-expanded','false'); });
          card.setAttribute('aria-expanded', open ? 'false' : 'true');
        };
        title.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });
        title.addEventListener('keydown', (e)=>{
          if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); toggle(); }
        });
        card.__bound = true;
      }
    });

    // Outside click / Esc close
    document.addEventListener('click', (e)=>{
      if(within(e.target, root)) return;
      root.querySelectorAll('.card[aria-expanded="true"]').forEach(c=>c.setAttribute('aria-expanded','false'));
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape'){
        root.querySelectorAll('.card[aria-expanded="true"]').forEach(c=>c.setAttribute('aria-expanded','false'));
      }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
