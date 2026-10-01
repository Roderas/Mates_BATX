'use strict';
// Event-level simulation using the real sw.js. Not a browser installation test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),stores=new Map(),results=[];
const caches={
 async open(name){if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return{put:async(k,r)=>m.set(String(k.url||k),r.clone()),match:async k=>m.get(String(k.url||k))?.clone()};},
 async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}
};
async function check(name,fn){try{await fn();results.push({test:name,pass:true});}catch(e){results.push({test:name,pass:false,detail:e.message});console.error('FAIL',name,e.message);}}
function worker(scope,code=source){
 const handlers={},state={online:true,missing:null,claimed:0,skipped:0};
 const self={registration:{scope},clients:{claim:async()=>state.claimed++},skipWaiting:async()=>state.skipped++,addEventListener:(type,fn)=>handlers[type]=fn};
 const fetch=async request=>{
  if(!state.online)throw new TypeError('offline');
  const url=new URL(request.url||request);let rel=url.pathname.slice(new URL(scope).pathname.length)||'index.html';
  if(rel===state.missing)return new Response('Missing',{status:404});
  const file=path.join(ROOT,rel);if(!fs.existsSync(file))return new Response('Missing',{status:404});
  return new Response(fs.readFileSync(file),{status:200,headers:{'Content-Type':rel.endsWith('.html')?'text/html':rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':'application/octet-stream'}});
 };
 const context=vm.createContext({self,caches,fetch,URL,Request,Response,console});
 vm.runInContext(code+'\nthis.test={CACHE_NAME,CACHE_PREFIX,ASSETS};',context);
 const fire=async(type,extra={})=>{const waits=[];let response=null;handlers[type]({...extra,waitUntil:p=>waits.push(p),respondWith:p=>response=p});await Promise.all(waits);return response?await response:null;};
 const status=async()=>{let output;await fire('message',{data:{type:'STATUS'},ports:[{postMessage:data=>output=data}]});return output;};
 return{state,fire,status,...context.test};
}
(async()=>{
 const first=worker('https://example.test/repo/');
 await check('Install caches every runtime resource',async()=>{await first.fire('install');assert.equal(stores.get(first.CACHE_NAME).size,first.ASSETS.length);});
 await check('Status confirms complete cache',async()=>assert.equal((await first.status()).ready,true));
 await check('Installation does not force update',async()=>assert.equal(first.state.skipped,0));
 await check('Activate claims clients',async()=>{await first.fire('activate');assert.equal(first.state.claimed,1);});
 first.state.online=false;
 await check('Offline root navigation',async()=>{const r=await first.fire('fetch',{request:{url:'https://example.test/repo/',method:'GET',mode:'navigate'}});assert.ok((await r.text()).includes('<html lang="ca">'));});
 await check('Offline index with query',async()=>{const r=await first.fire('fetch',{request:{url:'https://example.test/repo/index.html?launch=1',method:'GET',mode:'navigate'}});assert.equal(r.status,200);});
 await check('Offline script request',async()=>{const r=await first.fire('fetch',{request:{url:'https://example.test/repo/js/math.js',method:'GET',mode:'cors'}});assert.ok((await r.text()).includes('function parse'));});
 await check('Offline icon request',async()=>{const r=await first.fire('fetch',{request:{url:'https://example.test/repo/icons/icon-512.png',method:'GET',mode:'no-cors'}});assert.ok((await r.arrayBuffer()).byteLength>1000);});
 await check('External request not intercepted',async()=>assert.equal(await first.fire('fetch',{request:{url:'https://other.test/file.pdf',method:'GET',mode:'navigate'}}),null));
 await check('Other repository not intercepted',async()=>assert.equal(await first.fire('fetch',{request:{url:'https://example.test/elsewhere/',method:'GET',mode:'navigate'}}),null));
 await check('POST not intercepted',async()=>assert.equal(await first.fire('fetch',{request:{url:'https://example.test/repo/',method:'POST',mode:'cors'}}),null));
 await check('Missing document not replaced with HTML',async()=>assert.equal(await first.fire('fetch',{request:{url:'https://example.test/repo/missing.pdf',method:'GET',mode:'navigate'}}),null));
 await check('Offline new solver engine',async()=>{const r=await first.fire('fetch',{request:{url:'https://example.test/repo/studio/engine.js',method:'GET',mode:'cors'}});assert.ok((await r.text()).includes('MatesEngine'));});
 await check('Offline dedicated worker source',async()=>{const r=await first.fire('fetch',{request:{url:'https://example.test/repo/studio/worker.js',method:'GET',mode:'cors'}});assert.ok((await r.text()).includes('importScripts'));});
 await check('Offline teacher guide separate page',async()=>{const r=await first.fire('fetch',{request:{url:'https://example.test/repo/docent.html',method:'GET',mode:'navigate'}});assert.ok((await r.text()).includes('studio-back'));});
 const broken=worker('https://example.test/repo/',source.replace(/const REVISION='[^']+'/,"const REVISION='broken'"));broken.state.missing='js/math.js';
 await check('Missing update asset rejects install',async()=>assert.rejects(()=>broken.fire('install')));
 await check('Failed install preserves previous cache',async()=>assert.ok(stores.has(first.CACHE_NAME)&&!stores.has(broken.CACHE_NAME)));
 const other=worker('https://example.test/other/');await other.fire('install');await other.fire('activate');
 await check('Caches isolated between repository paths',async()=>assert.ok(stores.has(first.CACHE_NAME)&&stores.has(other.CACHE_NAME)));
 const updated=worker('https://example.test/repo/',source.replace(/const REVISION='[^']+'/,"const REVISION='updated'"));await updated.fire('install');
 await check('Old cache retained while update waits',async()=>assert.ok(stores.has(first.CACHE_NAME)&&stores.has(updated.CACHE_NAME)));
 await check('User accepts waiting update',async()=>{await updated.fire('message',{data:{type:'SKIP_WAITING'}});assert.equal(updated.state.skipped,1);});
 await check('Activation deletes only own obsolete cache',async()=>{await updated.fire('activate');assert.ok(!stores.has(first.CACHE_NAME)&&stores.has(updated.CACHE_NAME)&&stores.has(other.CACHE_NAME));});
 await check('New worker reports ready',async()=>assert.equal((await updated.status()).ready,true));
 fs.writeFileSync(path.join(ROOT,'tests/studio/service-worker-results.json'),JSON.stringify({environment:'Node event simulation, memory caches and local fetch doubles',results},null,2));
 console.log('Service worker checks:',results.length,'Pass:',results.filter(r=>r.pass).length,'Fail:',results.filter(r=>!r.pass).length);
 if(results.some(r=>!r.pass))process.exitCode=1;
})();
