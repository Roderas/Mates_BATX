"""Rebuild the offline cache fingerprint after editing runtime assets. Python 3, no dependencies."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]
assets=['./','./index.html','./docent.html','./manifest.json','./favicon.ico']
for folder in ['css','data','js','icons','studio']:
    assets += ['./'+p.relative_to(root).as_posix() for p in sorted((root/folder).glob('*')) if p.is_file()]
checksum=hashlib.sha256()
for name in assets:
    if name=='./': continue
    checksum.update(name.encode());checksum.update((root/name[2:]).read_bytes())
revision=checksum.hexdigest()[:16]
template=(root/'scripts/sw-template.txt').read_text()
template=template.replace('__REVISION__',revision).replace('__ASSETS__',json.dumps(assets,indent=2))
(root/'sw.js').write_text(template)
print('Cache revision:',revision,'Resources:',len(assets))
