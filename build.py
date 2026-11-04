"""Build APK mandiri dengan JDK dan Android SDK lokal; tanpa Gradle/dependensi UI."""
import argparse
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import zipfile
import json
import hashlib
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
manifest = ET.parse(ROOT/'app/src/main/AndroidManifest.xml').getroot()
android = '{http://schemas.android.com/apk/res/android}'
version_name = manifest.attrib[android+'versionName']
version_code = int(manifest.attrib[android+'versionCode'])
args = argparse.ArgumentParser()
args.add_argument('--bundle-audio', action='store_true', help='Sertakan semua MP3 lokal; APK akan jauh lebih besar')
options = args.parse_args()
jdk = next((ROOT / 'tools/jdk').glob('*/bin/javac.exe')).parent
tools = next((ROOT / 'tools/build-tools').glob('*/aapt2.exe')).parent
platform = next((ROOT / 'tools/platform').glob('*/android.jar'))
build = ROOT / 'build'
if build.exists():
    if build.resolve().parent != ROOT.resolve():
        raise RuntimeError('Path build tidak valid')
    shutil.rmtree(build)
for name in ('gen', 'classes', 'dex', 'assets'):
    (build / name).mkdir(parents=True, exist_ok=True)
shutil.copytree(ROOT / 'app/src/main/assets', build / 'assets', dirs_exist_ok=True)
if options.bundle_audio:
    audio = build / 'assets/audio'
    audio.mkdir()
    for file in ROOT.parent.glob('*.mp3'):
        if len(file.stem) == 6 and file.stem.isdigit() and int(file.stem[3:]) > 0:
            shutil.copyfile(file, audio / file.name)
env = os.environ.copy()
env['JAVA_HOME'] = str(jdk.parent)
env['PATH'] = str(jdk) + os.pathsep + env.get('PATH', '')

def run(command):
    result = subprocess.run([str(x) for x in command], cwd=ROOT, env=env, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stdout + '\n' + result.stderr)
    if result.stdout.strip():
        print(result.stdout.strip())

run([tools/'aapt2.exe', 'compile', '--dir', ROOT/'app/src/main/res', '-o', build/'resources.zip'])
run([tools/'aapt2.exe', 'link', '-o', build/'resources.apk', '-I', platform, '--manifest', ROOT/'app/src/main/AndroidManifest.xml',
     '-R', build/'resources.zip', '-A', build/'assets', '--java', build/'gen', '--auto-add-overlay', '-0', 'mp3'])
sources = list((ROOT/'app/src/main/java').rglob('*.java')) + list((build/'gen').rglob('*.java'))
run([jdk/'javac.exe', '-encoding', 'UTF-8', '--release', '8', '-classpath', platform, '-d', build/'classes', *sources])
run([jdk/'jar.exe', 'cf', build/'classes.jar', '-C', build/'classes', '.'])
run([jdk/'java.exe', '-cp', tools/'lib/d8.jar', 'com.android.tools.r8.D8', '--release', '--min-api', '26', '--lib', platform,
     '--output', build/'dex', build/'classes.jar'])
shutil.copyfile(build/'resources.apk', build/'unsigned.apk')
with zipfile.ZipFile(build/'unsigned.apk', 'a', compression=zipfile.ZIP_DEFLATED) as archive:
    for file in (build/'dex').glob('*.dex'):
        archive.write(file, file.name)
run([tools/'zipalign.exe', '-f', '4', build/'unsigned.apk', build/'aligned.apk'])
signing=ROOT/'.signing'
signing.mkdir(exist_ok=True)
password=signing/'password.txt'
if not password.exists():
    password.write_text(secrets.token_urlsafe(24),encoding='ascii')
secret=password.read_text().strip()
keystore=signing/'murojaah.jks'
if not keystore.exists():
    run([jdk/'keytool.exe', '-genkeypair', '-keystore', keystore, '-storepass', secret, '-keypass', secret, '-alias', 'murojaah',
         '-dname', 'CN=Murojaah, O=Personal', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000'])
output=ROOT/'output'
output.mkdir(exist_ok=True)
apk=output/('MAQRI-'+version_name+('-offline' if options.bundle_audio else '')+'.apk')
run([jdk/'java.exe', '-jar', tools/'lib/apksigner.jar', 'sign', '--ks', keystore, '--ks-pass', 'pass:'+secret, '--key-pass', 'pass:'+secret,
     '--out', apk, build/'aligned.apk'])
run([jdk/'java.exe', '-jar', tools/'lib/apksigner.jar', 'verify', '--verbose', apk])
run([tools/'aapt.exe', 'dump', 'badging', apk])
if not options.bundle_audio:
    metadata={'packageName':manifest.attrib['package'],'versionName':version_name,'versionCode':version_code,
              'apk':apk.name,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'size':apk.stat().st_size}
    (output/'update.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
print('APK:',apk)
print('Ukuran:',round(apk.stat().st_size/1024/1024,2),'MB')
