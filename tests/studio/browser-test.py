"""UI checks in Chromium with local code injected into about:blank.
Navigation is blocked by administrator in this execution environment, including
localhost. A real Blob Web Worker runs the same engine code; storage is a scoped
in-memory test double. This does NOT validate installed service workers or physical
PWA installation. Those are covered by static and lifecycle simulation tests only.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import base64,json,time
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
results=[]
def check(name,condition,detail=''):
    results.append({'name':name,'pass':bool(condition),'detail':detail})
    if not condition: print('FAIL',name,detail)

def bootstrap(browser,width=1440,height=1000,store=None):
    ctx=browser.new_context(viewport={'width':width,'height':height},accept_downloads=True)
    page=ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    soup=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
    for x in soup.select('script, link, meta[http-equiv]'):x.decompose()
    for img in soup.find_all('img'):
        img['src']='data:image/png;base64,'+base64.b64encode((ROOT/img['src'].removeprefix('./')).read_bytes()).decode()
    page.set_content(str(soup))
    page.add_style_tag(content=(ROOT/'studio/styles.css').read_text())
    engine=(ROOT/'studio/engine.js').read_text()
    worker=(ROOT/'studio/worker.js').read_text().replace("importScripts('./engine.js');",'')
    page.evaluate('''data=>{
      Object.defineProperty(document,'baseURI',{get:()=> 'https://pwa-test.invalid/project/index.html'});
      const m=new Map(Object.entries(data.store||{}));window.testStore=m;
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});
      const Original=window.Worker;const code=data.code;
      window.Worker=class extends Original{constructor(url){super(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));}};
    }''',{'store':store or {},'code':engine+'\n'+worker})
    for f in ['config.js','engine.js','graph.js','app.js','pwa.js']:
        page.add_script_tag(content=(ROOT/'studio'/f).read_text())
    page.wait_for_function('window.StudioApp && window.StudioApp.result !== null',timeout=15000)
    return ctx,page,errors

def solve(page,q):
    page.evaluate('q=>window.StudioApp.load(q)',q)
    page.wait_for_function('window.StudioApp.result!==null || !document.getElementById("error-card").hidden',timeout=14000)
    return page.evaluate('window.StudioApp.result')

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    context,page,errors=bootstrap(browser)
    check('Initial worker result',page.evaluate('StudioApp.result.solutions.join()')=='2,3')
    check('Native MathML displayed',page.locator('#answer math').count()>0)
    check('Sidebar operations',page.locator('[data-mode]').count()==12)
    check('Math preview nonempty',page.locator('#math-preview math').count()==1)
    examples=page.evaluate('StudioConfig.examples')
    for q in examples:
        r=solve(page,q)
        check('UI example: '+q['label'],r is not None,page.locator('#error-card').inner_text() if r is None else '')
    r=solve(page,{'mode':'derivative','expression':'ln(x^2+1)/x','a':'1'})
    check('Derivative result uses MathML',page.locator('#answer math').count()==1)
    check('Steps rendered',page.locator('.step').count()==len(r['steps']))
    n=page.locator('.step[open]').count();page.locator('#next-step').click()
    check('Reveal next step',page.locator('.step[open]').count()==n+1)
    page.locator('#expand-steps').click();check('Expand all steps',page.locator('.step:not([open])').count()==0)
    page.locator('#expand-steps').click();check('Collapse all steps',page.locator('.step[open]').count()==0)
    r=solve(page,{'mode':'derivative','expression':'x*exp(x)','a':'1'})
    page.locator('#save-result').click();check('Notebook saved',page.locator('#saved-count').inner_text()=='1')
    page.locator('#save-result').click();check('Duplicate not saved',page.locator('#saved-count').inner_text()=='1')
    page.locator('#notebook-open').click();check('Notebook opens',page.locator('#notebook-dialog').evaluate('(d)=>d.open'))
    page.locator('.notebook-item textarea').fill('Producte per explicar a la pissarra')
    check('Note persisted',page.evaluate('StudioApp.saved[0].note')=='Producte per explicar a la pissarra')
    with page.expect_download() as d: page.locator('#export-data').click()
    data=json.loads(Path(d.value.path()).read_text());check('JSON export',data['app']=='mates-estudi' and len(data['saved'])==1)
    page.locator('#notebook-search').fill('notpresent');check('Notebook search',page.locator('.notebook-item').count()==0)
    page.locator('#notebook-search').fill('');page.locator('#history-tab').click();check('History capped',len(page.evaluate('StudioApp.history'))<=30)
    page.locator('[data-close="notebook-dialog"]').click()
    # Copy: permission varies in opaque origin. Verify generated plain text with a stub.
    page.evaluate('window.copied="";Object.defineProperty(navigator,"clipboard",{value:{writeText:async t=>{window.copied=t}}})')
    page.locator('#copy-result').click();check('Copy result content',"f'(x)" in page.evaluate('window.copied'))
    # Print API is stubbed: test real before/after events and print-specific layout.
    page.evaluate('window.print=()=>{window.printCalled=true;window.dispatchEvent(new Event("beforeprint"));}')
    page.locator('#print-result').click();check('Print reveals steps',page.locator('.step:not([open])').count()==0)
    page.emulate_media(media='print');check('Print hides controls',not page.locator('.input-card').is_visible());page.emulate_media(media='screen');page.evaluate('window.dispatchEvent(new Event("afterprint"))')
    # Keyboard selection wrapping, undo, backspace.
    page.locator('#expression').fill('x+1');page.locator('#expression').evaluate('(e)=>{e.focus();e.setSelectionRange(0,3)}')
    page.locator('#key-grid button').filter(has_text='\u221a').click()
    check('Keyboard wraps selection',page.locator('#expression').input_value()=='sqrt(x+1)')
    page.locator('#key-grid button').filter(has_text='\u21b6').click();check('Keyboard undo',page.locator('#expression').input_value()=='x+1')
    page.locator('#toggle-keyboard').click();check('Keyboard hide',not page.locator('#keyboard').is_visible());page.locator('#toggle-keyboard').click()
    # Invalid input cannot execute code, worker returns a visible error.
    solve(page,{'mode':'eq','expression':'alert(1)'})
    check('Invalid input error',page.locator('#error-card').is_visible())
    solve(page,{'mode':'definite','expression':'1/x','a':'-1','b':'1'})
    check('Improper integral rejected in UI',page.locator('#error-card').is_visible())
    r=solve(page,{'mode':'primitive','expression':'exp(-x^2)'})
    check('Unsupported primitive marked',r['method']=='No implementat')
    # Graph interaction.
    r=solve(page,{'mode':'derivative','expression':'x*exp(x)','a':'1','xmin':'-3','xmax':'3'})
    page.wait_for_timeout(250);v=page.evaluate('StudioApp.graph.view.x1-StudioApp.graph.view.x0')
    page.locator('#zoom-in').click();page.wait_for_timeout(100)
    check('Graph zoom',page.evaluate('StudioApp.graph.view.x1-StudioApp.graph.view.x0')<v)
    page.locator('#graph-reset').click();check('Graph reset',abs(page.evaluate('StudioApp.graph.view.x1-StudioApp.graph.view.x0')-v)<1e-6)
    page.locator('#graph-legend input').nth(1).uncheck();check('Graph visibility toggle',not page.evaluate('StudioApp.graph.visible[1]'));page.locator('#graph-legend input').nth(1).check()
    with page.expect_download() as d: page.locator('#graph-png').click()
    check('Graph PNG download',Path(d.value.path()).read_bytes().startswith(b'\x89PNG'))
    page.locator('#theme-toggle').click();check('Dark theme toggles',page.evaluate('document.documentElement.dataset.theme')=='dark')
    page.locator('#theme-toggle').click()
    page.locator('#install-app').click();check('Install fallback guidance',page.locator('#help-dialog').evaluate('d=>d.open'))
    page.locator('[data-close="help-dialog"]').click()
    # Restore a separate UI session with a copied store, not a browser reload.
    store=page.evaluate('Object.fromEntries(testStore.entries())');ctx2,p2,e2=bootstrap(browser,store=store)
    check('Saved entries restored',p2.locator('#saved-count').inner_text()=='1');ctx2.close()
    # Actual worker calculation still works while network is disabled (assets injected).
    context.set_offline(True);r=solve(page,{'mode':'primitive','expression':'2x*cos(x^2)'})
    check('Local worker with network disabled',r is not None and 'sin' in r['resultText']);context.set_offline(False)
    # Import validation, then valid import. This is explicitly a current-quaderno backup.
    page.locator('#notebook-open').click();page.on('dialog',lambda d:d.accept())
    page.locator('#import-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"app":"wrong"}'})
    page.wait_for_timeout(150);check('Invalid backup rejected','rebutjada' in page.locator('#toast').inner_text())
    page.locator('#import-file').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_timeout(150);check('Valid backup imported',page.locator('#saved-count').inner_text()=='1')
    page.locator('[data-close="notebook-dialog"]').click()
    # Desktop and narrow screen inspection with the same supported example.
    for width,height in [(1440,1080),(1024,1000),(768,1024),(390,844),(320,720)]:
        page.set_viewport_size({'width':width,'height':height})
        r=solve(page,{'mode':'derivative','expression':'x*exp(x)','a':'1','xmin':'-2','xmax':'3'})
        page.wait_for_timeout(250)
        overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
        check('No page overflow at '+str(width),not overflow)
        check('Solve accessible at '+str(width),page.locator('#solve-button').is_visible())
        if width in [1440,390]:
            page.evaluate("document.getElementById('toast').hidden=true;document.getElementById('offline-status').textContent='Mode de prova local'")
            page.screenshot(path=str(OUT/('desktop.png' if width==1440 else 'mobile.png')),full_page=True)
        if width==390:
            page.locator('#mode-select').select_option('limit');check('Mobile selector works',page.locator('#operation-name').inner_text()=='L\u00edmits')
    check('No unhandled JS exceptions',not errors,'; '.join(errors))
    browser.close()
report={'suite':'Chromium injected UI and real Blob workers','version':'2.0.0','limitations':'Administrator blocks all URL navigation. No real installed service worker, no actual reload offline, no device installation tested. Storage double; clipboard and print stubbed as noted in code.','passed':sum(x['pass'] for x in results),'failed':sum(not x['pass'] for x in results),'total':len(results),'results':results}
(OUT/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:report[k] for k in ['passed','failed','total']}))
if report['failed']:raise SystemExit(1)
