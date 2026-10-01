// Motor simbòlic original i càlcul numèric amb límits de seguretat.
function pp(s){const o={};s.replace(/\s/g,'').replace(/-/g,'+-').split('+').filter(Boolean).forEach(t=>{const m=t.match(/^(-?)(\d*\.?\d*)\*?(x)?(?:\^(\d+))?$/);if(!m)throw'No entenc el terme "'+t+'"';let c=m[2]===''?(m[3]?1:0):+m[2];if(m[1])c=-c;const e=m[3]?(m[4]?+m[4]:1):0;o[e]=(o[e]||0)+c});return o}
const g=(a,b)=>b?g(b,a%b):Math.abs(a),fr=(a,b)=>{if(Number.isInteger(a)){const d=g(a,b)||1;a/=d;b/=d;if(b<0){a=-a;b=-b}return b==1?''+a:a+'/'+b}return ''+Math.round(a/b*1e4)/1e4};
const pf=(o,fn=(c,e)=>c)=>{const k=Object.keys(o).map(Number).filter(e=>o[e]!=0).sort((a,b)=>b-a);return k.length?k.map((e,i)=>{let c=String(fn(o[e],e));let s=(c[0]=='-'?'−':(i?'+':''))+(i&&c[0]!='-'?' ':'')+(c[0]=='-'?' '+c.slice(1):c);return(i?' ':'')+s.trim()+(e==0?'':'·x'+(e==1?'':'^'+e))}).join(' '):'0'};
const ev=(o,x)=>Object.keys(o).reduce((s,e)=>s+o[e]*x**e,0),R=v=>Math.round(v*1e6)/1e6;

