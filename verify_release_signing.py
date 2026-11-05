"""Refuse an update whose version code or signing certificate breaks existing installs."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
REPO = 'hauna-dev/MAQRI'
PREFIX = f'https://github.com/{REPO}/releases/download/'


def open_url(url):
    return urlopen(Request(url, headers={'User-Agent': 'MAQRI-release-verifier'}), timeout=30)


def certificates(apk):
    java = next((ROOT / 'tools/jdk').glob('*/bin/java.exe'), None) or shutil.which('java')
    signer = next((ROOT / 'tools/build-tools').glob('*/lib/apksigner.jar'), None)
    if signer is None and os.environ.get('LOCALAPPDATA'):
        signer = next((Path(os.environ['LOCALAPPDATA']) / 'Android/Sdk/build-tools').glob('*/lib/apksigner.jar'), None)
    if not java or not signer:
        raise RuntimeError('Install Android build tools before checking the signing certificate.')
    result = subprocess.run([str(java), '-jar', str(signer), 'verify', '--print-certs', str(apk)],
                            check=True, capture_output=True, text=True)
    digests = set(re.findall(r'Signer #\d+ certificate SHA-256 digest: ([0-9a-fA-F]{64})', result.stdout))
    if not digests:
        raise ValueError('No valid signer certificate found.')
    return {digest.lower() for digest in digests}


def main():
    current = json.loads((ROOT / 'output/update.json').read_text(encoding='utf-8'))
    try:
        with open_url(f'https://api.github.com/repos/{REPO}/releases/latest') as response:
            release = json.load(response)
    except HTTPError as error:
        if error.code == 404:
            print('No previous release; first release signing check skipped.')
            return
        raise
    manifest_asset = next(asset for asset in release['assets'] if asset['name'] == 'update.json')
    manifest_url = manifest_asset['browser_download_url']
    if not manifest_url.startswith(PREFIX):
        raise ValueError('Untrusted previous update manifest URL.')
    with open_url(manifest_url) as response:
        previous = json.loads(response.read(30001))
    if current['versionCode'] <= previous['versionCode']:
        raise ValueError('versionCode must be higher than the latest published release.')
    asset = next(asset for asset in release['assets'] if asset['name'] == previous['apk'])
    if not asset['browser_download_url'].startswith(PREFIX) or asset['size'] != previous['size']:
        raise ValueError('Previous APK asset does not match its metadata.')
    with tempfile.TemporaryDirectory(prefix='maqri-signature-') as folder:
        old_apk = Path(folder) / 'previous.apk'
        digest, size = hashlib.sha256(), 0
        with open_url(asset['browser_download_url']) as response, old_apk.open('wb') as target:
            while True:
                chunk = response.read(65536)
                if not chunk:
                    break
                size += len(chunk)
                if size > previous['size']:
                    raise ValueError('Previous APK exceeded its declared size.')
                digest.update(chunk)
                target.write(chunk)
        if size != previous['size'] or digest.hexdigest() != previous['sha256']:
            raise ValueError('Previous APK checksum does not match.')
        if certificates(old_apk) != certificates(ROOT / 'output' / current['apk']):
            raise ValueError('Signing key differs from the published APK. Restore the original key before publishing.')
    print('Higher versionCode and matching published APK signing certificate verified.')


if __name__ == '__main__':
    main()
