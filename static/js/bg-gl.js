/* Balanced WebGL (diagnostics + higher visibility) */
(function () {
  const id = 'vectari-bg';
  const canvas = document.getElementById(id);
  if (!canvas) { console.warn('[VectariGL] canvas not found'); return; }
  if (!window.PIXI) { console.warn('[VectariGL] PIXI missing – using fallback image'); return; }

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  document.body.classList.add('gl-running');

  const app = new PIXI.Application({ view: canvas, resizeTo: window, autoDensity: true, backgroundAlpha: 0 });

  let rtA = PIXI.RenderTexture.create({ width: app.renderer.width, height: app.renderer.height });
  let rtB = PIXI.RenderTexture.create({ width: app.renderer.width, height: app.renderer.height });
  const feedback = new PIXI.Sprite(rtA); feedback.alpha = 0.94;
  const fbLayer = new PIXI.Container(); fbLayer.addChild(feedback);

  const layer = new PIXI.Container(); layer.blendMode = PIXI.BLEND_MODES.ADD;
  const blur = new PIXI.filters.BlurFilter(2); blur.quality = 2; layer.filters = [blur];

  const W = () => app.renderer.width, H = () => app.renderer.height;
  const COUNT = Math.floor(Math.max(1600, Math.min(2400, (W()*H())/420)));
  const S_MIN = 0.7*DPR, S_MAX = 2.4*DPR;
  const SPEED = 0.19, FLOW_SCALE = 0.0013, VX_BIAS = 0.05;
  const LINK_RIGHT_START = 0.45, LINK_MAX_DIST = 95*DPR, LINK_ALPHA = 0.06;

  function hash(n){ return (Math.sin(n)*43758.5453123)%1; }
  function noise2d(x,y){ const i=Math.floor(x),j=Math.floor(y);
    const fx=x-i,fy=y-j; const a=hash(i*157+j*113), b=hash((i+1)*157+j*113);
    const c=hash(i*157+(j+1)*113), d=hash((i+1)*157+(j+1)*113);
    const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
    return a*(1-u)*(1-v)+b*u*(1-v)+c*(1-u)*v+d*u*v; }
  function curlAngle(x,y,s){ const e=1.7;
    const n1=noise2d((x+e)*s,y*s), n2=noise2d((x-e)*s,y*s),
          n3=noise2d(x*s,(y+e)*s), n4=noise2d(x*s,(y-e)*s);
    return Math.atan2((n3-n4),(n1-n2)); }

  function tintFor(x,y,vx,vy){
    const px=x/W(); const mag=Math.hypot(vx,vy);
    const m=Math.max(0,Math.min(1,px + 0.1*(px-0.5) + mag*0.0015));
    const r=Math.round(14 + (255-14)*m);
    const g=Math.round(58 + (125-58)*m);
    const b=Math.round(135 + (64-135)*m);
    return (r<<16)|(g<<8)|b;
  }

  const linkG = new PIXI.Graphics(); linkG.blendMode = PIXI.BLEND_MODES.ADD;
  const particles=[];
  for(let i=0;i<COUNT;i++){
    const g=new PIXI.Graphics(); g.beginFill(0xffffff,1);
    g.drawCircle(0,0, Math.random()*(S_MAX-S_MIN)+S_MIN); g.endFill();
    g.x=Math.random()*W(); g.y=Math.random()*H(); g.alpha=0.95;
    particles.push({g,vx:0,vy:0,life:6+Math.random()*10,t:0});
    layer.addChild(g);
  }

  app.stage.addChild(fbLayer); app.stage.addChild(linkG); app.stage.addChild(layer);

  app.renderer.on('resize',()=>{ rtA.resize(W(),H()); rtB.resize(W(),H()); });

  app.ticker.add(()=>{
    linkG.clear(); linkG.lineStyle(1.1*DPR,0xFF7A3D,LINK_ALPHA,0.5);
    for(let i=0;i<particles.length;i+=6){
      const a=particles[i]; if(a.g.x<W()*LINK_RIGHT_START) continue;
      for(let j=i+1;j<Math.min(i+48,particles.length);j+=8){
        const b=particles[j]; const dx=a.g.x-b.g.x, dy=a.g.y-b.g.y;
        const d=Math.hypot(dx,dy); if(d<95*DPR){ const t=1-d/(95*DPR);
          linkG.lineStyle(1.1*DPR,0xFF7A3D,0.06*t);
          linkG.moveTo(a.g.x,a.g.y); linkG.lineTo(b.g.x,b.g.y); }
      }
    }
    const dt=Math.min(0.05, app.ticker.deltaMS/1000);
    for(const p of particles){
      const ang=curlAngle(p.g.x,p.g.y,0.0013);
      const sp=SPEED*(0.8+noise2d(p.g.x*0.001,p.g.y*0.001));
      p.vx=Math.cos(ang)*sp*60 + VX_BIAS*60; p.vy=Math.sin(ang)*sp*60;
      p.g.x+=p.vx*dt; p.g.y+=p.vy*dt; p.t+=dt;
      if(p.t>p.life||p.g.x<-20||p.g.x>W()+20||p.g.y<-20||p.g.y>H()+20){
        p.g.x=Math.random()*W(); p.g.y=(Math.random()<0.6)?Math.random()*H():(Math.random()<0.5?-10:H()+10);
        p.t=0; p.life=6+Math.random()*10;
      }
      p.g.tint=tintFor(p.g.x,p.g.y,p.vx,p.vy);
    }
    app.renderer.render(app.stage, { renderTexture: rtB, clear: true });
    const tmp=rtA; rtA=rtB; rtB=tmp; feedback.texture=rtA;
  });
})();