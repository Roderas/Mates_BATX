'use strict';
importScripts('./engine.js');
self.onmessage=function(event){
 const {id,query}=event.data||{};
 try { self.postMessage({id,ok:true,result:self.MatesEngine.solve(query)}); }
 catch(error){ self.postMessage({id,ok:false,error:String(error.message||error)}); }
};
