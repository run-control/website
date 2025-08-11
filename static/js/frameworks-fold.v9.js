
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
