/* Canvas plot: sampled functions, explicit break heuristics, no domain claims. */
(function(){'use strict';
const E=window.MatesEngine, finite=Number.isFinite;
class StudioGraph {
 constructor(canvas,legend,output){this.c=canvas;this.legend=legend;this.output=output;this.result=null;this.view=null;this.visible=[];this.colors=['#3178be','#d48233','#7b62b4'];this.drag=null;this.frame=0;
  new ResizeObserver(()=>this.schedule()).observe(canvas);
  canvas.addEventListener('pointerdown',e=>{if(!this.view)return;canvas.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,view:{...this.view}};});
  canvas.addEventListener('pointermove',e=>{if(!this.view)return;const r=canvas.getBoundingClientRect();if(this.drag){const d=this.drag,v=d.view,dx=(e.clientX-d.x)/r.width*(v.x1-v.x0),dy=(e.clientY-d.y)/r.height*(v.y1-v.y0);this.view={x0:v.x0-dx,x1:v.x1-dx,y0:v.y0+dy,y1:v.y1+dy};this.schedule();}const v=this.view,x=v.x0+(e.clientX-r.left)/r.width*(v.x1-v.x0),y=v.y1-(e.clientY-r.top)/r.height*(v.y1-v.y0);output.textContent='x '+E.fmt(x)+'  |  y '+E.fmt(y);});
  const end=()=>{this.drag=null;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();this.zoom(.7);}else if(e.key==='-'){e.preventDefault();this.zoom(1.4);}});
 }
 load(result){this.result=result;this.visible=result.plots.map(()=>true);this.legend.textContent='';result.plots.forEach((p,i)=>{const label=document.createElement('label'),check=document.createElement('input'),dot=document.createElement('span');check.type='checkbox';check.checked=true;check.setAttribute('aria-label','Mostra '+p.name);check.addEventListener('change',()=>{this.visible[i]=check.checked;this.schedule();});dot.className='graph-dot';dot.style.background=this.colors[i%3];label.append(check,dot,document.createTextNode(p.name));this.legend.append(label);});this.reset();}
 sample(n,x){try{return E.evaluate(n,x);}catch(_){return NaN;}}
 reset(){if(!this.result)return;let [x0,x1]=this.result.window||[-6,6],ys=[];for(const p of this.result.plots)for(let i=0;i<=350;i++){const y=this.sample(p.n,x0+(x1-x0)*i/350);if(finite(y)&&Math.abs(y)<1e12)ys.push(y);}ys.sort((a,b)=>a-b);let y0=ys.length?ys[Math.floor(ys.length*.025)]:-1,y1=ys.length?ys[Math.floor(ys.length*.975)]:1;if(this.result.shade){y0=Math.min(y0,0);y1=Math.max(y1,0);}if(y1-y0<1e-9){y0-=1;y1+=1;}const p=(y1-y0)*.18;this.view={x0,x1,y0:y0-p,y1:y1+p};this.schedule();}
 zoom(factor){if(!this.view)return;const v=this.view,mx=(v.x0+v.x1)/2,my=(v.y0+v.y1)/2,w=(v.x1-v.x0)*factor,h=(v.y1-v.y0)*factor;if(w<1e-6||w>1e5)return;this.view={x0:mx-w/2,x1:mx+w/2,y0:my-h/2,y1:my+h/2};this.schedule();}
 schedule(){if(this.frame)cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>{this.frame=0;this.draw();});}
 draw(){if(!this.result||!this.view||!this.c.clientWidth)return;const c=this.c,k=c.getContext('2d'),W=c.clientWidth,H=c.clientHeight,dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);k.setTransform(dpr,0,0,dpr,0,0);const css=getComputedStyle(document.documentElement),ink=css.getPropertyValue('--muted'),border=css.getPropertyValue('--border'),bg=css.getPropertyValue('--surface');k.fillStyle=bg;k.fillRect(0,0,W,H);
  const v=this.view,dy=v.y1-v.y0,X=x=>(x-v.x0)/(v.x1-v.x0)*W,Y=y=>H-(y-v.y0)/dy*H;
  const tick=r=>{let a=r/6,m=10**Math.floor(Math.log10(a)),f=a/m;return m*(f<1.5?1:f<3.5?2:f<7.5?5:10);},sx=tick(v.x1-v.x0),sy=tick(dy);
  k.strokeStyle=border;k.lineWidth=.6;k.beginPath();for(let x=Math.ceil(v.x0/sx)*sx,j=0;x<=v.x1&&j<30;x+=sx,j++){k.moveTo(X(x),0);k.lineTo(X(x),H);}for(let y=Math.ceil(v.y0/sy)*sy,j=0;y<=v.y1&&j<30;y+=sy,j++){k.moveTo(0,Y(y));k.lineTo(W,Y(y));}k.stroke();
  const ax=Math.max(1,Math.min(W-1,X(0))),ay=Math.max(1,Math.min(H-1,Y(0)));k.strokeStyle=ink;k.lineWidth=.9;k.beginPath();k.moveTo(ax,0);k.lineTo(ax,H);k.moveTo(0,ay);k.lineTo(W,ay);k.stroke();k.fillStyle=ink;k.font='10px system-ui';
  for(let x=Math.ceil(v.x0/sx)*sx,j=0;x<=v.x1&&j<30;x+=sx,j++)if(Math.abs(x)>sx*.001)k.fillText(Number(x.toPrecision(4)).toString(),Math.max(2,Math.min(W-25,X(x)+3)),Math.max(12,Math.min(H-4,ay+13)));
  for(let y=Math.ceil(v.y0/sy)*sy,j=0;y<=v.y1&&j<30;y+=sy,j++)if(Math.abs(y)>sy*.001)k.fillText(Number(y.toPrecision(4)).toString(),Math.max(4,Math.min(W-30,ax+4)),Math.max(11,Math.min(H-3,Y(y)-4)));
  k.save();k.beginPath();k.rect(0,0,W,H);k.clip();
  if(this.result.shade){const s=this.result.shade,a=Math.max(s.a,v.x0),b=Math.min(s.b,v.x1);if(b>a){k.fillStyle='rgba(49,120,190,.16)';for(let i=0;i<380;i++){const x=a+(b-a)*i/380,z=a+(b-a)*(i+1)/380,y=this.sample(s.f,(x+z)/2),g=s.g?this.sample(s.g,(x+z)/2):0;if(finite(y)&&finite(g))k.fillRect(X(x),Y(Math.max(y,g)),Math.max(1,X(z)-X(x)),Math.abs(Y(y)-Y(g)));}}}
  this.result.plots.forEach((p,j)=>{if(!this.visible[j])return;k.strokeStyle=this.colors[j%3];k.lineWidth=2;k.beginPath();let on=false,py,px;const n=Math.max(500,Math.round(W*1.4));for(let i=0;i<=n;i++){const x=v.x0+(v.x1-v.x0)*i/n,y=this.sample(p.n,x);if(!finite(y)||Math.abs(y)>1e14){on=false;continue;}if(on){const mid=this.sample(p.n,(px+x)/2);if(!finite(mid)||Math.abs(y-py)>dy*.7||Math.abs(mid-(y+py)/2)>dy*.2)on=false;}if(on)k.lineTo(X(x),Y(y));else k.moveTo(X(x),Y(y));on=true;px=x;py=y;}k.stroke();});
  k.fillStyle=this.colors[0];for(const p of this.result.points||[]){if(p.x<v.x0||p.x>v.x1||p.y<v.y0||p.y>v.y1)continue;k.beginPath();k.arc(X(p.x),Y(p.y),3.5,0,Math.PI*2);k.fill();}
  k.restore();
 }
 download(){this.draw();const a=document.createElement('a');a.download='mates-grafica.png';a.href=this.c.toDataURL('image/png');a.click();}
}
window.StudioGraph=StudioGraph;
})();
