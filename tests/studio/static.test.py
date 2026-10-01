"""Validate runtime links, the install manifest, icons and precache fingerprint."""
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image
import json,re,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[2]
results=[]
def check(name,value):results.append({'name':name,'pass':bool(value)})
for file in ['index.html','docent.html']:
    soup=BeautifulSoup((ROOT/file).read_text(),'html.parser')
    check(file+' declares Catalan',soup.html.get('lang')=='ca')
    check(file+' has manifest',soup.select_one('link[rel="manifest"]') is not None)
    check(file+' has viewport',soup.find('meta',attrs={'name':'viewport'}) is not None)
    for tag in soup.select('script[src],link[href],img[src]'):
        val=tag.get('src') or tag.get('href')
        check(file+' local resource '+val,not re.match(r'^https?:|^//',val) and (ROOT/val.removeprefix('./')).is_file())
    check(file+' no inline script bodies',all(not t.get_text().strip() for t in soup.find_all('script')))
m=json.loads((ROOT/'manifest.json').read_text())
check('Stable install identity',m['id']=='./')
check('Subdirectory-safe start and scope',m['start_url']=='./' and m['scope']=='./')
check('Standalone display',m['display']=='standalone')
for icon in m['icons']:
    p=ROOT/icon['src'];im=Image.open(p)
    check('PNG dimensions '+icon['src'],im.size==tuple(map(int,icon['sizes'].split('x'))) and im.format=='PNG')
check('Required any icons',all(any(i['sizes']==s and i['purpose']=='any' for i in m['icons']) for s in ['192x192','512x512']))
check('Maskable icons separate',any(i['purpose']=='maskable' for i in m['icons']))
check('Apple icon dimensions',Image.open(ROOT/'icons/icon-180.png').size==(180,180))
s=(ROOT/'sw.js').read_text();assets=json.loads(re.search(r'const ASSETS=(\[.*?\]);',s,re.S).group(1))
check('Precache all resources exist',all(n=='./' or (ROOT/n.removeprefix('./')).is_file() for n in assets))
for name in ['studio/engine.js','studio/app.js','studio/worker.js','studio/config.js','studio/styles.css','docent.html']:
    check('Precache '+name,'./'+name in assets)
checksum=hashlib.sha256()
for name in assets:
    if name=='./':continue
    checksum.update(name.encode());checksum.update((ROOT/name[2:]).read_bytes())
check('Cache fingerprint matches content',checksum.hexdigest()[:16]==re.search(r"const REVISION='([^']+)'",s).group(1))
for folder in ['js','data','studio']:
    for p in sorted((ROOT/folder).glob('*.js')):
        check('JS syntax '+str(p.relative_to(ROOT)),subprocess.run(['node','--check',str(p)],capture_output=True).returncode==0)
check('No font binaries shared',not any(p.suffix.lower() in {'.woff','.woff2','.ttf','.otf'} for p in ROOT.rglob('*')))
check('New solver has no eval or Function',not any(re.search(r'\beval\s*\(|new\s+Function\s*\(',p.read_text()) for p in (ROOT/'studio').glob('*.js')))
check('No API secret input',not any('api_key' in p.read_text().lower() for p in (ROOT/'studio').glob('*.js')))
report={'suite':'Static runtime and manifest checks','total':len(results),'passed':sum(r['pass'] for r in results),'failed':sum(not r['pass'] for r in results),'resources':len(assets),'results':results}
(ROOT/'tests/studio/static-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:report[k] for k in ['passed','failed','total','resources']}))
if report['failed']:
    print([r for r in results if not r['pass']]);raise SystemExit(1)
