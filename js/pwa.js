'use strict';
(() => {
 const VERSION='2.0.0';
 const el=id=>document.getElementById(id),dialog=el('help-dialog');
 let deferredPrompt=null,registration=null,readyOffline=false,reloading=false;
 let hadController=Boolean(navigator.serviceWorker?.controller);
 el('app-version').textContent='PWA '+VERSION;
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const updateStatus=()=>{
  el('install').hidden=installed();
  if(location.protocol==='file:'){el('offline-status').textContent='Mode fitxer: publica amb HTTPS per instal\u00b7lar.';return;}
  el('offline-status').textContent=readyOffline?(navigator.onLine?'Disponible sense connexi\u00f3':'Sense connexi\u00f3 \u00b7 app disponible'):(navigator.onLine?'Preparant la c\u00f2pia offline\u2026':'Sense connexi\u00f3 \u00b7 c\u00f2pia no confirmada');
 };
 function openHelp(message=''){
  el('help-status').textContent=message;
  if(!dialog.open)dialog.showModal();
 }
 el('help').onclick=()=>openHelp();el('help-footer').onclick=()=>openHelp();
 el('close-help').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;updateStatus();});
 el('install').onclick=async()=>{
  if(installed())return;
  if(!deferredPrompt){openHelp('Aquest navegador encara no ofereix un av\u00eds autom\u00e0tic. Segueix els passos del teu dispositiu.');return;}
  const prompt=deferredPrompt;deferredPrompt=null;
  try{await prompt.prompt();await prompt.userChoice;}catch{openHelp('Utilitza l\u2019opci\u00f3 d\u2019instal\u00b7laci\u00f3 del men\u00fa del navegador.');}
 };
 window.addEventListener('appinstalled',()=>{deferredPrompt=null;el('install').hidden=true;});
 matchMedia('(display-mode: standalone)').addEventListener('change',updateStatus);
 window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);
 document.addEventListener('storagefailed',()=>{el('offline-status').textContent='No s\u2019han pogut desar les dades locals. Exporta una c\u00f2pia.';});
 updateStatus();

 function workerInfo(worker){
  return new Promise((resolve,reject)=>{
   if(!worker){reject(new Error('No hi ha cap worker actiu.'));return;}
   const channel=new MessageChannel();const timer=setTimeout(()=>reject(new Error('El worker no ha respost.')),5000);
   channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
   worker.postMessage({type:'STATUS'},[channel.port2]);
  });
 }
 async function confirmOffline(){
  try{const info=await workerInfo(registration?.active);readyOffline=info.ready===true;updateStatus();if(!readyOffline)el('offline-status').textContent='C\u00f2pia offline incompleta. Torna a connectar i actualitza.';}
  catch{el('offline-status').textContent='No s\u2019ha pogut confirmar la c\u00f2pia offline.';}
 }
 function updateAvailable(){if(registration?.waiting){el('update').hidden=false;el('help-status').textContent='Hi ha una versi\u00f3 nova. Prem Actualitzar a la barra superior.';}}
 el('update').onclick=()=>{
  saveCurrentForm();if(registration?.waiting){el('update').disabled=true;registration.waiting.postMessage({type:'SKIP_WAITING'});}
 };
 el('check-update').onclick=async()=>{
  if(!registration){el('help-status').textContent='Cal la web publicada amb HTTPS i un navegador compatible.';return;}
  if(!navigator.onLine){el('help-status').textContent='Cal connexi\u00f3 per buscar actualitzacions.';return;}
  el('help-status').textContent='Comprovant\u2026';
  try{await registration.update();updateAvailable();if(!registration.waiting)el('help-status').textContent='Comprovaci\u00f3 sol\u00b7licitada. Si es descarrega una versi\u00f3 nova apareixer\u00e0 Actualitzar.';await confirmOffline();}
  catch{el('help-status').textContent='No s\u2019ha pogut connectar al servidor. Torna-ho a provar.';}
 };
 if('serviceWorker' in navigator&&window.isSecureContext&&location.protocol!=='file:'){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
   if(hadController&&!reloading){reloading=true;saveCurrentForm();location.reload();return;}
   hadController=true;confirmOffline();
  });
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(async reg=>{
   registration=reg;updateAvailable();
   reg.addEventListener('updatefound',()=>{
    const worker=reg.installing;
    worker?.addEventListener('statechange',()=>{
     if(worker.state==='installed'){if(navigator.serviceWorker.controller)updateAvailable();}
     if(worker.state==='activated')confirmOffline();
     if(worker.state==='redundant'&&!readyOffline)el('offline-status').textContent='La c\u00f2pia offline no s\u2019ha completat. Recarrega amb connexi\u00f3.';
    });
   });
   await navigator.serviceWorker.ready;await confirmOffline();
  }).catch(()=>{el('offline-status').textContent='No s\u2019ha pogut activar el mode offline. Revisa HTTPS i els fitxers publicats.';});
 }else if(location.protocol!=='file:')el('offline-status').textContent='Mode web: offline no disponible en aquest context.';

 const allowedKeys=new Set(['th','pau','view',...T.map(x=>'form-'+x.id)]);
 function exportData(){
  saveCurrentForm();const data={};for(const k of allowedKeys){const val=ST.get(k);if(val!==null)data[k]=val;}
  const result={app:'mates-docent-pwa',schema:1,version:VERSION,created:new Date().toISOString(),data};
  const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='mates-docent-copia-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  el('data-status').textContent='C\u00f2pia exportada. Desa-la fora del navegador.';
 }
 el('export-data').onclick=exportData;
 el('import-data').onclick=()=>el('backup-file').click();
 el('backup-file').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
   if(file.size>200000)throw new Error('Fitxer massa gran.');
   const result=JSON.parse(await file.text());
   if(result.app!=='mates-docent-pwa'||result.schema!==1||!result.data||Array.isArray(result.data)||typeof result.data!=='object')throw new Error('No \u00e9s una c\u00f2pia compatible.');
   const entries=Object.entries(result.data);
   for(const [key,val] of entries){
    if(!allowedKeys.has(key)||typeof val!=='string'||val.length>60000)throw new Error('Dades no v\u00e0lides a la c\u00f2pia.');
    if(key==='th'&&!['light','dark'].includes(val))throw new Error('Tema no v\u00e0lid.');
    if(key==='view'&&!T.some(t=>t.id===val))throw new Error('Vista no v\u00e0lida.');
    if(key==='pau'){
     const grid=JSON.parse(val);if(!grid||typeof grid!=='object'||Array.isArray(grid)||Object.entries(grid).some(([k,v])=>!/^[0-8]-[0-2]$/.test(k)||![0,1,2].includes(v)))throw new Error('Marques PAU no v\u00e0lides.');
    }
    if(key.startsWith('form-')){
     const form=JSON.parse(val);if(!form||!Array.isArray(form.inputs)||!Array.isArray(form.selects)||form.inputs.length>20||form.selects.length>5||[...form.inputs,...form.selects].some(x=>typeof x!=='string'||x.length>500))throw new Error('Formulari no v\u00e0lid.');
    }
   }
   if(!confirm('La importaci\u00f3 substituir\u00e0 els valors desats que contingui la c\u00f2pia. Vols continuar?'))return;
   for(const [key,val] of entries){if(!ST.set(key,val))throw new Error('No s\u2019ha pogut desar la c\u00f2pia.');}
   if(ST.get('th'))document.documentElement.dataset.theme=ST.get('th');
   // Do not overwrite the imported form with the stale current form during navigation.
   cur=null;go(ST.get('view')||'res');
   const target='#'+cur;if(location.hash!==target)history.replaceState(null,'',target);
   el('data-status').textContent='C\u00f2pia importada correctament.';
  }catch(e){el('data-status').textContent='No s\u2019ha importat: '+e.message;}
  finally{event.target.value='';}
 };
})();
