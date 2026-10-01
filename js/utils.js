'use strict';
const $=s=>document.querySelector(s);
// Isolate storage by repository path on GitHub Pages (all repositories share an origin).
const STORE_PATH=(()=>{try{return new URL('.',document.baseURI).pathname;}catch{return '/local/';}})();
const STORE_PREFIX='mates-docent-pwa:'+STORE_PATH+':';
const ST={
 get(k){try{return localStorage.getItem(STORE_PREFIX+k);}catch{return null;}},
 set(k,v){try{localStorage.setItem(STORE_PREFIX+k,String(v));return true;}catch{document.dispatchEvent(new Event('storagefailed'));return false;}}
};
// Retain the two settings used by the original HTML, when available on this origin.
for(const key of ['th','pau']){try{if(ST.get(key)===null&&localStorage.getItem(key)!==null)ST.set(key,localStorage.getItem(key));}catch{}}
function th(){const r=document.documentElement,d=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);r.dataset.theme=d?'light':'dark';ST.set('th',r.dataset.theme);document.dispatchEvent(new Event('themechange'));}
if(['light','dark'].includes(ST.get('th')))document.documentElement.dataset.theme=ST.get('th');
const L=a=>'<ul>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
const F=a=>a.map(x=>'<div class="f">'+x+'</div>').join('');
const q=(el,i)=>el.querySelectorAll('input')[i].value;
const N=(el,i)=>{const s=q(el,i).trim().replace(',','.');if(!s||!Number.isFinite(Number(s)))throw new Error('Falta un valor num\u00e8ric finit.');return Number(s);};
function mk(el,html,fn,label='Calcular'){
 el.innerHTML=html+'<div class="tool-actions"><button class="b" type="button">'+label+'</button><button class="secondary copy-result" type="button" hidden>Copiar resultat</button></div><div class="o" role="status" aria-live="polite" style="display:none"></div>';
 const out=el.querySelector('.o'),btn=el.querySelector('.b'),cp=el.querySelector('.copy-result');
 el.querySelectorAll('input').forEach((inp,i)=>{if(!inp.hasAttribute('aria-label'))inp.setAttribute('aria-label',inp.closest('.r')?.textContent.trim()||'Dada '+(i+1));inp.autocomplete='off';inp.spellcheck=false;});
 el.querySelectorAll('canvas').forEach(c=>{c.setAttribute('role','img');c.setAttribute('aria-label','Gr\u00e0fica del c\u00e0lcul. Els resultats de text apareixen a sota.');});
 btn.onclick=()=>{
  out.style.display='block';out.classList.remove('error');cp.hidden=true;
  try{out.textContent=fn(el);cp.hidden=false;}
  catch(e){out.textContent='\u26a0 '+(e.message||String(e));out.classList.add('error');const c=el.querySelector('canvas');if(c){c.getContext('2d').clearRect(0,0,c.width,c.height);c._plotConfig=null;}}
  document.dispatchEvent(new Event('calculationdone'));
 };
 el.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input')){e.preventDefault();btn.click();}});
 cp.onclick=async()=>{try{await navigator.clipboard.writeText(out.textContent);cp.textContent='Copiat';setTimeout(()=>cp.textContent='Copiar resultat',1500);}catch{cp.textContent='Selecciona el text per copiar-lo';}};
}
