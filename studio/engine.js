/* Mates Estudi 2.0.0 -- deterministic, local teaching solver.
 * Original implementation. No eval, remote services or opaque CAS steps.
 * Numbers are exact rationals; numerical methods are explicitly labelled.
 */
(function(root){'use strict';
const MAXDEG=12, MAXLEN=450;
const err=s=>{throw new Error(s);};
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const r=a%b;a=b;b=r;}return a||1n;};
function N(a,b=1){
 if(typeof a==='object'&&a.k==='num')return a;
 if(typeof a==='number'&&!Number.isFinite(a))err('Valor no finit.');
 if(b===1&&typeof a!=='bigint'&&/[.eE]/.test(String(a))){let s=String(a).toLowerCase(),[m,e='0']=s.split('e');let neg=m.startsWith('-');m=m.replace(/^[+-]/,'');let [i,d='']=m.split('.');let n=BigInt((i||'0')+d)*(neg?-1n:1n);let p=Number(e)-d.length;if(Math.abs(p)>100)err('Nombre massa gran o petit.');return p>=0?N(n*10n**BigInt(p)):N(n,10n**BigInt(-p));}
 a=BigInt(a);b=BigInt(b);if(!b)err('Divisi\u00f3 per zero.');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);a/=g;b/=g;if(a.toString().length+b.toString().length>180)err('Resultat exacte massa gran. Redueix l\u2019expressi\u00f3.');return {k:'num',a:a.toString(),b:b.toString()};
}
const Z=N(0),ONE=N(1),X={k:'sym',s:'x'};
const eqn=(a,n)=>a&&a.k==='num'&&BigInt(a.a)===BigInt(n)*BigInt(a.b);
const val=a=>Number(a.a)/Number(a.b);
const qa=(a,b)=>N(BigInt(a.a)*BigInt(b.b)+BigInt(b.a)*BigInt(a.b),BigInt(a.b)*BigInt(b.b));
const qn=a=>N(-BigInt(a.a),BigInt(a.b));
const qs=(a,b)=>qa(a,qn(b));
const qm=(a,b)=>N(BigInt(a.a)*BigInt(b.a),BigInt(a.b)*BigInt(b.b));
const qd=(a,b)=>N(BigInt(a.a)*BigInt(b.b),BigInt(a.b)*BigInt(b.a));
const O=(op,a,b)=>({k:'op',op,a,b});const F=(s,a)=>({k:'fun',s,a});
const S=s=>({k:'sym',s});const key=a=>JSON.stringify(a);
function simp(n){
 if(n.k==='num'||n.k==='sym')return n;
 if(n.k==='fun'){let a=simp(n.a),s=n.s;
  if(a.k==='num'){
   if(s==='sqrt'&&val(a)>=0){let x=Math.sqrt(Number(a.a)),y=Math.sqrt(Number(a.b));if(Number.isSafeInteger(x)&&Number.isSafeInteger(y))return N(x,y);}
   if(s==='abs')return N(BigInt(a.a)<0n?-BigInt(a.a):BigInt(a.a),BigInt(a.b));
   if(eqn(a,0)&&['sin','tan','atan','asin'].includes(s))return Z;
   if(eqn(a,0)&&['cos','exp'].includes(s))return ONE;
   if(eqn(a,1)&&s==='ln')return Z;if(eqn(a,1)&&s==='exp')return S('e');
  }
  if(a.k==='sym'&&a.s==='pi'){if(s==='sin'||s==='tan')return Z;if(s==='cos')return N(-1);}
  if(a.k==='sym'&&a.s==='e'&&s==='ln')return ONE;
  return F(s,a);
 }
 let a=simp(n.a),b=simp(n.b),o=n.op;
 if(a.k==='num'&&b.k==='num'){
  if(o==='+')return qa(a,b);if(o==='-')return qs(a,b);if(o==='*')return qm(a,b);if(o==='/'&&!eqn(b,0))return qd(a,b);
  if(o==='^'&&b.b==='1'&&Math.abs(val(b))<=60&&!(eqn(a,0)&&val(b)<=0)){
   let p=BigInt(b.a),neg=p<0n;if(neg)p=-p;return neg?N(BigInt(a.b)**p,BigInt(a.a)**p):N(BigInt(a.a)**p,BigInt(a.b)**p);
  }
 }
 if(o==='+'){if(b.k==='num'&&val(b)<0)return simp(O('-',a,qn(b)));if(b.k==='op'&&b.op==='*'&&b.a.k==='num'&&val(b.a)<0)return simp(O('-',a,O('*',qn(b.a),b.b)));if(eqn(a,0))return b;if(eqn(b,0))return a;if(key(a)===key(b))return simp(O('*',N(2),a));}
 if(o==='-'){if(b.k==='num'&&val(b)<0)return simp(O('+',a,qn(b)));if(eqn(b,0))return a;if(key(a)===key(b))return Z;if(eqn(a,0))return simp(O('*',N(-1),b));}
 if(o==='*'){
  if(eqn(a,0)||eqn(b,0))return Z;if(eqn(a,1))return b;if(eqn(b,1))return a;
  if(b.k==='num'&&a.k!=='num')[a,b]=[b,a];
  if(a.k==='num'&&b.k==='op'&&b.op==='*'&&b.a.k==='num')return simp(O('*',qm(a,b.a),b.b));
 }
 if(o==='/'){if(eqn(b,1))return a;if(eqn(a,0)&&!eqn(b,0))return Z;}
 if(o==='^'){if(eqn(b,1))return a;if(eqn(b,0)&&!eqn(a,0))return ONE;if(eqn(a,1))return ONE;}
 return O(o,a,b);
}
const add=(a,b)=>simp(O('+',a,b)),sub=(a,b)=>simp(O('-',a,b)),mul=(a,b)=>simp(O('*',a,b)),div=(a,b)=>simp(O('/',a,b)),pow=(a,b)=>simp(O('^',a,b));
const neg=a=>mul(N(-1),a);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalize(s){return String(s).replace(/\u2212/g,'-').replace(/[\u00d7\u00b7]/g,'*').replace(/\u00f7/g,'/').replace(/\u03c0/g,'pi').replace(/\u221e/g,'inf').replace(/\u00b2/g,'^2').replace(/\u00b3/g,'^3').replace(/\u221a\s*\(/g,'sqrt(').replace(/(\d),(\d)/g,'$1.$2').replace(/\*\*/g,'^').toLowerCase().trim();}
const FUNCS=['arcsin','arccos','arctan','sqrt','asin','acos','atan','exp','abs','sin','cos','tan','ln','log'];
function parse(input,vars=['x']){
 let s=normalize(input).replace(/\s+/g,'');if(!s||s.length>MAXLEN)err('Escriu una expressi\u00f3 de fins a '+MAXLEN+' car\u00e0cters.');
 let i=0,count=0,depth=0;
 function A(){if(++count>180)err('Expressi\u00f3 massa complexa.');let c=s[i];
  if(c==='('){if(++depth>24)err('Massa par\u00e8ntesis imbricats.');i++;const n=E();if(s[i]!==')')err('Falta tancar un par\u00e8ntesi.');i++;depth--;return n;}
  const num=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/);if(num){i+=num[0].length;return N(num[0]);}
  for(const f of FUNCS)if(s.startsWith(f,i)){i+=f.length;if(s[i]!=='(')err('Escriu '+f+'(x) amb par\u00e8ntesis.');const a=A();return F(({log:'ln',arcsin:'asin',arccos:'acos',arctan:'atan'})[f]||f,a);}
  if(s.startsWith('pi',i)){i+=2;return S('pi');}if(c==='e'){i++;return S('e');}
  if(vars.includes(c)){i++;return S(c);}
  err('No reconec '+(c?'\u00ab'+c+'\u00bb':'el final')+'. Usa nombres, '+vars.join(', ')+', + - * / ^ i funcions amb par\u00e8ntesis.');
 }
 function P(){let a=A();if(s[i]==='^'){i++;a=O('^',a,U());}return a;}
 function U(){if(s[i]==='-'){i++;return O('*',N(-1),U());}if(s[i]==='+'){i++;return U();}return P();}
 function T(){let a=U();for(;;){let c=s[i];if(c==='*'||c==='/'){i++;a=O(c,a,U());}else if(c&&/[\d.(a-z]/.test(c))a=O('*',a,U());else return a;}}
 function E(){let a=T();while(s[i]==='+'||s[i]==='-'){let c=s[i++];a=O(c,a,T());}return a;}
 let n=E();if(i!==s.length)err('S\u00edmbol inesperat: '+s.slice(i));return n;
}
function show(n,p=0){
 if(n.k==='num'){let s=n.b==='1'?n.a:n.a+'/'+n.b;return p>1&&(n.b!=='1'||n.a[0]==='-')?'('+s+')':s;}
 if(n.k==='sym')return n.s;
 if(n.k==='fun')return n.s+'('+show(n.a)+')';
 let k={'+':1,'-':1,'*':2,'/':2,'^':3}[n.op],s;
 if(n.op==='*'&&eqn(n.a,-1))s='-'+show(n.b,3);else s=show(n.a,k+(n.op==='^'?1:0))+n.op+show(n.b,k+(['-','/','^'].includes(n.op)?1:0));return p>k?'('+s+')':s;
}
function body(n,p=0){
 if(n.k==='num'){let a=n.a,b=n.b,sg=a[0]==='-'?'<mo>&#x2212;</mo>':'';a=a.replace(/^-/,'');let v=b==='1'?'<mn>'+a+'</mn>':'<mfrac><mn>'+a+'</mn><mn>'+b+'</mn></mfrac>';return '<mrow>'+(sg&&p>1?'<mo>(</mo>':'')+sg+v+(sg&&p>1?'<mo>)</mo>':'')+'</mrow>';}
 if(n.k==='sym')return '<mi>'+esc(n.s==='pi'?'\u03c0':n.s)+'</mi>';
 if(n.k==='fun'){
  if(n.s==='exp')return '<msup><mi>e</mi>'+body(n.a)+'</msup>';
  if(n.s==='sqrt')return '<msqrt>'+body(n.a)+'</msqrt>';
  if(n.s==='abs')return '<mrow><mo>|</mo>'+body(n.a)+'<mo>|</mo></mrow>';
  return '<mrow><mi mathvariant="normal">'+esc(n.s)+'</mi><mo>&#x2061;</mo><mo>(</mo>'+body(n.a)+'<mo>)</mo></mrow>';
 }
 if(n.op==='/')return '<mfrac>'+body(n.a)+body(n.b)+'</mfrac>';
 if(n.op==='^')return '<msup>'+body(n.a,4)+body(n.b)+'</msup>';
 let k={'+':1,'-':1,'*':2}[n.op],v;
 if(n.op==='*'&&eqn(n.a,-1))v='<mo>&#x2212;</mo>'+body(n.b,2);
 else v=body(n.a,k)+'<mo>'+({'*':'&#x22C5;','-':'&#x2212;','+':'+'}[n.op])+'</mo>'+body(n.b,k+(n.op==='-'?1:0));
 return '<mrow>'+(p>k?'<mo>(</mo>':'')+v+(p>k?'<mo>)</mo>':'')+'</mrow>';
}
const M=b=>'<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow>'+b+'</mrow></math>';
const math=n=>M(body(n));
const relation=(a,op,b)=>M(body(a)+'<mo>'+esc(op)+'</mo>'+body(b));
const label=(s,n)=>M('<mtext>'+esc(s)+'</mtext>'+body(n));
const opbody=(s,n)=>'<mrow><mtext>'+esc(s)+'</mtext>'+body(n)+'</mrow>';
function evaluate(n,x=0,env={}){
 if(n.k==='num')return val(n);if(n.k==='sym')return n.s==='x'?x:n.s==='pi'?Math.PI:n.s==='e'?Math.E:env[n.s]??NaN;
 if(n.k==='fun'){const v=evaluate(n.a,x,env),f=({ln:Math.log,sqrt:Math.sqrt,exp:Math.exp,abs:Math.abs,sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan})[n.s];return f?f(v):NaN;}
 const a=evaluate(n.a,x,env),b=evaluate(n.b,x,env);if(n.op==='+')return a+b;if(n.op==='-')return a-b;if(n.op==='*')return a*b;if(n.op==='/')return b===0?NaN:a/b;
 if(a===0&&b<=0)return NaN;
 const q=simp(n.b);if(a<0&&q.k==='num'&&BigInt(q.b)%2n===1n){return (BigInt(q.a)%2n===0n?1:-1)*Math.pow(-a,b);}return Math.pow(a,b);
}
function substitute(n,v){if(n.k==='sym'&&n.s==='x')return v;if(n.k==='op')return simp(O(n.op,substitute(n.a,v),substitute(n.b,v)));if(n.k==='fun')return simp(F(n.s,substitute(n.a,v)));return n;}
function contains(n,s='x'){return n.k==='sym'?n.s===s:n.k==='op'?contains(n.a,s)||contains(n.b,s):n.k==='fun'?contains(n.a,s):false;}
const finite=n=>Number.isFinite(n);
const fmt=n=>n===Infinity?'+\u221e':n===-Infinity?'\u2212\u221e':!finite(n)?'no definit':n===0?'0':Number(n.toPrecision(9)).toString();
function constant(s,allowInf=false){s=normalize(s);if(allowInf&&['inf','+inf','infinity'].includes(s))return {v:Infinity,n:null};if(allowInf&&['-inf','-infinity'].includes(s))return {v:-Infinity,n:null};const n=simp(parse(s,[])),v=evaluate(n);if(!finite(v))err('Cal un valor num\u00e8ric finit.');return {n,v};}
function restrictions(n){
 const a=[],seen=new Set();const push=(expr,sign,info)=>{let id=show(expr)+sign;if(!seen.has(id)){seen.add(id);a.push({expr,sign,text:show(expr)+' '+sign+' 0'+(info?' ('+info+')':''),html:relation(expr,sign,Z)});}};
 function walk(t){if(t.k==='fun'){
   if(t.s==='ln')push(t.a,'>');if(t.s==='sqrt')push(t.a,'\u2265');if(t.s==='tan')push(F('cos',t.a),'\u2260');if(t.s==='asin'||t.s==='acos')push(sub(ONE,pow(t.a,N(2))),'\u2265');walk(t.a);
  }else if(t.k==='op'){
   if(t.op==='/')push(t.b,'\u2260');if(t.op==='^'){const e=simp(t.b);if(e.k==='num'){if(val(e)<=0)push(t.a,'\u2260');if(BigInt(e.b)%2n===0n)push(t.a,'\u2265');}else push(t.a,'>','branca real emprada');}
   walk(t.a);walk(t.b);
  }}walk(n);return a;
}
function tidy(p){while(p.length>1&&eqn(p[p.length-1],0))p.pop();return p;}
function pa(a,b){const c=Array(Math.max(a.length,b.length)).fill(Z).map((_,i)=>qa(a[i]||Z,b[i]||Z));return tidy(c);}
const pn=a=>a.map(qn);const ps=(a,b)=>pa(a,pn(b));
function pm(a,b){if(a.length+b.length-2>MAXDEG)return null;const c=Array(a.length+b.length-1).fill(Z);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)c[i+j]=qa(c[i+j],qm(a[i],b[j]));return tidy(c);}
function ppow(a,n){if(n<0||n>MAXDEG)return null;let r=[ONE];while(n--){r=pm(r,a);if(!r)return null;}return r;}
function poly(n){
 if(n.k==='num')return [n];if(n.k==='sym')return n.s==='x'?[Z,ONE]:null;if(n.k!=='op')return null;
 const a=poly(n.a),b=poly(n.b);if(!a||!b)return null;
 if(n.op==='+')return pa(a,b);if(n.op==='-')return ps(a,b);if(n.op==='*')return pm(a,b);
 if(n.op==='/'&&b.length===1&&!eqn(b[0],0))return a.map(t=>qd(t,b[0]));
 if(n.op==='^'&&b.length===1&&b[0].b==='1')return ppow(a,val(b[0]));return null;
}
function rational(n){
 const direct=poly(n);if(direct)return {p:direct,q:[ONE]};
 if(n.k!=='op')return null;const a=rational(n.a),b=rational(n.b);if(!a||!b)return null;
 let p,q;if(n.op==='+'||n.op==='-'){let c=pm(a.p,b.q),d=pm(b.p,a.q);if(!c||!d)return null;p=n.op==='+'?pa(c,d):ps(c,d);q=pm(a.q,b.q);}
 else if(n.op==='*'){p=pm(a.p,b.p);q=pm(a.q,b.q);}
 else if(n.op==='/'){p=pm(a.p,b.q);q=pm(a.q,b.p);}
 else if(n.op==='^'&&b.q.length===1&&b.p.length===1&&b.p[0].b==='1'){
  let k=val(b.p[0]);p=ppow(k>=0?a.p:a.q,Math.abs(k));q=ppow(k>=0?a.q:a.p,Math.abs(k));
 }else return null;return p&&q?{p:tidy(p),q:tidy(q)}:null;
}
function fromPoly(p){let n=Z;for(let i=p.length-1;i>=0;i--){if(eqn(p[i],0))continue;const mag=val(p[i])<0?qn(p[i]):p[i];const t=mul(mag,i?pow(X,N(i)):ONE);n=eqn(n,0)?(val(p[i])<0?neg(t):t):val(p[i])<0?sub(n,t):add(n,t);}return n;}
const peval=(p,x)=>p.reduceRight((v,c)=>qa(qm(v,x),c),Z);
const pnval=(p,x)=>p.reduceRight((v,c)=>v*x+val(c),0);
const pd=p=>p.length===1?[Z]:p.slice(1).map((v,i)=>qm(v,N(i+1)));
function pdiv(a,b){a=a.slice();if(b.every(t=>eqn(t,0)))err('Divisi\u00f3 per un polinomi nul.');const q=Array(Math.max(1,a.length-b.length+1)).fill(Z);let lim=0;while(a.length>=b.length&&!(a.length===1&&eqn(a[0],0))){if(++lim>20)err('Divisi\u00f3 massa complexa.');const k=a.length-b.length,c=qd(a[a.length-1],b[b.length-1]);q[k]=c;let v=Array(k).fill(Z).concat(b.map(t=>qm(t,c)));a=ps(a,v);}return {q:tidy(q),r:tidy(a)};}
function pgcd(a,b){let i=0;while(!(b.length===1&&eqn(b[0],0))){if(++i>30)return [ONE];let r=pdiv(a,b).r;a=b;b=r;}return a.map(t=>qd(t,a[a.length-1]));}
function simple(n){n=simp(n);const p=poly(n);return p?fromPoly(p):n;}
function diff(n,steps=[],depth=0){
 if(depth>28)err('Derivada massa complexa.');if(n.k==='num'||(n.k==='sym'&&n.s!=='x')){if(depth===0)steps.push({title:'Derivada constant',why:'Una constant no varia: la seva derivada és zero.',html:math(Z)});return Z;}if(n.k==='sym'){if(depth===0)steps.push({title:'Derivada de x',why:'La funció identitat té pendent 1.',html:math(ONE)});return ONE;}
 let a=n.a,b=n.b,da=diff(a,steps,depth+1),db=b?diff(b,steps,depth+1):null,r,title,why,rule;
 if(n.k==='fun'){
  const inner=contains(a),s=n.s;
  const base={sin:F('cos',a),cos:neg(F('sin',a)),tan:div(ONE,pow(F('cos',a),N(2))),exp:F('exp',a),ln:div(ONE,a),sqrt:div(ONE,mul(N(2),F('sqrt',a))),abs:div(a,F('abs',a)),asin:div(ONE,F('sqrt',sub(ONE,pow(a,N(2))))),acos:neg(div(ONE,F('sqrt',sub(ONE,pow(a,N(2)))))),atan:div(ONE,add(ONE,pow(a,N(2))))}[s];
  r=mul(base,da);title=a.k==='sym'&&a.s==='x'?'Derivada de '+s:'Regla de la cadena';why='Deriva la funci\u00f3 exterior i multiplica per la derivada de l\u2019interior '+show(a)+'.';
  if(s==='abs')why+=' La f\u00f3rmula no decideix els punts on l\u2019argument \u00e9s zero.';
 }else if(n.op==='+'||n.op==='-'){r=n.op==='+'?add(da,db):sub(da,db);title='Linealitat de la derivada';why='Deriva cada terme i conserva els signes.';}
 else if(n.op==='*'){r=add(mul(da,b),mul(a,db));title=!contains(a)||!contains(b)?'Factor constant':'Regla del producte';why='(u\u00b7v)\u2032 = u\u2032\u00b7v + u\u00b7v\u2032; no \u00e9s el producte de les derivades.';}
 else if(n.op==='/'){r=div(sub(mul(da,b),mul(a,db)),pow(b,N(2)));title='Regla del quocient';why='Derivada del numerador pel denominador, menys numerador per derivada del denominador; divideix pel denominador al quadrat.';}
 else if(!contains(b)){r=mul(mul(b,pow(a,sub(b,ONE))),da);title='Pot\u00e8ncia i regla de la cadena';why='Baixa l\u2019exponent, resta una unitat i multiplica per la derivada de la base.';}
 else if(!contains(a)){r=mul(mul(n,F('ln',a)),db);title='Derivada exponencial';why='La base constant positiva introdueix el factor ln(base).';}
 else{r=mul(n,add(mul(db,F('ln',a)),div(mul(b,da),a)));title='Derivaci\u00f3 logar\u00edtmica';why='Per u(x)^v(x), usa la branca real u>0 i deriva v\u00b7ln(u).';}
 r=simple(r);if(steps.length<35)steps.push({title,why,html:M('<mfrac><mi>d</mi><mrow><mi>d</mi><mi>x</mi></mrow></mfrac><mo>[</mo>'+body(n)+'<mo>]</mo><mo>=</mo>'+body(r))});return r;
}
function algebraEqual(a,b){if(key(simp(a))===key(simp(b)))return true;const ra=rational(a),rb=rational(b);if(ra&&rb){const c=pm(ra.p,rb.q),d=pm(rb.p,ra.q);if(c&&d)return ps(c,d).every(t=>eqn(t,0));}return false;}
function coefficientProduct(n){let c=ONE,f=[];function w(t){t=simp(t);if(t.k==='num')c=qm(c,t);else if(t.k==='op'&&t.op==='*'){w(t.a);w(t.b);}else f.push(t);}w(n);return {c,f:f.sort((a,b)=>show(a).localeCompare(show(b)))};}
function ratio(a,b){
 if(algebraEqual(a,b))return ONE;
 const p=poly(a),q=poly(b);if(p&&q&&p.length===q.length){const j=q.findIndex(t=>!eqn(t,0));if(j>=0){const r=qd(p[j],q[j]);if(p.every((v,i)=>eqn(qs(v,qm(r,q[i])),0)))return r;}}
 const u=coefficientProduct(a),v=coefficientProduct(b);if(u.f.length===v.f.length&&u.f.every((t,i)=>algebraEqual(t,v.f[i]))&&!eqn(v.c,0))return qd(u.c,v.c);return null;
}
function roots2(p){
 p=tidy(p.slice());if(p.length===1)return [];
 if(p.length===2)return [div(neg(p[0]),p[1])];
 if(p.length>3)return null;let [c,b,a]=p,D=qs(qm(b,b),qm(N(4),qm(a,c)));if(val(D)<0)return [];if(eqn(D,0))return [div(neg(b),mul(N(2),a))];
 let r=simp(F('sqrt',D));return [div(sub(neg(b),r),mul(N(2),a)),div(add(neg(b),r),mul(N(2),a))].sort((u,v)=>evaluate(u)-evaluate(v));
}
function numericRoots(f,a,b){
 if(!finite(a)||!finite(b)||a>=b||b-a>1e5||b-a<1e-9)err('Cal un interval finit amb a < b i amplada entre 10^-9 i 100000.');
 const n=1600,dx=(b-a)/n,ys=[],xs=[],out=[];
 for(let i=0;i<=n;i++){const x=a+i*dx;xs.push(x);ys.push(f(x));}
 const scale=Math.max(1,...ys.filter(finite).map(Math.abs).sort((u,v)=>u-v).slice(0,Math.floor(n*.8)));
 if(ys.every(y=>y===0))return {roots:[],identity:true};
 const push=x=>{const y=f(x);if(finite(y)&&Math.abs(y)<1e-8*Math.min(scale,10)&&!out.some(z=>Math.abs(x-z)<Math.max(1e-6,dx*.001)))out.push(x);};
 for(let i=0;i<=n;i++){
  if(ys[i]===0)push(xs[i]);
  if(i&&finite(ys[i])&&finite(ys[i-1])&&ys[i]*ys[i-1]<0){let l=xs[i-1],h=xs[i],fl=ys[i-1];for(let k=0;k<60;k++){let m=(l+h)/2,fm=f(m);if(!finite(fm))break;if(fl*fm<=0)h=m;else{l=m;fl=fm;}}push((l+h)/2);}
  if(i&&i<n&&finite(ys[i])&&Math.abs(ys[i])<Math.abs(ys[i-1])&&Math.abs(ys[i])<Math.abs(ys[i+1])){let l=xs[i-1],h=xs[i+1];for(let k=0;k<45;k++){let c=l+(h-l)/3,d=h-(h-l)/3;if(Math.abs(f(c))<Math.abs(f(d)))h=d;else l=c;}let r=(l+h)/2;if(Math.abs(f(r))<1e-9)push(r);}
  if(out.length>80)err('Massa arrels. Redueix l\u2019interval de cerca.');
 }
 return {roots:out.sort((u,v)=>u-v),identity:false};
}
function realPolynomialRoots(p){
 const e=roots2(p);if(e!==null)return e.map(z=>evaluate(z));
 // Isolate polynomial zeros using derivative roots (degree <= 12).
 const lead=val(p[p.length-1]),B=1+Math.max(...p.slice(0,-1).map(t=>Math.abs(val(t)/lead)));
 const critical=realPolynomialRoots(pd(p)),cuts=[-B,...critical.filter(t=>t>-B&&t<B),B],out=[];
 const at=x=>pnval(p,x),addz=x=>{if(!out.some(y=>Math.abs(x-y)<1e-6))out.push(x);};
 for(const c of critical)if(Math.abs(at(c))<1e-8*(1+p.reduce((a,t,i)=>a+Math.abs(val(t)*c**i),0)))addz(c);
 for(let i=0;i<cuts.length-1;i++){let a=cuts[i],b=cuts[i+1],fa=at(a);if(fa*at(b)<0){for(let j=0;j<70;j++){const m=(a+b)/2;if(fa*at(m)<=0)b=m;else{a=m;fa=at(m);}}addz((a+b)/2);}}
 return out.sort((a,b)=>a-b);
}
function safeInterval(n,a,b){
 if(a>b)[a,b]=[b,a];if(!finite(a)||!finite(b)||b-a>1e5)err('Nom\u00e9s intervals finits d\u2019amplada m\u00e0xima 100000.');
 for(const r of restrictions(n)){
  if(r.sign==='\u2260'||r.sign==='>'){
   const p=poly(r.expr),zeros=p?realPolynomialRoots(p):numericRoots(x=>evaluate(r.expr,x),a,b).roots;
   if(zeros.some(z=>z>=a-1e-10&&z<=b+1e-10))err('Hi ha un punt excl\u00f2s del domini a l\u2019interval. No es calcula aquesta integral com si fos pr\u00f2pia.');
  }
 }
 for(let i=0;i<=256;i++){const x=a+(b-a)*i/256;if(!finite(evaluate(n,x)))err('La funci\u00f3 no \u00e9s finita en tot el mostreig. No s\u2019admeten integrals impr\u00f2pies.');}
}
function integrateNumeric(f,a,b,tol=1e-8){
 if(a===b)return {value:0,error:0,evaluations:0};let sign=a<b?1:-1;if(a>b)[a,b]=[b,a];let evals=0,error=0;
 const at=x=>{if(++evals>100000)err('La quadratura no ha convergit dins el l\u00edmit de c\u00e0lcul.');const v=f(x);if(!finite(v))err('Integrand no finit: integral impr\u00f2pia o domini no v\u00e0lid.');return v;};
 // Start from 17 panels: avoids the simplest zero-sampling aliasing patterns.
 function rec(l,h,fl,fm,fh,s,eps,depth){let m=(l+h)/2,lc=at((l+m)/2),rc=at((m+h)/2),L=(m-l)*(fl+4*lc+fm)/6,R=(h-m)*(fm+4*rc+fh)/6,d=L+R-s;
  if(Math.abs(d)<=15*eps){error+=Math.abs(d)/15;return L+R+d/15;}
  if(!depth)err('No s\u2019ha estabilitzat la integral. Divideix l\u2019interval o revisa discontinu\u00eftats.');
  return rec(l,m,fl,lc,fm,L,eps/2,depth-1)+rec(m,h,fm,rc,fh,R,eps/2,depth-1);
 }
 let sum=0;for(let j=0;j<17;j++){const l=a+(b-a)*j/17,h=a+(b-a)*(j+1)/17,m=(l+h)/2,fl=at(l),fm=at(m),fh=at(h);sum+=rec(l,h,fl,fm,fh,(h-l)*(fl+4*fm+fh)/6,tol/17,22);}const value=sign*sum;return {value,error,evaluations:evals};
}
function primitive(n,steps=[],depth=0){
 if(depth>8)return null;n=simp(n);let r=null;
 const write=(title,why,out,extras)=>{steps.push({title,why,html:M('<mo>&#x222B;</mo>'+body(n)+'<mi>d</mi><mi>x</mi><mo>=</mo>'+body(out)+'<mo>+</mo><mi>C</mi>'),details:extras});return out;};
 const p=poly(n);
 if(p){const q=[Z,...p.map((v,i)=>qd(v,N(i+1)))];r=fromPoly(q);return write('Integra terme a terme','Suma una unitat a cada exponent i divideix el coeficient pel nou exponent. La constant C recull totes les primitives.',r);}
 if(!contains(n)){return write('Integral d\u2019una constant','Una constant k t\u00e9 per primitiva k\u00b7x.',mul(n,X));}
 if(n.k==='op'&&(n.op==='+'||n.op==='-')){const sa=[],sb=[],a=primitive(n.a,sa,depth+1),b=primitive(n.b,sb,depth+1);if(a&&b){steps.push(...sa,...sb);return write('Linealitat de la integral','Integra els sumands per separat i conserva el signe.',n.op==='+'?add(a,b):sub(a,b));}}
 if(n.k==='op'&&n.op==='*'&&(!contains(n.a)||!contains(n.b))){const c=!contains(n.a)?n.a:n.b,u=!contains(n.a)?n.b:n.a,st=[],v=primitive(u,st,depth+1);if(v){steps.push(...st);return write('Extreu el factor constant','La constant es mant\u00e9 fora de la integral.',mul(c,v));}}
 if(n.k==='op'&&n.op==='/'&&!contains(n.b)){const st=[],v=primitive(n.a,st,depth+1);if(v){steps.push(...st);return write('Factor constant al denominador','Divideix la primitiva pel denominador constant.',div(v,n.b));}}
 // Local substitution templates: u' times g(u), u'/u, u' times u^p.
 const candidates=[];function collect(t){if(contains(t)&&!candidates.some(z=>key(z)===key(t)))candidates.push(t);if(t.k==='op'){collect(t.a);collect(t.b);}else if(t.k==='fun')collect(t.a);}collect(n);
 for(const u of candidates){
  if(key(u)===key(n)||key(u).length>1000)continue;const du=diff(u,[]);if(eqn(du,0))continue;
  const templates=[
   [div(ONE,F('sqrt',u)),mul(N(2),F('sqrt',u)),"u'/sqrt(u)",'2sqrt(u)'],
   [div(ONE,u),F('ln',F('abs',u)),"u'/u",'ln|u|'],
   [F('exp',u),F('exp',u),"u'\u00b7exp(u)",'exp(u)'],
   [F('sin',u),neg(F('cos',u)),"u'\u00b7sin(u)",'-cos(u)'],
   [F('cos',u),F('sin',u),"u'\u00b7cos(u)",'sin(u)'],
   [div(ONE,add(ONE,pow(u,N(2)))),F('atan',u),"u'/(1+u^2)",'atan(u)'],
   [div(ONE,F('sqrt',sub(ONE,pow(u,N(2))))),F('asin',u),"u'/sqrt(1-u^2)",'asin(u)']
  ];
  const exps=[N(1),N(2),N(3),N(4),N(-2),N(1,2),N(-1,2)];
  for(const t of candidates)if(t.k==='op'&&t.op==='^'&&algebraEqual(t.a,u)&&t.b.k==='num'&&!eqn(t.b,-1))exps.push(t.b);
  for(const e of exps)templates.push([pow(u,e),div(pow(u,add(e,ONE)),add(e,ONE)),"u'\u00b7u^p",'u^(p+1)/(p+1)']);
  // sqrt input uses its function form, not only the power form.
  templates.push([F('sqrt',u),mul(N(2,3),pow(u,N(3,2))),"u'\u00b7sqrt(u)",'2u^(3/2)/3']);
  for(const [g,G,pat] of templates){const c=ratio(n,mul(du,g));if(c){r=mul(c,G);return write('Canvi de variable','Reconeix '+pat+'. Pren u = '+show(u)+', du = ('+show(du)+') dx. Ajusta el factor constant '+show(c)+' i torna a x.',r);}}
 }

 // Constant-base exponentials and squared trigonometric functions with affine arguments.
 if(n.k==='op'&&n.op==='^'&&!contains(n.a)&&contains(n.b)){
  const k=diff(n.b,[]),base=evaluate(n.a);
  if(!contains(k)&&Number.isFinite(evaluate(k))&&evaluate(k)!==0&&base>0&&base!==1)
   return write('Primitiva exponencial','La derivada de la funci\u00f3 de l\u2019exponent \u00e9s constant. Divideix per aquest factor i per ln(base).',div(n,mul(k,F('ln',n.a))));
 }
 if(n.k==='op'&&n.op==='^'&&eqn(n.b,2)&&n.a.k==='fun'&&['sin','cos'].includes(n.a.s)){
  const u=n.a.a,k=diff(u,[]);
  if(!contains(k)&&Number.isFinite(evaluate(k))&&evaluate(k)!==0){
   const term=div(F('sin',mul(N(2),u)),mul(N(4),k)),out=n.a.s==='sin'?sub(div(X,N(2)),term):add(div(X,N(2)),term);
   return write('Reducci\u00f3 de pot\u00e8ncia','Usa sin(u)^2 = (1-cos(2u))/2 o cos(u)^2 = (1+cos(2u))/2. Integra i ajusta la derivada constant de 2u.',out);
  }
 }
 if(n.k==='fun'&&['sin','cos','exp'].includes(n.s)){
  const k=diff(n.a,[]);
  if(!contains(k)&&Number.isFinite(evaluate(k))&&evaluate(k)!==0){
   const primitive=n.s==='sin'?neg(F('cos',n.a)):n.s==='cos'?F('sin',n.a):n;
   return write('Argument amb derivada constant','Aplica la primitiva elemental i divideix per la derivada de l\u2019argument: '+show(k)+'.',div(primitive,k));
  }
 }
 // Basic functions of affine arguments, including ln by parts.
 if(n.k==='fun'){
  const a=poly(n.a);if(a&&a.length===2&&!eqn(a[1],0)){
   const u=n.a,k=a[1];
   if(n.s==='ln')return write('Integraci\u00f3 per parts','Amb u=ln(ax+b), la primitiva de ln(u) \u00e9s u\u00b7ln(u)-u; divideix per la derivada a de l\u2019argument. Cal ax+b>0.',div(sub(mul(u,F('ln',u)),u),k));
   if(n.s==='tan')return write('Integral de la tangent','Escriu tan(u)=sin(u)/cos(u) i usa el canvi v=cos(u).',div(neg(F('ln',F('abs',F('cos',u)))),k));
  }
 }
 // Polynomial times exp/sin/cos(affine): repeated integration by parts.
 if(n.k==='op'&&n.op==='*'){
  let P=poly(n.a),v=n.b;if(!P){P=poly(n.b);v=n.a;}
  if(P&&P.length<=6&&v.k==='fun'&&['exp','sin','cos'].includes(v.s)){
   const a=poly(v.a);if(a&&a.length===2&&!eqn(a[1],0)){
    const anti=(type)=>type==='exp'?{n:div(F('exp',v.a),a[1]),s:'exp',c:qd(ONE,a[1])}:type==='sin'?{n:div(neg(F('cos',v.a)),a[1]),s:'cos',c:qd(N(-1),a[1])}:{n:div(F('sin',v.a),a[1]),s:'sin',c:qd(ONE,a[1])};
    let result=Z,cur=P,coef=ONE,type=v.s;
    for(let i=0;i<P.length;i++){
     const z=anti(type);const term=mul(coef,mul(fromPoly(cur),z.n));result=add(result,term);
     steps.push({title:'Per parts'+(i?' \u00b7 repetici\u00f3 '+(i+1):''),why:'Pren u='+show(fromPoly(cur))+' i dv='+type+'('+show(v.a)+') dx. Aplica \u222B u dv = uv - \u222B v du.',html:label('Terme acumulat: ',result)});
     coef=mul(coef,neg(z.c));cur=pd(cur);type=z.s;
    }
    return simple(result);
   }
  }
 }
 // Rational partial fractions (denominator <= quadratic) plus long division.
 const rat=rational(n);
 if(rat&&rat.q.length>1&&rat.q.length<=3){
  const d=pdiv(rat.p,rat.q),extra=fromPoly([Z,...d.q.map((c,i)=>qd(c,N(i+1)))]),rem=d.r;
  if(rem.every(t=>eqn(t,0)))return write('Divisi\u00f3 de polinomis','La divisi\u00f3 \u00e9s exacta. Integra el quocient i conserva les exclusions del domini original.',extra);
  const q=rat.q;
  if(q.length===2&&rem.length===1){r=add(extra,mul(qd(rem[0],q[1]),F('ln',F('abs',fromPoly(q)))));return write('Fracci\u00f3 amb denominador lineal','Ajusta la derivada constant del denominador: \u222B 1/(ax+b) dx = ln|ax+b|/a.',r);}
  if(q.length===3){
   const [c,b,a]=q,lambda=qd(rem[1]||Z,qm(N(2),a)),mu=qs(rem[0],qm(lambda,b)),D=qs(qm(N(4),qm(a,c)),qm(b,b));let J=null;
   if(val(D)>0){const sd=simp(F('sqrt',D));J=mul(div(N(2),sd),F('atan',div(add(mul(qm(N(2),a),X),b),sd)));}
   else {const rr=roots2(q);if(rr&&rr.length===2&&rr.every(t=>simp(t).k==='num')){const u=rr[0],v=rr[1];J=mul(div(ONE,mul(a,sub(u,v))),sub(F('ln',F('abs',sub(X,u))),F('ln',F('abs',sub(X,v)))));}else if(rr&&rr.length===1){J=neg(div(ONE,mul(a,sub(X,rr[0]))));}}
   if(J){r=add(extra,add(mul(lambda,F('ln',F('abs',fromPoly(q)))),mul(mu,J)));return write('Descomposici\u00f3 racional','Divideix primer si cal. Escriu el residu com \u03bb\u00b7Q\u2032+\u03bc; la part Q\u2032/Q dona un logaritme. Completa el quadrat o descompon en fraccions simples per a la resta.',simple(r));}
  }
 }
 return null;
}
function derivativeCheck(Fn,f){let checks=0,max=0;for(const x of [-3.7,-1.3,.23,.8,1.7,3.2]){let a=evaluate(diff(Fn,[]),x),b=evaluate(f,x);if(finite(a)&&finite(b)){checks++;max=Math.max(max,Math.abs(a-b)/(1+Math.abs(b)));}}return {checks,ok:checks>0&&max<1e-7,error:max};}
const step=(title,why,html)=>({title,why,html});
function quadraticSteps(p,steps){const e=roots2(p);steps.push(step('Porta tots els termes al mateix membre','Resta el membre dret i agrupa els coeficients de la mateixa pot\u00e8ncia.',relation(fromPoly(p),'=',Z)));
 if(p.length===2){steps.push(step('A\u00eflla el terme amb x','Passa el terme independent a l\u2019altre membre.',relation(mul(p[1],X),'=',neg(p[0]))));steps.push(step('Divideix pel coeficient de x','El coeficient \u00e9s diferent de zero.',relation(X,'=',e[0])));}
 if(p.length===3){const [c,b,a]=p,D=qs(qm(b,b),qm(N(4),qm(a,c)));steps.push(step('Calcula el discriminant','Identifica a, b i c. El signe de \u0394 decideix el nombre de solucions reals.',label('\u0394 = b\u00b2 - 4ac = ',D)));
 if(val(D)>=0){steps.push(step('Aplica la f\u00f3rmula quadr\u00e0tica','x = (-b \u00b1 \u221a\u0394)/(2a). Mant\u00e9n els dos signes quan \u0394>0.',M('<mi>x</mi><mo>=</mo><mfrac><mrow>'+body(neg(b))+'<mo>&#x00B1;</mo>'+body(F('sqrt',D))+'</mrow>'+body(mul(N(2),a))+'</mfrac>')));}}
 return e;
}
function factorPolynomial(p){
 const fac=[],work=p.slice(),leading=p[p.length-1];let cur=work,attempts=0;
 while(cur.length>3&&attempts++<12){
  if(eqn(cur[0],0)){fac.push(X);cur=cur.slice(1);continue;}
  let lcm=1n;for(const c of cur)lcm=lcm*BigInt(c.b)/gcd(lcm,BigInt(c.b));
  let c0=BigInt(cur[0].a)*lcm/BigInt(cur[0].b),cn=BigInt(cur[cur.length-1].a)*lcm/BigInt(cur[cur.length-1].b);
  const divisors=k=>{k=Number(k<0n?-k:k);if(!Number.isSafeInteger(k)||k>1000000)return [];let out=[];for(let i=1;i*i<=k;i++)if(k%i===0){out.push(i);if(i*i!==k)out.push(k/i);}return out;};
  const ns=divisors(c0),ds=divisors(cn);let found=null;
  outer:for(const a of ns)for(const b of ds)for(const sg of [-1,1]){let r=N(sg*a,b);if(eqn(peval(cur,r),0)){found=r;break outer;}}
  if(!found)break;fac.push(sub(X,found));cur=pdiv(cur,[qn(found),ONE]).q;
 }
 const r=roots2(cur);if(r&&cur.length>1&&r.length){fac.push(N(val(cur[cur.length-1])===0?1:cur[cur.length-1].a,cur[cur.length-1].b));if(r.length===1&&cur.length===3)fac.push(pow(sub(X,r[0]),N(2)));else for(const v of r)fac.push(sub(X,v));cur=[ONE];}
 if(cur.length>1||!eqn(cur[0],1))fac.push(fromPoly(cur));
 return {n:fac.reduce((a,b)=>mul(a,b),ONE),complete:cur.length<=3,fac};
}
function limRational(r,at,side,steps){
 let p=tidy(r.p.slice()),q=tidy(r.q.slice());if(q.every(t=>eqn(t,0)))err('Denominador nul: no es defineix cap funci\u00f3.');
 if(!finite(at.v)){
  const deg=p.length-q.length,coeff=qd(p[p.length-1],q[q.length-1]);steps.push(step('Compara els termes de grau m\u00e9s alt','El quocient es comporta com el quocient dels coeficients principals multiplicat per x elevat a la difer\u00e8ncia de graus.',math(mul(coeff,pow(X,N(deg))))));
  if(deg<0||p.every(t=>eqn(t,0)))return {n:Z,text:'0'};if(deg===0)return {n:coeff,text:show(coeff)};const sg=Math.sign(val(coeff))*(at.v<0&&deg%2?-1:1);return {text:sg>0?'+\u221e':'\u2212\u221e'};
 }
 if(!at.n||at.n.k!=='num')return null;
 let den=peval(q,at.n),num=peval(p,at.n);
 if(!eqn(den,0)){const v=qd(num,den);steps.push(step('Substituci\u00f3 directa','El denominador no s\u2019anul\u00b7la: la funci\u00f3 racional \u00e9s cont\u00ednua en aquest punt.',math(v)));return {n:v,text:show(v)};}
 let m=0,n=0,pp=p,qq=q;
 if(p.every(t=>eqn(t,0))){return {n:Z,text:'0'};}
 while(eqn(peval(pp,at.n),0)&&pp.length>1){pp=pd(pp);m++;}
 while(eqn(peval(qq,at.n),0)&&qq.length>1){qq=pd(qq);n++;}
 const fac=k=>{let v=ONE;for(let i=2;i<=k;i++)v=qm(v,N(i));return v;};
 const c=qd(qd(peval(pp,at.n),fac(m)),qd(peval(qq,at.n),fac(n))),power=m-n;
 steps.push(step('Compara els ordres d\u2019anul\u00b7laci\u00f3','El numerador s\u2019anul\u00b7la '+m+' vegades i el denominador '+n+'. El comportament local \u00e9s:',math(mul(c,pow(sub(X,at.n),N(power))))));
 if(power>0)return {n:Z,text:'0'};if(power===0)return {n:c,text:show(c)};
 const right=val(c)>0?'+\u221e':'\u2212\u221e',left=(-power)%2?(val(c)>0?'\u2212\u221e':'+\u221e'):right;
 steps.push(step('Distingeix els l\u00edmits laterals','Esquerre: '+left+'. Dret: '+right+'. Un l\u00edmit bilateral requereix que coincideixin.',null));
 return {text:side==='left'?left:side==='right'?right:left===right?left:'No existeix el l\u00edmit bilateral',left,right};
}
// Finite Taylor series at 0 for analytic elementary functions, used only for limits.
function series(n,K=6){
 const trim=p=>p.slice(0,K+1),sum=(a,b)=>trim(pa(a,b)),prod=(a,b)=>{const c=Array(K+1).fill(Z);for(let i=0;i<a.length;i++)for(let j=0;j<b.length&&i+j<=K;j++)c[i+j]=qa(c[i+j],qm(a[i],b[j]));return tidy(c);};
 function power(a,k){let p=[ONE];while(k--)p=prod(p,a);return p;}
 function inv(a){if(eqn(a[0],0))return null;const p=[qd(ONE,a[0])];for(let i=1;i<=K;i++){let s=Z;for(let j=1;j<=i;j++)s=qa(s,qm(a[j]||Z,p[i-j]));p.push(qd(qn(s),a[0]));}return p;}
 function w(t){if(t.k==='num')return [t];if(t.k==='sym')return t.s==='x'?[Z,ONE]:null;
  if(t.k==='op'){const a=w(t.a),b=w(t.b);if(!a||!b)return null;if(t.op==='+')return sum(a,b);if(t.op==='-')return sum(a,pn(b));if(t.op==='*')return prod(a,b);if(t.op==='/'){const bi=inv(b);return bi?prod(a,bi):null;}if(t.op==='^'&&b.length===1&&b[0].b==='1'&&Math.abs(val(b[0]))<=20){const z=power(a,Math.abs(val(b[0])));return val(b[0])>=0?z:inv(z);}return null;}
  const a=w(t.a);if(!a)return null;let u=a,f=t.s;if(f==='ln'){if(!eqn(a[0],1))return null;u=a.slice();u[0]=Z;}else if(!eqn(a[0],0))return null;
  if(!['sin','cos','exp','ln'].includes(f))return null;let out=[Z],factor=ONE;
  for(let i=0;i<=K;i++){if(i>0)factor=qm(factor,N(i));let c=Z;if(f==='exp')c=qd(ONE,factor);if(f==='sin'&&i%2)c=qd(N(i%4===1?1:-1),factor);if(f==='cos'&&i%2===0)c=qd(N(i%4===0?1:-1),factor);if(f==='ln'&&i)c=N(i%2?1:-1,i);if(!eqn(c,0))out=sum(out,power(u,i).map(x=>qm(x,c)));}return out;
 }return w(n);
}
function solve(query){
 const mode=query.mode||'eq',input=String(query.expression||'').trim(),steps=[],warnings=[],result={mode,steps,warnings,method:'Simb\u00f2lic',title:'Resultat',resultText:'',resultHTML:'',plots:[],points:[],rows:[],restrictions:[]};
 const at=()=>constant(query.a||'0',mode==='limit'),interval=()=>{const a=constant(query.xmin||'-6').v,b=constant(query.xmax||'6').v;if(a>=b||b-a>100000)err('Cal una finestra x m\u00ednim < x m\u00e0xim (amplada m\u00e0xima 100000).');return [a,b];};
 if(mode==='system')return solveSystem(input,result);
 let split=input.split('='),ineq=input.match(/(<=|>=|<|>|\u2264|\u2265)/);
 let A,B=null,cmp=null;
 if(mode==='inequality'){if(!ineq)err('Escriu una inequaci\u00f3, per exemple x^2-5x+6<=0.');let s=input.split(ineq[0]);if(s.length!==2)err('Usa una sola desigualtat.');A=parse(s[0]);B=parse(s[1]);cmp=ineq[0].replace('\u2264','<=').replace('\u2265','>=');}
 else{if(split.length>2)err('Usa un sol signe igual.');A=parse(split[0]);if(split.length===2){if(mode!=='eq')err('En aquesta eina escriu una expressi\u00f3, no una equaci\u00f3.');B=parse(split[1]);}}
 const original=A,originalB=B;const f=x=>evaluate(original,x);
 result.inputHTML=B?relation(A,cmp||'=',B):math(A);result.restrictions=[...restrictions(A),...(B?restrictions(B):[])];
 for(const r of result.restrictions){const cp=poly(r.expr);if(!contains(r.expr)||(cp&&cp.length===1)){const v=cp&&cp.length===1?val(cp[0]):evaluate(r.expr);if(!finite(v)||(r.sign==='>'?v<=0:r.sign==='\u2265'?v<0:v===0))err('Expressi\u00f3 sense domini real: '+r.text);}}
 if(mode==='derivative'){
  let order=Number(query.order||1);if(![1,2].includes(order))err('Ordre adm\u00e8s: 1 o 2.');let d=A;
  for(let i=0;i<order;i++){if(order>1)steps.push(step('Derivada d\u2019ordre '+(i+1),'Torna a derivar el resultat anterior.',null));d=diff(d,steps);}
  result.resultText="f"+"'".repeat(order)+'(x) = '+show(d);result.resultHTML=label("f"+"'".repeat(order)+'(x) = ',d);result.plots=[{n:A,name:'f(x)',style:0},{n:d,name:"f"+"'".repeat(order)+'(x)',style:1}];
  if(query.a!==undefined&&query.a!==''){
   const a=constant(query.a),m=evaluate(diff(A,[]),a.v),y=f(a.v);
   if(finite(m)&&finite(y)&&restrictions(diff(A,[])).every(r=>{const v=evaluate(r.expr,a.v);return finite(v)&&(r.sign==='>'?v>0:r.sign==='\u2265'?v>=0:Math.abs(v)>1e-12);})){const tangent=add(mul(N(m),sub(X,a.n)),N(y));steps.push(step('Recta tangent en x = '+fmt(a.v),'Fes servir y-f(a)=f\u2032(a)(x-a). Els coeficients decimals s\u00f3n aproximats.',label('y = ',tangent)));result.plots.push({n:tangent,name:'Tangent',style:2});result.points.push({x:a.v,y,label:'Tangent'});}
   else warnings.push('No es dona una tangent ordin\u00e0ria en aquest punt: comprova el domini i la derivabilitat.');
  }
  warnings.push('Les f\u00f3rmules s\u2019apliquen on existeixen la funci\u00f3 i les derivades; les exclusions del domini original no desapareixen en simplificar.');
 }
 else if(mode==='primitive'||mode==='definite'||mode==='area'){
  const integrand=mode==='area'?sub(A,parse(query.g||'0')):A;let st=[],P=primitive(integrand,st);const ch=P?derivativeCheck(P,integrand):null;
  if(P&&ch.checks>0&&!ch.ok){P=null;st=[];warnings.push('El control num\u00e8ric no ha confirmat la primitiva: no es mostra com a soluci\u00f3.');}
  if(mode==='primitive'){
   if(!P){result.method='No implementat';result.resultText='No s\u2019ha trobat una primitiva amb les regles locals disponibles.';warnings.push('Aix\u00f2 no significa que no existeixi. Usa Integral definida per obtenir una aproximaci\u00f3 en un interval propi.');}
   else{steps.push(...st);result.resultText='F(x) = '+show(P)+' + C';result.resultHTML=M('<mi>F</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo>'+body(P)+'<mo>+</mo><mi>C</mi>');steps.push(step('Comprova derivant','La regla aplicada dona una primitiva. Control addicional en '+ch.checks+' punts del domini compartit; aquest mostreig no substitueix una prova d\u2019identitat.',label("F'(x) = ",diff(P,[]))));result.plots=[{n:A,name:'f(x)',style:0},{n:P,name:'F(x), C=0',style:1}];}
  }else{
   let a=constant(query.a||'0'),b=constant(query.b||'1');if(a.v===b.v)err('Tria dos l\u00edmits diferents.');safeInterval(integrand,Math.min(a.v,b.v),Math.max(a.v,b.v));if(mode==='area'){const G=parse(query.g||'0');safeInterval(A,a.v,b.v);safeInterval(G,a.v,b.v);result.restrictions.push(...restrictions(G));}let fn=mode==='area'?x=>Math.abs(evaluate(integrand,x)):x=>evaluate(integrand,x);const calc=integrateNumeric(fn,mode==='area'?Math.min(a.v,b.v):a.v,mode==='area'?Math.max(a.v,b.v):b.v);result.numeric=calc.value;
   if(mode==='definite'&&P){steps.push(...st);const delta=sub(substitute(P,b.n),substitute(P,a.n));result.resultHTML=label('Integral = ',delta);result.resultText='Integral = '+show(delta)+' \u2248 '+fmt(calc.value);steps.push(step('Regla de Barrow','Avalua la primitiva a l\u2019extrem superior i resta el valor a l\u2019inferior.',M(body(substitute(P,b.n))+'<mo>-</mo>'+body(substitute(P,a.n))+'<mo>=</mo>'+body(delta))));result.method='Simb\u00f2lic + control num\u00e8ric';}
   else{result.method='Aproximaci\u00f3 num\u00e8rica';result.resultText=(mode==='area'?'\u00c0rea':'Integral')+' \u2248 '+fmt(calc.value);if(mode==='definite')warnings.push('No hi ha desenvolupament simb\u00f2lic disponible per a aquesta primitiva.');}
   if(mode==='area'){const G=parse(query.g||'0');result.plots=[{n:A,name:'f(x)',style:0},{n:G,name:'g(x)',style:1}];result.shade={f:A,g:G,a:Math.min(a.v,b.v),b:Math.max(a.v,b.v)};steps.push(step('\u00c0rea, no integral amb signe','Integra |f-g| amb l\u2019extrem menor primer. Aix\u00ed cada part de la regi\u00f3 aporta \u00e0rea no negativa.',math(F('abs',integrand))));}
   else{result.plots=[{n:A,name:'f(x)',style:0}];result.shade={f:A,a:Math.min(a.v,b.v),b:Math.max(a.v,b.v)};}
   steps.push(step('Control amb Simpson adaptatiu','Aproximaci\u00f3 '+fmt(calc.value)+'. Estimaci\u00f3 interna de l\u2019error: '+fmt(calc.error)+'; '+calc.evaluations+' avaluacions. No \u00e9s una cota d\u2019error demostrada.',null));
   warnings.push('Nom\u00e9s integrals pr\u00f2pies en intervals finits. La detecci\u00f3 num\u00e8rica de discontinu\u00eftats no \u00e9s una prova general de continu\u00eftat.');result.window=[Math.min(a.v,b.v)-.2*Math.abs(b.v-a.v),Math.max(a.v,b.v)+.2*Math.abs(b.v-a.v)];
  }
 }
 else if(mode==='simplify'||mode==='expand'||mode==='factor'){
  const r=rational(A),p=poly(A);let out=simple(A);
  if(mode==='expand'){if(!p)err('Desenvolupament disponible per a polinomis en x de grau m\u00e0xim '+MAXDEG+'.');out=fromPoly(p);steps.push(step('Aplica la distributiva','Multiplica els termes, suma els exponents dels productes de pot\u00e8ncies de x i agrupa els termes semblants.',relation(A,'=',out)));}
  else if(mode==='factor'){if(!p)err('Factoritzaci\u00f3 disponible per a polinomis en x de grau m\u00e0xim '+MAXDEG+'.');const Fp=factorPolynomial(p);out=Fp.n;steps.push(step('Cerca factors lineals','Usa arrels racionals quan se\u2019n troben. Si queda una quadr\u00e0tica, comprova el discriminant.',relation(fromPoly(p),'=',out)));if(!Fp.complete)warnings.push('Factoritzaci\u00f3 parcial: un factor restant de grau alt no s\u2019ha descompost. No es declara irreductible.');steps.push(step('Comprova el producte','En desenvolupar els factors s\u2019ha de recuperar el polinomi inicial.',math(fromPoly(p))));}
  else if(r){const g=pgcd(r.p,r.q),P=pdiv(r.p,g).q,Q=pdiv(r.q,g).q;out=div(fromPoly(P),fromPoly(Q));steps.push(step('Agrupa i redueix la fracci\u00f3','Factor com\u00fa polin\u00f2mic del numerador i denominador:',math(fromPoly(g))));steps.push(step('Conserva les exclusions','La forma simplificada \u00e9s equivalent nom\u00e9s en el domini de l\u2019expressi\u00f3 original.',relation(A,'=',out)));}
  else{steps.push(step('Simplificaci\u00f3 elemental','Calcula constants i elimina factors neutres. Aquesta eina no aplica totes les identitats trigonom\u00e8triques ni totes les equival\u00e8ncies possibles.',relation(A,'=',out)));result.method='Simplificaci\u00f3 elemental';}
  result.resultText=show(out);result.resultHTML=math(out);result.plots=[{n:A,name:'Original',style:0}];
 }
 else if(mode==='eq'||mode==='inequality'){
  B=B||Z;const H=sub(A,B),r=rational(H);result.plots=[{n:A,name:'Membre esquerre',style:0},{n:B,name:'Membre dret',style:1}];
  if(mode==='inequality')return solveInequality(A,B,cmp,r,result);
  if(r&&r.q.every(c=>eqn(c,0)))err('L\u2019equaci\u00f3 cont\u00e9 un denominador nul.');
  if(r&&r.p.length===1){if(eqn(r.p[0],0)){result.resultText='Identitat en el domini original';warnings.push('Qualsevol x adm\u00e8s pel domini satisf\u00e0 l\u2019equaci\u00f3. No incloguis els punts exclosos.');}else result.resultText='Sense solucions reals';steps.push(step('Agrupa tots els termes','L\u2019equaci\u00f3 queda redu\u00efda a una constant igual a zero.',relation(fromPoly(r.p),'=',Z)));}
  else if(r&&r.p.length<=3){
   if(r.q.length>1)steps.push(step('Elimina denominadors amb condicions','El numerador ha de ser zero i el denominador ha de ser diferent de zero.',relation(fromPoly(r.p),'=',Z)));
   let rr=quadraticSteps(r.p,steps),valid=rr.filter(t=>{const x=evaluate(t),l=evaluate(A,x),v=evaluate(B,x);return finite(l)&&finite(v)&&Math.abs(l-v)<=1e-7*(1+Math.abs(l)+Math.abs(v));});
   if(valid.length<rr.length)warnings.push('S\u2019han descartat candidats que no satisfan l\u2019equaci\u00f3 original o que queden fora del domini.');
   result.solutions=valid.map(z=>evaluate(z));result.resultText=valid.length?'x = '+valid.map(z=>show(z)).join(' ; x = '):'Sense solucions reals';result.resultHTML=valid.length?M('<mi>x</mi><mo>&#x2208;</mo><mo>{</mo>'+valid.map(z=>body(z)).join('<mo>,</mo>')+'<mo>}</mo>'):null;
   steps.push(step('Comprova a l\u2019equaci\u00f3 original','Substitueix cada candidat i comprova tots dos membres, tamb\u00e9 els denominadors originals.',null));result.points=valid.map(n=>({x:evaluate(n),y:evaluate(A,evaluate(n)),label:'Soluci\u00f3'}));
  }else{
   const [a,b]=interval(),fx=x=>evaluate(H,x),rr=numericRoots(fx,a,b);result.method='Cerca num\u00e8rica acotada';result.solutions=rr.roots;result.resultText=rr.identity?'Identitat al mostreig; no demostrada':rr.roots.length?'x \u2248 '+rr.roots.map(fmt).join(' ; '):'No s\u2019han localitzat arrels a ['+fmt(a)+', '+fmt(b)+']';result.points=rr.roots.map(x=>({x,y:evaluate(A,x),label:fmt(x)}));steps.push(step('Transforma en una funci\u00f3 nul\u00b7la','Cerca els zeros de f-g dins la finestra escollida.',relation(H,'=',Z)));steps.push(step('A\u00eflla i refina candidats','Mostreja, refina canvis de signe per bisecci\u00f3 i explora m\u00ednims de |f-g|. Accepta nom\u00e9s candidats amb residu petit.',null));warnings.push('La cerca no garanteix totes les arrels, ni solucions fora de l\u2019interval. No trobar-ne no prova que no existeixin.');result.window=[a,b];
  }
 }
 else if(mode==='limit'){
  const t=at(),side=query.side||'both',r=rational(A);let L=r?limRational(r,t,side,steps):null;

  if(!L&&finite(t.v)&&finite(f(t.v))){
   const interior=restrictions(A).every(c=>{const v=evaluate(c.expr,t.v);return finite(v)&&(c.sign==='>'||c.sign==='\u2265'?v>1e-12:Math.abs(v)>1e-12);});
   if(interior){const v=substitute(A,t.n);L={n:v,text:show(v)};steps.push(step('Substituci\u00f3 en un punt interior del domini','Les operacions elementals d\u2019aquesta expressi\u00f3 s\u00f3n cont\u00ednues en aquest punt. Les restriccions s\u2019han comprovat abans de substituir.',math(v)));}
  }
  if(!L&&t.v===0&&A.k==='op'&&A.op==='/'){
   const p=series(A.a),q=series(A.b);if(p&&q&&!q.every(v=>eqn(v,0))){steps.push(step('Desenvolupament local a l\u2019origen','Per a les funcions anal\u00edtiques reconegudes, calcula els coeficients de Taylor fins a ordre 6. Compara el primer terme no nul de cada membre.',M(body(fromPoly(p))+'<mo>;</mo>'+body(fromPoly(q)))));L=limRational({p,q},t,side,steps);}
  }
  if(!L&&!finite(t.v)&&A.k==='op'&&A.op==='^'){
   const base=rational(A.a),ex=poly(A.b);
   if(base&&ex&&ex.length===2&&base.p.length===base.q.length){const delta=ps(base.p,base.q),d=base.q.length-delta.length;
    if(d===1){const c=qd(delta[delta.length-1],base.q[base.q.length-1]),v=mul(c,ex[1]);L={n:simp(F('exp',v)),text:show(simp(F('exp',v)))};steps.push(step('L\u00edmit exponencial notable','La base tendeix a 1. Usa ln(1+u)/u\u21921 i pren l\u2019exponencial del l\u00edmit de l\u2019exponent pel petit increment de la base.',math(F('exp',v))));}
   }
  }
  if(L){result.resultText='L\u00edmit = '+L.text;result.resultHTML=L.n?label('L\u00edmit = ',L.n):null;}
  else{result.method='Exploraci\u00f3 num\u00e8rica';result.resultText='Sense conclusi\u00f3 anal\u00edtica en aquest motor';warnings.push('Una taula num\u00e8rica no demostra un l\u00edmit ni la seva inexist\u00e8ncia. No es converteixen nombres grans en infinit.');}
  result.rows=finite(t.v)?[.1,.01,.001,.0001,.00001].map(h=>[fmt(h),fmt(f(t.v-h)),fmt(f(t.v+h))]):[10,100,1000,10000,100000].map(h=>[fmt(Math.sign(t.v)*h),fmt(f(Math.sign(t.v)*h))]);result.headers=finite(t.v)?['h','f(a-h)','f(a+h)']:['x','f(x)'];result.plots=[{n:A,name:'f(x)',style:0}];result.window=finite(t.v)?[t.v-3,t.v+3]:[-6,6];
 }
 else if(mode==='study'){
  const [a,b]=interval(),d=diff(A,[]),d2=diff(d,[]),rr=numericRoots(f,a,b),cr=numericRoots(x=>evaluate(d,x),a,b),ir=numericRoots(x=>evaluate(d2,x),a,b);
  result.method='Derivades simb\u00f2liques + exploraci\u00f3';result.resultText='Estudi local a ['+fmt(a)+', '+fmt(b)+']';result.resultHTML=label("f'(x) = ",d);
  steps.push(step('Deriva i conserva el domini','Les restriccions de l\u2019expressi\u00f3 original prevalen sobre les simplificacions.',label("f'(x) = ",d)));steps.push(step('Calcula la segona derivada','Permet explorar la curvatura i contrastar possibles extrems.',label("f''(x) = ",d2)));
  const candidates=cr.roots.filter(x=>finite(f(x))).map(x=>{const h=Math.max(1e-5,(b-a)*1e-5),l=evaluate(d,x-h),r=evaluate(d,x+h);return {x,y:f(x),label:l>0&&r<0?'M\u00e0xim local candidat':l<0&&r>0?'M\u00ednim local candidat':'Punt estacionari candidat'};});
  result.rows=[...rr.roots.map(x=>['Zero candidat',fmt(x),fmt(f(x))]),...candidates.map(p=>[p.label,fmt(p.x),fmt(p.y)]),...ir.roots.filter(x=>finite(f(x))&&evaluate(d2,x-1e-4)*evaluate(d2,x+1e-4)<0).map(x=>['Inflexi\u00f3 candidata',fmt(x),fmt(f(x))])];result.headers=['Observaci\u00f3','x','f(x)'];result.points=candidates;result.plots=[{n:A,name:'f(x)',style:0},{n:d,name:"f'(x)",style:1}];result.window=[a,b];warnings.push('No \u00e9s un estudi global: el mostreig no demostra el domini complet, totes les as\u00edmptotes ni tots els punts singulars. Un zero de f\u2032 no \u00e9s autom\u00e0ticament un extrem.');
 }
 else err('Operaci\u00f3 no reconeguda.');
 result.resultHTML=result.resultHTML||M('<mtext>'+esc(result.resultText)+'</mtext>');
 if(!result.window)result.window=interval();result.expression=input;
 return result;
}
function solveInequality(A,B,cmp,r,res){
 if(!r||r.p.length>3||r.q.length>3)err('Inequacions locals: numerador i denominador polin\u00f2mics fins a grau 2 despr\u00e9s d\u2019agrupar.');
 if(r.q.every(c=>eqn(c,0)))err('Denominador nul.');const pr=roots2(r.p)||[],qr=roots2(r.q)||[];let extra=[];
 for(const z of res.restrictions){if(z.sign!=='\u2260')err('Aquesta inequaci\u00f3 nom\u00e9s admet restriccions racionals de denominador.');const p=poly(z.expr);if(!p||p.length>3)err('No es pot certificar el domini d\u2019aquesta inequaci\u00f3 amb les regles locals.');extra.push(...roots2(p));}
 const cuts=[...pr,...qr,...extra].sort((a,b)=>evaluate(a)-evaluate(b)).filter((a,i,s)=>!i||Math.abs(evaluate(a)-evaluate(s[i-1]))>1e-9),values=[-Infinity,...cuts.map(z=>evaluate(z)),Infinity];
 const valid=x=>{const av=evaluate(A,x),bv=evaluate(B,x),d=av-bv;if(!finite(av)||!finite(bv))return false;return cmp==='<='?d<=0:cmp==='>='?d>=0:cmp==='<'?d<0:d>0;};
 const boundary=x=>{if([...qr,...extra].some(z=>Math.abs(evaluate(z)-x)<1e-9))return false;if(pr.some(z=>Math.abs(evaluate(z)-x)<1e-9))return cmp==='<='||cmp==='>=';return valid(x);};
 const selected=[];for(let i=0;i<values.length-1;i++){const a=values[i],b=values[i+1],x=!finite(a)&&!finite(b)?0:!finite(a)?b-Math.max(1,Math.abs(b)+1):!finite(b)?a+Math.max(1,Math.abs(a)+1):(a+b)/2;res.rows.push([!finite(a)?'-inf':fmt(a),!finite(b)?'+inf':fmt(b),(evaluate(A,x)-evaluate(B,x))>0?'+':(evaluate(A,x)-evaluate(B,x))<0?'-':'0']);if(valid(x))selected.push({a,b,lc:finite(a)&&boundary(a),rc:finite(b)&&boundary(b)});}
 for(let i=0;i<cuts.length;i++){const x=values[i+1];if(boundary(x)&&!selected.some(t=>t.a===x&&t.lc||t.b===x&&t.rc))selected.push({a:x,b:x,lc:true,rc:true});}
 selected.sort((a,b)=>a.a-b.a);const merged=[];for(const t of selected){const q=merged.at(-1);if(q&&q.b===t.a&&(q.rc||t.lc)){q.b=t.b;q.rc=t.rc;}else merged.push({...t});}
 const nodeAt=x=>{const i=cuts.findIndex(n=>Math.abs(evaluate(n)-x)<1e-9);return i>=0?cuts[i]:N(x);};
 res.resultText=merged.length?merged.map(t=>t.a===t.b?'{'+show(nodeAt(t.a))+'}':(t.lc?'[':'(')+(finite(t.a)?show(nodeAt(t.a)):'-inf')+', '+(finite(t.b)?show(nodeAt(t.b)):'+inf')+(t.rc?']':')')).join(' U '):'Conjunt buit';res.resultHTML=M('<mi>x</mi><mo>&#x2208;</mo>'+(merged.length?merged.map(t=>t.a===t.b?'<mo>{</mo>'+body(nodeAt(t.a))+'<mo>}</mo>':'<mo>'+(t.lc?'[':'(')+'</mo>'+(finite(t.a)?body(nodeAt(t.a)):'<mo>-&#x221E;</mo>')+'<mo>,</mo>'+(finite(t.b)?body(nodeAt(t.b)):'<mo>+&#x221E;</mo>')+'<mo>'+(t.rc?']':')')+'</mo>').join('<mo>&#x222A;</mo>'):'<mo>&#x2205;</mo>'));
 res.steps.push(step('Passa-ho tot al primer membre','Estudia el signe de f-g, mantenint els punts exclosos del domini.',math(div(fromPoly(r.p),fromPoly(r.q)))));
 res.steps.push(step('Divideix la recta en intervals','Els zeros del numerador i del denominador separen intervals de signe constant. Prova un valor interior a cada interval.',null));res.steps.push(step('Inclou o exclou les fronteres','Els zeros s\u2019inclouen amb \u2264 o \u2265 si estan al domini. Els punts on un denominador s\u2019anul\u00b7la s\u2019exclouen sempre.',null));res.headers=['Des de','Fins a','Signe de f-g'];res.method='Taula de signes racional';res.intervals=merged;res.window=[-6,6];res.expression=show(A)+cmp+show(B);return res;
}
function linear(n,vars){
 const blank=()=>Array(vars.length+1).fill(Z);
 if(n.k==='num'){const a=blank();a[vars.length]=n;return a;}
 if(n.k==='sym'&&vars.includes(n.s)){const a=blank();a[vars.indexOf(n.s)]=ONE;return a;}
 if(n.k!=='op')return null;const a=linear(n.a,vars),b=linear(n.b,vars);if(!a||!b)return null;const ca=a.slice(0,-1).every(v=>eqn(v,0)),cb=b.slice(0,-1).every(v=>eqn(v,0));
 if(n.op==='+'||n.op==='-')return a.map((v,i)=>n.op==='+'?qa(v,b[i]):qs(v,b[i]));
 if(n.op==='*'&&(ca||cb))return ca?b.map(v=>qm(v,a.at(-1))):a.map(v=>qm(v,b.at(-1)));
 if(n.op==='/'&&cb&&!eqn(b.at(-1),0))return a.map(v=>qd(v,b.at(-1)));return null;
}
function matrixHTML(a){return M('<mo>[</mo><mtable>'+a.map(r=>'<mtr>'+r.map(t=>'<mtd>'+body(t)+'</mtd>').join('')+'</mtr>').join('')+'</mtable><mo>]</mo>');}
function solveSystem(input,res){
 const eqs=input.split(/[;\n]+/).map(s=>s.trim()).filter(Boolean);if(eqs.length<2||eqs.length>4)err('Escriu de 2 a 4 equacions lineals, separades per punt i coma.');const trees=eqs.map(s=>{const p=s.split('=');if(p.length!==2)err('Cada equaci\u00f3 necessita un signe =.');return [parse(p[0],['x','y','z']),parse(p[1],['x','y','z'])];});
 const vars=['x','y','z'].filter(v=>trees.some(t=>contains(t[0],v)||contains(t[1],v)));if(!vars.length)err('Falten inc\u00f2gnites.');
 const rows=trees.map(t=>{const a=linear(sub(t[0],t[1]),vars);if(!a)err('Nom\u00e9s sistemes lineals amb coeficients num\u00e8rics.');return [...a.slice(0,-1),qn(a.at(-1))];});res.inputHTML=matrixHTML(rows);res.steps.push(step('Escriu la matriu ampliada','Ordre de les inc\u00f2gnites: '+vars.join(', ')+'. L\u2019\u00faltima columna cont\u00e9 els termes independents.',matrixHTML(rows)));
 let Mx=rows.map(r=>r.slice()),pivot=0,piv=[];
 for(let j=0;j<vars.length&&pivot<Mx.length;j++){
  let p=Mx.findIndex((r,i)=>i>=pivot&&!eqn(r[j],0));if(p<0)continue;
  if(p!==pivot){[Mx[p],Mx[pivot]]=[Mx[pivot],Mx[p]];res.steps.push(step('Intercanvia files','F'+(p+1)+' \u2194 F'+(pivot+1),matrixHTML(Mx)));}
  const c=Mx[pivot][j];if(!eqn(c,1)){Mx[pivot]=Mx[pivot].map(v=>qd(v,c));res.steps.push(step('Normalitza el pivot','Divideix F'+(pivot+1)+' per '+show(c)+'.',matrixHTML(Mx)));}
  for(let i=0;i<Mx.length;i++){if(i===pivot||eqn(Mx[i][j],0))continue;const k=Mx[i][j];Mx[i]=Mx[i].map((v,l)=>qs(v,qm(k,Mx[pivot][l])));res.steps.push(step('Elimina una inc\u00f2gnita','F'+(i+1)+' \u2190 F'+(i+1)+' - ('+show(k)+') F'+(pivot+1),matrixHTML(Mx)));}
  piv.push(j);pivot++;
 }
 const bad=Mx.some(r=>r.slice(0,-1).every(v=>eqn(v,0))&&!eqn(r.at(-1),0));
 if(bad){res.resultText='Sistema incompatible: cap soluci\u00f3';res.resultHTML=M('<mtext>SI: cap soluci\u00f3</mtext>');}
 else if(piv.length===vars.length){res.resultText=vars.map((v,j)=>v+' = '+show(Mx[piv.indexOf(j)].at(-1))).join('; ');res.resultHTML=M(vars.map((v,j)=>'<mi>'+v+'</mi><mo>=</mo>'+body(Mx[piv.indexOf(j)].at(-1))).join('<mo>;</mo>'));res.method='Gauss-Jordan exacte';}
 else{const free=vars.map((_,j)=>j).filter(j=>!piv.includes(j)),params=free.map((j,i)=>S('t'+(i+1))),sol=vars.map((v,j)=>{if(free.includes(j))return params[free.indexOf(j)];const row=Mx[piv.indexOf(j)];let n=row.at(-1);for(let k=0;k<free.length;k++)n=sub(n,mul(row[free[k]],params[k]));return n;});res.resultText='Infinites solucions: '+vars.map((v,j)=>v+' = '+show(sol[j])).join('; ');res.resultHTML=M(vars.map((v,j)=>'<mi>'+v+'</mi><mo>=</mo>'+body(sol[j])).join('<mo>;</mo>'));res.warnings.push('Els par\u00e0metres '+params.map(z=>show(z)).join(', ')+' poden prendre qualsevol valor real.');}
 res.steps.push(step('Classifica el sistema','rang(A) = '+piv.length+'; '+(bad?'rang(A|b) > rang(A).':'rang(A|b) = rang(A).')+' Compara el rang amb les '+vars.length+' inc\u00f2gnites.',null));res.expression=input;return res;
}
const api={parse,normalize,show,math,body,M,esc,simp,simple,evaluate,diff,primitive,restrictions,solve,N,O,F,S,X,poly,rational,fromPoly,realPolynomialRoots,integrateNumeric,numericRoots,fmt,constant,solveSystem,derivativeCheck};
if(typeof module==='object'&&module.exports)module.exports=api;root.MatesEngine=api;
})(typeof self!=='undefined'?self:globalThis);
