from pathlib import Path
import difflib,json,shutil
root=Path(__file__).parent;pkg=Path('/Users/macos/.local/omniroute/lib/node_modules/omniroute');tz=Path('/Users/macos/.omniroute/backups/patch-timezone-20261008');state=root/'migration-backup';state.mkdir(exist_ok=True);rules=[];restore=[]
def backup(p):
 rel=p.relative_to(pkg);d=state/rel;d.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,d)
for original in tz.glob('*.js'):
 p=pkg/'dist/.build/next/server/chunks'/original.name
 if not p.exists():continue
 a=original.read_text();b=p.read_text();sm=difflib.SequenceMatcher(None,a,b,autojunk=False)
 for group in sm.get_grouped_opcodes(40):
  i,j=group[0][1],group[-1][2];k,l=group[0][3],group[-1][4]
  rules.append({'before':a[i:j],'after':b[k:l]})
 backup(p);restore.append((p,a))
(root/'timezone-rules.json').write_text(json.dumps(rules,ensure_ascii=False))
# Restore the timezone sources to their pre-customization form.
for original in tz.glob('*.ts'):
 candidates=list((pkg/'src').rglob(original.name))
 p=next((x for x in candidates if ('db/usageAnalytics.ts' in str(x)) or original.name!='usageAnalytics.ts'),None)
 if p:backup(p);restore.append((p,original.read_text()))
weekly=Path('/Users/macos/.omniroute/backups/agy-quota-hud-20261008/weekly-and-asset')
for rel in ['src/lib/usage/providerLimits/quotaNormalize.ts']+[f'dist/.build/next/server/chunks/{name}' for name in ['_0i8yz4i._.js','_0rkfdfr._.js','_0dnhjzp._.js','_1t4meqw._.js','_08fn20x._.js']]:
 p=pkg/rel;backup(p);restore.append((p,(weekly/rel).read_text()))
p=pkg/'dist/.build/next/static/chunks/3-ks27moihm6w.js';backup(p);restore.append((p,Path('/Users/macos/.omniroute/backups/agy-quota-hud-20261008/3-ks27moihm6w.js').read_text()))
p=pkg/'dist/.build/next/server/app/(dashboard)/dashboard/providers/[id]/page_client-reference-manifest.js';backup(p);s=p.read_text();import re;s=re.sub(r'3-ks27moihm6w-agyhud-[a-f0-9]+\.js','3-ks27moihm6w.js',s);restore.append((p,s))
for p,s in restore:p.write_text(s)
(state/'receipt.json').write_text(json.dumps({'restored_package_files':[str(p.relative_to(pkg)) for p,_ in restore],'runtime_timezone_rules':len(rules)},indent=2));print('restored',len(restore),'files; external rules',len(rules))
