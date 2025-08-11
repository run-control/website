
// Frameworks v8.1: robust one-time grouping + simple toggle
(function(){
  function within(el, root){ return root && (el===root || root.contains(el)); }

  function groupOnce(root){
    const cards = Array.from(root.querySelectorAll('.card'));
    cards.forEach(card => {
      const titleEl = card.querySelector('h3, .framework-title');
      if(!titleEl) return;

      let reveal = card.querySelector('.reveal');
      if(!reveal){
        reveal = document.createElement('div');
        reveal.className = 'reveal';
        titleEl.after(reveal);

        // Snapshot all siblings AFTER the title (now reveal is immediately after title)
        const toMove = [];
        let node = reveal.nextSibling;
        while(node){
          toMove.push(node);
          node = node.nextSibling;
        }
        // Move them into reveal
        toMove.forEach(n => reveal.appendChild(n));
      }

      // Start collapsed
      card.setAttribute('aria-expanded','false');
      titleEl.tabIndex = 0;

      if(!card.__bound){
        const cardsAll = cards; // capture
        const toggle = ()=>{
          const openNow = card.getAttribute('aria-expanded')==='true';
          cardsAll.forEach(c=>{ if(c!==card) c.setAttribute('aria-expanded','false'); });
          card.setAttribute('aria-expanded', openNow ? 'false' : 'true');
        };
        titleEl.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });
        titleEl.addEventListener('keydown', (e)=>{
          if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); toggle(); }
        });
        card.__bound = true;
      }
    });
  }

  function init(){
    const root = document.querySelector('#frameworks');
    if(!root) return;
    groupOnce(root);

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
