(function(){
  const config = window.ASSESSMENT_CONFIG;
  if(!config){
    console.error('Configuration missing');
    return;
  }
  const root = document.documentElement;
  const setVar = (name,value)=>{ if(value) root.style.setProperty(name,value); };
  setVar('--color-bg', config.brand && config.brand.background);
  setVar('--color-primary', config.brand && config.brand.primary);
  setVar('--color-accent', config.brand && config.brand.accent);
  setVar('--color-risk-high', config.brand && config.brand.riskHigh);
  setVar('--color-risk-medium', config.brand && config.brand.riskMedium);
  setVar('--color-risk-low', config.brand && config.brand.riskLow);

  const form = document.getElementById('assessment-form');
  const seeBtn = document.getElementById('see-results');
  const results = document.getElementById('results');
  const headlineEl = document.getElementById('result-headline');
  const messageEl = document.getElementById('result-message');
  const gapsTitleEl = document.getElementById('gaps-title');
  const gapsEl = document.getElementById('gaps');
  const ctaEl = document.getElementById('cta');
  const restartBtn = document.getElementById('restart');
  const scoreEl = document.getElementById('score');
  const dialContainer = document.getElementById('dial');

  seeBtn.textContent = config.texts && config.texts.seeResults || 'See Results';
  restartBtn.textContent = config.texts && config.texts.startOver || 'Start Over';
  gapsTitleEl.textContent = config.texts && config.texts.gapsTitle || 'Where you lost points';
  ctaEl.textContent = config.cta && config.cta.text || '';
  ctaEl.href = config.cta && config.cta.url || '#';

  // Build dial
  function polarToCartesian(cx,cy,r,angle){
    const rad = (angle-90)*Math.PI/180;
    return {x: cx + r*Math.cos(rad), y: cy + r*Math.sin(rad)};
  }
  function describeArc(x,y,r,start,end){
    const startPt = polarToCartesian(x,y,r,end);
    const endPt = polarToCartesian(x,y,r,start);
    const largeArc = end - start <= 180 ? 0 : 1;
    return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 0 ${endPt.x} ${endPt.y}`;
  }
  function buildDial(){
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 200 100');
    const ranges = [
      {start:180,end:120,color:getComputedStyle(root).getPropertyValue('--color-risk-high')},
      {start:120,end:60,color:getComputedStyle(root).getPropertyValue('--color-risk-medium')},
      {start:60,end:0,color:getComputedStyle(root).getPropertyValue('--color-risk-low')}
    ];
    ranges.forEach(r=>{
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d',describeArc(100,100,90,r.start,r.end));
      p.setAttribute('stroke',r.color.trim());
      p.setAttribute('stroke-width','15');
      p.setAttribute('fill','none');
      svg.appendChild(p);
    });
    const needle = document.createElementNS('http://www.w3.org/2000/svg','line');
    needle.setAttribute('x1','100');
    needle.setAttribute('y1','100');
    needle.setAttribute('x2','100');
    needle.setAttribute('y2','20');
    needle.setAttribute('stroke','var(--color-primary)');
    needle.setAttribute('stroke-width','4');
    needle.classList.add('needle');
    needle.style.transformOrigin = '100px 100px';
    needle.style.transform = 'rotate(-90deg)';
    needle.style.transition = 'transform 1.6s ease-out';
    svg.appendChild(needle);
    const center = document.createElementNS('http://www.w3.org/2000/svg','circle');
    center.setAttribute('cx','100');
    center.setAttribute('cy','100');
    center.setAttribute('r','5');
    center.setAttribute('fill','var(--color-primary)');
    svg.appendChild(center);
    dialContainer.appendChild(svg);
    return needle;
  }
  const needle = buildDial();

  // Render questions
  if(Array.isArray(config.questions)){
    config.questions.forEach((q, idx)=>{
      const fs = document.createElement('fieldset');
      const lg = document.createElement('legend');
      lg.textContent = q.text || `Question ${idx+1}`;
      fs.appendChild(lg);
      q.options.forEach((opt, oIdx)=>{
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `q${idx}`;
        input.value = opt.score;
        if(opt.risk) input.dataset.risk = opt.risk;
        input.dataset.option = opt.label;
        label.appendChild(input);
        label.append(document.createTextNode(opt.label));
        fs.appendChild(label);
      });
      form.appendChild(fs);
    });
  } else {
    form.textContent = 'Configuration error: no questions defined.';
  }

  // Enable button when all answered
  form.addEventListener('change',()=>{
    const allAnswered = config.questions.every((q,idx)=> form.querySelector(`input[name="q${idx}"]:checked`));
    seeBtn.disabled = !allAnswered;
  });

  function animateDial(score){
    const angle = -90 + (score/30)*180;
    requestAnimationFrame(()=>{
      needle.style.transform = `rotate(${angle}deg)`;
    });
  }

  seeBtn.addEventListener('click', ()=>{
    let total = 0;
    const gaps = [];
    config.questions.forEach((q,idx)=>{
      const selected = form.querySelector(`input[name="q${idx}"]:checked`);
      const val = parseInt(selected.value,10);
      total += val;
      if(val < 3){
        gaps.push({q: q.text, a: selected.dataset.option, risk: selected.dataset.risk});
      }
    });
    scoreEl.textContent = `${total}/30`;
    const range = config.ranges && config.ranges.find(r=> total >= r.min && total <= r.max);
    if(range){
      headlineEl.textContent = range.title;
      messageEl.textContent = range.message;
    } else {
      headlineEl.textContent = 'Score range missing';
      messageEl.textContent = 'This score has no configured message.';
    }
    gapsEl.innerHTML = '';
    gaps.forEach(g=>{
      const li = document.createElement('li');
      li.textContent = `${g.q} – ${g.a}: ${g.risk || ''}`;
      gapsEl.appendChild(li);
    });
    form.style.display = 'none';
    seeBtn.style.display = 'none';
    results.hidden = false;
    animateDial(total);
    if(window.dataLayer){
      window.dataLayer.push({event: 'assessment_complete', score: total});
    }
  });

  restartBtn.addEventListener('click', ()=>{
    form.reset();
    form.style.display = '';
    seeBtn.style.display = '';
    seeBtn.disabled = true;
    results.hidden = true;
    gapsEl.innerHTML = '';
    headlineEl.textContent = '';
    messageEl.textContent = '';
    scoreEl.textContent = '';
    needle.style.transform = 'rotate(-90deg)';
    window.scrollTo({top:0, behavior:'smooth'});
  });
})();