const NM=v=>({t:'n',v}),XX={t:'x'},isN=(a,v)=>a.t=='n'&&(v===undefined||a.v==v);
const ad=(a,b)=>isN(a)&&isN(b)?NM(a.v+b.v):isN(a,0)?b:isN(b,0)?a:{t:'o',o:'+',a,b};
const sb=(a,b)=>isN(a)&&isN(b)?NM(a.v-b.v):isN(b,0)?a:{t:'o',o:'-',a,b};
const ml=(a,b)=>isN(a)&&isN(b)?NM(a.v*b.v):isN(a,0)||isN(b,0)?NM(0):isN(a,1)?b:isN(b,1)?a:isN(b)?ml(b,a):{t:'o',o:'*',a,b};
const dv=(a,b)=>isN(a,0)?NM(0):isN(b,1)?a:{t:'o',o:'/',a,b};
const pw=(a,b)=>isN(b,1)?a:isN(b,0)?NM(1):{t:'o',o:'^',a,b};
const fnn=(f,a)=>f=='ln'&&isN(a,Math.E)?NM(1):{t:'f',f,a};
function parse(s){if(typeof s!=='string'||s.length>500)throw 'Expressió massa llarga (màxim 500 caràcters)';let depth=0;for(const ch of s){if(ch==='('&&++depth>32)throw 'Massa parèntesis imbricats';if(ch===')')depth--}let i=0;s=s.replace(/\s/g,'').toLowerCase().replace(/,/g,'.').replace(/·|×/g,'*').replace(/−/g,'-').replace(/π/g,'pi');
const pk=()=>s[i],E=()=>{let a=T_();while(pk()=='+'||pk()=='-'){const o=s[i++],b=T_();a=o=='+'?ad(a,b):sb(a,b)}return a},
T_=()=>{let a=U();for(;;){const c=pk();if(c=='*'){i++;a={t:'o',o:'*',a,b:U()}}else if(c=='/'){i++;a={t:'o',o:'/',a,b:U()}}else if(c&&/[\d.(a-z]/.test(c))a={t:'o',o:'*',a,b:U()};else return a}},
U=()=>{if(pk()=='-'){i++;return ml(NM(-1),U())}if(pk()=='+'){i++;return U()}return P()},
P=()=>{const a=A();if(pk()=='^'){i++;return {t:'o',o:'^',a,b:U()}}return a},
A=()=>{const c=pk();if(c=='('){i++;const e=E();if(pk()!=')')throw'Falta un parèntesi';i++;return e}
if(/[\d.]/.test(c)){const m=s.slice(i).match(/^\d*\.?\d+/);if(!m)throw'Número no vàlid';i+=m[0].length;return NM(+m[0])}
const m=s.slice(i).match(/^(asin|acos|atan|arctan|sin|cos|tan|ln|log|sqrt|exp|abs)/);if(m){i+=m[0].length;let n=m[0]=='log'?'ln':m[0]=='arctan'?'atan':m[0];const a=pk()=='('?A():P();return fnn(n,a)}
if(s.startsWith('pi',i)){i+=2;return NM(Math.PI)}if(c=='x'){i++;return XX}if(c=='e'){i++;return NM(Math.E)}throw'No entenc "'+(c||'final')+'" a la funció'};
const r=E();if(i<s.length)throw'No entenc "'+s.slice(i)+'"';return r}
const FN={sin:Math.sin,cos:Math.cos,tan:Math.tan,ln:Math.log,sqrt:Math.sqrt,exp:Math.exp,abs:Math.abs,asin:Math.asin,acos:Math.acos,atan:Math.atan};
const EV=(n,x)=>{if(n.t=='n')return n.v;if(n.t=='x')return x;if(n.t=='f')return FN[n.f](EV(n.a,x));const a=EV(n.a,x),b=EV(n.b,x);return n.o=='+'?a+b:n.o=='-'?a-b:n.o=='*'?a*b:n.o=='/'?a/b:Math.pow(a,b)};
function DD(n){if(n.t=='n')return NM(0);if(n.t=='x')return NM(1);const{a,b,o}=n,da=DD(a);if(n.t=='f'){const q2=pw(a,NM(2));switch(n.f){case'sin':return ml(fnn('cos',a),da);case'cos':return ml(ml(NM(-1),fnn('sin',a)),da);case'tan':return dv(da,pw(fnn('cos',a),NM(2)));case'ln':return dv(da,a);case'exp':return ml(n,da);case'sqrt':return dv(da,ml(NM(2),n));case'abs':return ml(dv(a,n),da);case'atan':return dv(da,ad(NM(1),q2));case'asin':return dv(da,fnn('sqrt',sb(NM(1),q2)));default:return ml(NM(-1),dv(da,fnn('sqrt',sb(NM(1),q2))))}}
const db=DD(b);if(o=='+')return ad(da,db);if(o=='-')return sb(da,db);if(o=='*')return ad(ml(da,b),ml(a,db));if(o=='/')return dv(sb(ml(da,b),ml(a,db)),pw(b,NM(2)));if(isN(b,0))return NM(0);if(isN(b))return ml(ml(b,pw(a,NM(b.v-1))),da);return ml(n,ad(ml(db,fnn('ln',a)),dv(ml(b,da),a)))}
function PS(n,p=0){if(n.t=='n'){const v=n.v,s=v==Math.E?'e':v==Math.PI?'π':''+R(v);return v<0&&p>0?'('+s+')':s}if(n.t=='x')return'x';if(n.t=='f')return n.f+'('+PS(n.a)+')';const P=({'+':1,'-':1,'*':2,'/':2,'^':3})[n.o];let s;if(n.o=='*'&&isN(n.a)&&n.a.v<0)s='-'+PS(ml(NM(-n.a.v),n.b),2);else s=PS(n.a,P+(n.o=='^'?1:0))+(n.o=='+'||n.o=='-'?' '+n.o+' ':n.o=='*'?'·':n.o)+PS(n.b,P+(n.o=='-'||n.o=='/'?1:0));return(P<p?'('+s+')':s).replace(/ \+ -/g,' - ')}

// Bounded numerical routines. A sample cannot prove existence, uniqueness or continuity.
function validInterval(a,b){
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)throw new Error('Cal un interval finit amb a < b.');
 if(Math.abs(a)>1e7||Math.abs(b)>1e7||b-a<1e-9)throw new Error('Interval massa gran o massa petit per a aquesta eina num\u00e8rica.');
}
function roots(h,a,b){
 validInterval(a,b);
 const out=[],n=2400,st=(b-a)/n;
 const add=z=>{if(Number.isFinite(z)&&Math.abs(h(z))<1e-7&&!out.some(t=>Math.abs(t-z)<Math.max(1e-7,st*1e-3)))out.push(z);};
 const xs=[],ys=[];
 for(let i=0;i<=n;i++){const x=a+i*st;xs.push(x);ys.push(h(x));}
 if(ys.every(y=>y===0))return []; // Do not print thousands of roots for the zero function.
 for(let i=0;i<=n;i++){
  const y=ys[i]; if(y===0)add(xs[i]);
  if(i>0&&Number.isFinite(y)&&Number.isFinite(ys[i-1])&&y*ys[i-1]<0){
   let l=xs[i-1],u=xs[i],fl=ys[i-1];
   for(let k=0;k<55;k++){const mid=(l+u)/2,fm=h(mid);if(!Number.isFinite(fm))break;if(fl*fm<=0)u=mid;else{l=mid;fl=fm;}}
   add((l+u)/2);
  }
  // An even-multiplicity root may have no sign change. Refine local minima of |f|.
  if(i>0&&i<n&&Number.isFinite(y)&&Math.abs(y)<Math.abs(ys[i-1])&&Math.abs(y)<Math.abs(ys[i+1])){
   let l=xs[i-1],u=xs[i+1];
   for(let k=0;k<45;k++){const p=l+(u-l)/3,q=u-(u-l)/3;if(Math.abs(h(p))<Math.abs(h(q)))u=q;else l=p;}
   const z=(l+u)/2;
   if(Math.abs(h(z))<1e-8*Math.max(1,Math.abs(ys[i-1]),Math.abs(ys[i+1])))add(z);
  }
  if(out.length>160)throw new Error('Massa arrels detectades. Redueix l\u2019interval.');
 }
 return out.sort((x,y)=>x-y);
}
function SI(f,a,b,n=1000){
 if(!Number.isFinite(a)||!Number.isFinite(b))throw new Error('Nom\u00e9s integrals pr\u00f2pies amb l\u00edmits finits.');
 if(a===b)return 0;
 const sign=a<b?1:-1,lo=Math.min(a,b),hi=Math.max(a,b);
 validInterval(lo,hi);
 const at=x=>{const y=f(x);if(!Number.isFinite(y))throw new Error('Funci\u00f3 no definida o no finita a l\u2019interval; no es resolen integrals impr\u00f2pies.');return y;};
 const sim=m=>{const h=(hi-lo)/m;let sum=at(lo)+at(hi);for(let i=1;i<m;i++)sum+=at(lo+i*h)*(i%2?4:2);return sum*h/3;};
 let prev=sim(n);
 for(let k=0;k<4;k++){n*=2;const next=sim(n);if(!Number.isFinite(next))throw new Error('Desbordament num\u00e8ric.');if(Math.abs(next-prev)<=1e-7*(1+Math.abs(next)))return sign*next;prev=next;}
 throw new Error('No s\u2019ha estabilitzat la integral num\u00e8rica; revisa les discontinu\u00eftats o divideix l\u2019interval.');
}
