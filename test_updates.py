from pathlib import Path
import subprocess
import tempfile
import json
import hashlib
import zipfile

ROOT=Path(__file__).resolve().parent
jdk=next((ROOT/'tools/jdk').glob('*/bin/javac.exe')).parent
with tempfile.TemporaryDirectory() as temp:
    subprocess.run([str(jdk/'javac.exe'),'--release','8','-d',temp,str(ROOT/'app/src/main/java/id/murojaah/app/UpdatePolicy.java'),str(ROOT/'tests/UpdatePolicyTest.java')],check=True)
    subprocess.run([str(jdk/'java.exe'),'-cp',temp,'id.murojaah.app.UpdatePolicyTest'],check=True)
metadata=json.loads((ROOT/'output/update.json').read_text())
apk=ROOT/'output'/metadata['apk']
assert apk.stat().st_size==metadata['size']
assert hashlib.sha256(apk.read_bytes()).hexdigest()==metadata['sha256']
with zipfile.ZipFile(apk) as archive:
    config=json.loads(archive.read('assets/update-config.json'))
    assert config['repository']=='hauna-dev/MAQRI'
    for name in ('assets/index.html','assets/app.js','assets/design.css'):
        assert 'github' not in archive.read(name).decode('utf-8').lower()
    assert archive.testzip() is None
print('Release metadata matches signed APK; update source configured; no repository/platform label in UI.')
