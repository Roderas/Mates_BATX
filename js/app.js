'use strict';
let cur=null;
function saveCurrentForm(){
 if(!cur)return;
 const el=$('#tl');if(!el)return;
 ST.set('form-'+cur,JSON.stringify({inputs:[...el.querySelectorAll('input')].map(i=>i.value),selects:[...el.querySelectorAll('select')].map(i=>i.value)}));
}
function restoreForm(){
 const el=$('#tl');if(!el)return;
 try{
  const value=JSON.parse(ST.get('form-'+cur));if(!value||!Array.isArray(value.inputs))return;
  el.querySelectorAll('input').forEach((input,i)=>{if(typeof value.inputs[i]==='string')input.value=value.inputs[i];});
  el.querySelectorAll('select').forEach((select,i)=>{const val=value.selects?.[i];if([...select.options].some(o=>o.value===val))select.value=val;});
  el.querySelector('.b')?.click();
 }catch{}
}
function nav(){
 const el=$('#nav');el.replaceChildren();
 for(const x of T){const b=document.createElement('button');b.type='button';b.className=x.id===cur?'on':'';b.textContent=x.t;b.dataset.topic=x.id;b.setAttribute('aria-current',x.id===cur?'page':'false');b.onclick=()=>{if(location.hash.slice(1)!==x.id)location.hash=x.id;else go(x.id);};el.appendChild(b);}
}
function go(id){
 const x=T.find(t=>t.id===id)||T[0];
 saveCurrentForm();cur=x.id;nav();
 let h=`<div class="c"><h2>${x.t}</h2><p>${x.res}</p></div>`;
 if(x.f.length)h+=`<div class="g"><div class="c"><h3>F\u00f3rmules i resultats clau</h3>${F(x.f)}</div><div class="c"><h3>Com explicar-ho</h3>${L(x.d)}<h3>Errors freq\u00fcents</h3>${L(x.e)}</div></div>`;
 if(x.tool)h+='<div class="c"><h3>'+(x.tool==='pau'?'Quadre de seguiment':'Eina de resoluci\u00f3')+'</h3><div id="tl"></div></div>';
 $('#m').innerHTML=h;
 // RS performs an initial calculation. Suppress persistence until a saved form is restored.
 restoring=true;
 if(x.tool)TL[x.tool]($('#tl'));
 restoreForm();restoring=false;ST.set('view',cur);
 if(x.tool&&x.tool!=='pau')saveCurrentForm();
 document.title=x.t.replace(/^\S+\s(?=Resolutor)/,'')+' | Mates Docent';
 scrollTo({top:0,behavior:'instant'});
}
let restoring=false;
document.addEventListener('calculationdone',()=>{if(!restoring)saveCurrentForm();});
$('#m').addEventListener('input',()=>{if(!restoring)saveCurrentForm();});
$('#m').addEventListener('change',()=>{if(!restoring)saveCurrentForm();});
$('#m').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('td.k')){e.preventDefault();e.target.click();}});
window.addEventListener('pagehide',saveCurrentForm);
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(T.some(t=>t.id===h)&&h!==cur)go(h);});
$('#theme').addEventListener('click',th);
document.addEventListener('themechange',()=>{document.querySelectorAll('canvas').forEach(c=>{if(c._plotConfig)try{plot(c,c._plotConfig);}catch{}});});
const initial=location.hash.slice(1);
go(T.some(t=>t.id===initial)?initial:ST.get('view')||'res');

let resizeFrame;
window.addEventListener('resize',()=>{
 cancelAnimationFrame(resizeFrame);
 resizeFrame=requestAnimationFrame(()=>{
  document.querySelectorAll('canvas').forEach(c=>{
   if(c._plotConfig){try{plot(c,c._plotConfig);}catch{}}
  });
 });
});
