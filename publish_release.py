"""Validate and publish matching MAQRI release assets using authenticated GitHub CLI."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent


def validate():
    android = '{http://schemas.android.com/apk/res/android}'
    manifest = ET.parse(ROOT / 'app/src/main/AndroidManifest.xml').getroot()
    version = manifest.attrib[android + 'versionName']
    code = int(manifest.attrib[android + 'versionCode'])
    metadata_path = ROOT / 'output/update.json'
    metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
    expected = f'MAQRI-{version}.apk'
    if (metadata.get('apk') != expected or metadata.get('versionName') != version
            or metadata.get('versionCode') != code
            or metadata.get('packageName') != manifest.attrib['package']):
        raise ValueError('Build APK/update.json kembali; metadata tidak cocok dengan versi sumber.')
    apk = ROOT / 'output' / expected
    if (apk.stat().st_size != metadata.get('size')
            or hashlib.sha256(apk.read_bytes()).hexdigest() != metadata.get('sha256')):
        raise ValueError('Ukuran atau SHA-256 APK tidak cocok dengan update.json.')
    with zipfile.ZipFile(apk) as archive:
        if archive.testzip() is not None:
            raise ValueError('APK rusak.')
        config = json.loads(archive.read('assets/update-config.json'))
        if config.get('repository') != 'hauna-dev/MAQRI':
            raise ValueError('Sumber pembaruan APK tidak sesuai.')
    return version, apk, metadata_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true', help='Publish after validation; requires gh auth login')
    parser.add_argument('--target', help='Commit SHA containing this version; required when publishing')
    args = parser.parse_args()
    version, apk, metadata = validate()
    print(f'Validated {apk.name} and update.json (version {version}).', flush=True)
    if not args.publish:
        return
    if not args.target:
        parser.error('--target COMMIT_SHA is required to publish a reviewable source revision')
    gh = shutil.which('gh')
    if not gh:
        raise SystemExit('GitHub CLI belum tersedia. Pasang gh dan jalankan gh auth login dahulu.')
    subprocess.run([gh, 'auth', 'status'], check=True)
    # Never replace assets of an already published tag.
    existing = subprocess.run([gh, 'release', 'view', 'v' + version, '--repo', 'hauna-dev/MAQRI'],
                              capture_output=True, text=True)
    if existing.returncode == 0:
        raise SystemExit('Versi ini sudah diterbitkan. Naikkan nomor versi; jangan menimpa rilis lama.')
    subprocess.run([gh, 'release', 'create', 'v' + version, str(apk), str(metadata),
                    '--repo', 'hauna-dev/MAQRI', '--target', args.target,
                    '--title', 'MAQRI ' + version, '--latest',
                    '--notes-file', str(ROOT / 'RELEASE_NOTES.md')], check=True)


if __name__ == '__main__':
    main()
