'use strict';
// Seven modes from the supplied page. Numerical outputs are explicitly exploratory.
const NUM_NOTE='\n\nResultat num\u00e8ric de suport: el mostreig no demostra el domini, la continu\u00eftat ni que s\u2019hagin trobat totes les arrels. Comprova les hip\u00f2tesis.';
function numericValue(text){
 const s=text.trim().toLowerCase();if(!s)return NaN;
 if(['inf','+inf','infinity','+infinity'].includes(s))return Infinity;
 if(['-inf','-infinity'].includes(s))return -Infinity;
 if(s.includes('x'))throw new Error('Els l\u00edmits i els punts han de ser constants, no expressions amb x.');
 const val=EV(parse(s),0);if(!Number.isFinite(val))throw new Error('Constant no definida; per a infinit escriu inf o -inf.');return val;
}
function criticalExtra(node,f,a,b){
 const out=[];
 function visit(n){
  if(n.t==='f'&&n.f==='abs')for(const z of roots(x=>EV(n.a,x),a,b))if(Number.isFinite(f(z)))out.push(z);
  if(n.a)visit(n.a);if(n.b)visit(n.b);
 }
 visit(node);return out;
}
function showSample(v){return Number.isFinite(v)?String(R(v)):'no finit / fora del domini';}
function RS(el,m0){
 const MD={der:'Derivar + tangent',int:'Integral definida',area:'\u00c0rea entre dues corbes',eq:'Resoldre f(x)=g(x)',lim:'Explorar un l\u00edmit',est:'Exploraci\u00f3 de la funci\u00f3',opt:'M\u00e0xims i m\u00ednims (candidats)'};
 const html='<div class="r"><select class="md" aria-label="Tipus de c\u00e0lcul">'+Object.keys(MD).map(k=>`<option value="${k}">${MD[k]}</option>`).join('')+'</select><select class="ex" aria-label="Exemple"><option value="">Exemples del fitxer original\u2026</option>'+EX.map((x,i)=>`<option value="${i}">${x[0]}</option>`).join('')+'</select></div>'+
 '<label class="r"><span>f(x)=</span><input class="w" style="flex:1" aria-label="Funci\u00f3 f"></label><label class="r"><span>g(x)=</span><input class="w" style="flex:1" aria-label="Funci\u00f3 g" placeholder="Nom\u00e9s \u00e0rea i equacions"></label>'+
 '<div class="r"><label>a <input class="n" style="width:85px" aria-label="Punt o l\u00edmit a"></label><label>b <input class="n" style="width:85px" aria-label="L\u00edmit b"></label><span class="mu">a: punt o l\u00edmit inferior \u00b7 b: l\u00edmit superior</span></div>'+
 '<p class="mu">Escriu x^2, 3x, sin(x), cos(x), tan(x), exp(x) o e^x, ln(x), sqrt(x), abs(x), pi. Angles en radians. Infinit (inf) nom\u00e9s en l\u00edmits. Fes servir par\u00e8ntesis per als denominadors.</p><canvas width="800" height="440"></canvas>';
 mk(el,html,e=>{
  const md=e.querySelector('.md').value;
  const A=parse(q(e,0)),f=x=>EV(A,x),sg=q(e,1).trim(),B=sg?parse(sg):null,g2=B?x=>EV(B,x):null;
  let a=numericValue(q(e,2)),b=numericValue(q(e,3)),o='f(x) = '+PS(A)+'\n',cfg={F:[{f,n:'f'}],P:[]};
  if(md==='der'){
   const D=DD(A),D2=DD(D),df=x=>EV(D,x),t=Number.isNaN(a)?0:a;
   if(!Number.isFinite(t)||Math.abs(t)>1e7)throw new Error('El punt ha de ser finit i entre -10000000 i 10000000.');
   if(!Number.isFinite(f(t))||!Number.isFinite(df(t)))throw new Error('La funci\u00f3 o la derivada no \u00e9s finita en aquest punt. No es pot donar una tangent ordin\u00e0ria.');
   o+=`f'(x) = ${PS(D)}\nf''(x) = ${PS(D2)}\n\nEn x=${R(t)}: f=${R(f(t))}; f'=${R(df(t))}; f''=${showSample(EV(D2,t))}\nTangent: y = ${R(df(t))}\u00b7(x \u2212 ${R(t)}) + ${R(f(t))}\nNormal: `+(df(t)===0?`x = ${R(t)}`:`y = ${R(-1/df(t))}\u00b7(x \u2212 ${R(t)}) + ${R(f(t))}`);
   o+='\n\nDerivaci\u00f3 simb\u00f2lica elemental. Les expressions s\u2019apliquen on la funci\u00f3 original \u00e9s definida i derivable; revisa punts frontera i valors absoluts.';
   cfg.x0=t-4;cfg.x1=t+4;cfg.F.push({f:df,n:"f'"},{f:x=>df(t)*(x-t)+f(t),n:'tangent'});cfg.P=[[t,f(t),'P']];
  }else if(md==='int'){
   if(!Number.isFinite(a)||!Number.isFinite(b))throw new Error('Calen dos l\u00edmits finits. No es resolen integrals impr\u00f2pies.');
   const lo=Math.min(a,b),hi=Math.max(a,b);if(a===b)throw new Error('Per representar l\u2019interval cal a \u2260 b. Amb a=b la integral \u00e9s 0 quan est\u00e0 definida.');
   validInterval(lo,hi);const value=SI(f,a,b),area=SI(x=>Math.abs(f(x)),lo,hi),rr=roots(f,lo,hi);
   try{
    const p=pp(q(e,0)),P={};Object.keys(p).forEach(k=>P[+k+1]=p[k]/(+k+1));
    o+=`\nPrimitiva polin\u00f2mica: F(x) = ${pf(P,c=>String(R(c)))} + C\nBarrow: F(${R(b)}) \u2212 F(${R(a)}) = ${R(ev(P,b)-ev(P,a))}\n`;
   }catch{o+='\nLa primitiva simb\u00f2lica nom\u00e9s est\u00e0 implementada per a polinomis de pot\u00e8ncies enteres no negatives.\n';}
   o+=`\nIntegral amb signe de ${R(a)} a ${R(b)} \u2248 ${R(value)}\n\u00c0rea geom\u00e8trica de ${R(lo)} a ${R(hi)} \u2248 ${R(area)}\nZeros detectats: ${rr.map(R).join(', ')||'cap en el mostreig'}`+NUM_NOTE;
   cfg.x0=lo-.2*(hi-lo);cfg.x1=hi+.2*(hi-lo);cfg.sh={f,a:lo,b:hi};
  }else if(md==='area'){
   if(!g2)throw new Error('Escriu tamb\u00e9 g(x).');const h=x=>f(x)-g2(x);
   if(Number.isNaN(a)&&Number.isNaN(b)){
    const rr=roots(h,-20,20);if(rr.length<2)throw new Error('No s\u2019han trobat dos talls a [-20,20]. Indica els l\u00edmits a i b.');
    a=rr[0];b=rr[rr.length-1];o+='\nL\u00edmits autom\u00e0tics: primer i darrer tall detectats a [-20,20]. No es garanteix que siguin tots els talls.\n';
   }else if(Number.isNaN(a)||Number.isNaN(b))throw new Error('Indica tots dos l\u00edmits o deixa tots dos buits.');
   validInterval(a,b);const pts=[a,...roots(h,a,b).filter(z=>z>a+1e-6&&z<b-1e-6),b];let total=0;
   o+='g(x) = '+PS(B)+'\n\n\u00c0rea per trams (l\u00edmits i talls detectats):';
   for(let i=0;i<pts.length-1;i++){const v=SI(x=>Math.abs(h(x)),pts[i],pts[i+1]);total+=v;o+=`\n [${R(pts[i])}, ${R(pts[i+1])}] \u2248 ${R(v)}`;}
   o+=`\n\n\u00c0REA TOTAL = \u222b|f\u2212g| \u2248 ${R(total)}`+NUM_NOTE;
   cfg.x0=a-.25*(b-a);cfg.x1=b+.25*(b-a);cfg.F.push({f:g2,n:'g'});cfg.sh={f,g:g2,a,b};
  }else if(md==='eq'){
   if(Number.isNaN(a))a=-10;if(Number.isNaN(b))b=10;validInterval(a,b);
   const h=g2?x=>f(x)-g2(x):f,rr=roots(h,a,b);
   if(g2)o+='g(x) = '+PS(B)+'\n';
   const appearsZero=Array.from({length:31},(_,i)=>h(a+(b-a)*(i+.2)/31)).every(v=>v===0);
   o+=`\nSolucions detectades a [${R(a)}, ${R(b)}]:\n`+(appearsZero?'La difer\u00e8ncia \u00e9s nul\u00b7la en tots els punts mostrejats. Comprova si \u00e9s una identitat en el domini com\u00fa.':rr.map(z=>` x \u2248 ${R(z)}; residu \u2248 ${R(h(z))}`).join('\n')||'No se n\u2019han detectat; aix\u00f2 no prova que no n\u2019hi hagi.')+NUM_NOTE;
   cfg.x0=a;cfg.x1=b;cfg.F.push({f:g2||(()=>0),n:g2?'g':'y=0'});cfg.P=rr.filter(z=>Number.isFinite(f(z))).map(z=>[z,f(z),String(R(z))]);
  }else if(md==='lim'){
   if(Number.isNaN(a))throw new Error('Indica el punt a (pot ser inf o -inf).');
   if(!Number.isFinite(a)){
    const sign=a>0?1:-1;o+=`\nx \u2192 ${a>0?'+inf':'-inf'}:\n`;
    for(const h of [1e2,1e3,1e4,1e5,1e6])o+=` f(${sign*h}) = ${showSample(f(sign*h))}\n`;
    cfg.x0=-20;cfg.x1=20;
   }else{
    if(Math.abs(a)>1e7)throw new Error('Punt massa gran per a l\u2019exploraci\u00f3 num\u00e8rica.');
    o+=`\nx \u2192 ${R(a)}\nh          f(a\u2212h)          f(a+h)\n`;
    const scale=Math.max(1,Math.abs(a));
    for(const h0 of [1e-1,1e-2,1e-3,1e-4,1e-5,1e-6]){const h=h0*scale;o+=`${h.toExponential(1)}    ${showSample(f(a-h))}    ${showSample(f(a+h))}\n`;}
    o+=`\nf(a) = ${showSample(f(a))}\n`;
    cfg.x0=a-4;cfg.x1=a+4;if(Number.isFinite(f(a)))cfg.P=[[a,f(a),'f(a)']];
   }
   o+='\nTaula d\u2019aproximaci\u00f3: no s\u2019afirma l\u2019exist\u00e8ncia del l\u00edmit, una as\u00edmptota ni la continu\u00eftat a partir de mostres finites. Justifica-ho algebraicament.';
  }else{
   if(Number.isNaN(a))a=-6;if(Number.isNaN(b))b=6;validInterval(a,b);
   const D=DD(A),D2=DD(D),df=x=>EV(D,x),ddf=x=>EV(D2,x),rr=roots(df,a,b).filter(x=>Number.isFinite(f(x))),extra=criticalExtra(A,f,a,b);
   cfg.x0=a;cfg.x1=b;o+=`f'(x) = ${PS(D)}\nf''(x) = ${PS(D2)}\n`;
   if(md==='opt'){
    const pts=[...new Set([a,b,...rr,...extra])].filter(x=>Number.isFinite(f(x))),vals=pts.map(x=>[x,f(x)]).sort((p,q)=>q[1]-p[1]);
    if(!vals.length)throw new Error('No hi ha candidats amb valor finit.');
    o+='\nCandidats: extrems de l\u2019interval, zeros detectats de f\u2032 i v\u00e8rtexs de valor absolut:\n'+pts.map(x=>` x=${R(x)} \u2192 f=${R(f(x))}`).join('\n');
    o+=`\n\nValor m\u00e9s alt entre els candidats: f(${R(vals[0][0])}) = ${R(vals[0][1])}\nValor m\u00e9s baix entre els candidats: f(${R(vals.at(-1)[0])}) = ${R(vals.at(-1)[1])}\n\nS\u00f3n extrems absoluts nom\u00e9s si el domini, la continu\u00eftat i tots els candidats s\u2019han comprovat. L\u2019eina no descarta singularitats ni tots els punts no derivables.`+NUM_NOTE;
    cfg.P=[[...vals[0],'alt'],[...vals.at(-1),'baix']];
   }else{
    const zero=roots(f,a,b),infl=roots(ddf,a,b).filter(t=>Number.isFinite(f(t))&&ddf(t-1e-4)*ddf(t+1e-4)<0);
    o+='\nDomini i as\u00edmptotes: no determinats simb\u00f2licament. Una finestra finita no estableix el domini global.\n';
    o+=`Tall OY: ${Number.isFinite(f(0))?'(0, '+R(f(0))+')':'f(0) no \u00e9s definida'}\nZeros detectats: ${zero.map(R).join(', ')||'cap'}\n\nPunts estacionaris detectats:\n`;
    o+=rr.map(t=>{const v=ddf(t);return ` x\u2248${R(t)}, f\u2248${R(f(t))}: ${v>1e-8?'candidat a m\u00ednim':v< -1e-8?'candidat a m\u00e0xim':'cal estudiar el signe de f\u2032'}`;}).join('\n')||'cap';
    o+='\n\nCandidats a inflexi\u00f3 (canvi de signe mostrejat de f\u2033):\n'+(infl.map(t=>` x\u2248${R(t)}, f\u2248${R(f(t))}`).join('\n')||'cap');
    o+='\n\nPunts de comprovaci\u00f3 de signe (no una prova de monotonia a tot el tram):\n';
    const cuts=[a,...new Set([...rr,...extra,...infl].filter(t=>t>a&&t<b).sort((x,y)=>x-y)),b];
    for(let i=0;i<cuts.length-1;i++){const mid=(cuts[i]+cuts[i+1])/2;o+=` x=${R(mid)}: f\u2032=${showSample(df(mid))}, f\u2033=${showSample(ddf(mid))}\n`;}
    o+=NUM_NOTE;cfg.P=[...zero.filter(z=>Number.isFinite(f(z))).map(z=>[z,0,'']),...rr.map(z=>[z,f(z),'f\u2032=0']),...infl.map(z=>[z,f(z),'infl?'])];
   }
  }
  plot(e.querySelector('canvas'),cfg);return o;
 },'Resoldre i dibuixar');
 const set=x=>{el.querySelector('.md').value=x[1];const I=el.querySelectorAll('input');I[0].value=x[2];I[1].value=x[3];I[2].value=x[4];I[3].value=x[5];};
 el.querySelector('.ex').onchange=ev=>{if(ev.target.value==='')return;const i=Number(ev.target.value);if(Number.isInteger(i)&&EX[i]){set(EX[i]);el.querySelector('.b').click();}};
 set(EX.find(x=>x[1]===m0)||EX[0]);el.querySelector('.b').click();
}
TL.res=el=>RS(el,'est');TL.der=el=>RS(el,'der');TL.int=el=>RS(el,'int');TL.lim=el=>RS(el,'lim');TL.graf=el=>RS(el,'est');
