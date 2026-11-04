import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent
plan = json.loads((ROOT / 'download-plan.json').read_text())

def install(key, folder):
    destination = ROOT / folder
    if destination.exists():
        print(folder, 'sudah tersedia', flush=True)
        return
    archive = ROOT / (folder + '.zip')
    if not archive.exists():
        print('Mengunduh', folder, flush=True)
        urllib.request.urlretrieve(plan[key], archive)
    if key == 'jdk' and hashlib.sha256(archive.read_bytes()).hexdigest() != plan['jdk_sha256']:
        raise RuntimeError('Checksum JDK tidak cocok')
    destination.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as files:
        files.extractall(destination)
    print(folder, 'siap', flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    jobs = [pool.submit(install, key, folder) for key, folder in
            [('jdk', 'jdk'), ('platforms;android-35', 'platform'), ('build-tools;35.0.0', 'build-tools')]]
    for job in jobs:
        job.result()
