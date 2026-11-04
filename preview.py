"""Preview lokal UI yang sama dengan APK; hanya mendengarkan loopback."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import sys
import time
from urllib.parse import urlparse, parse_qs

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
from tafsir_saadi import fetch_verse

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'app/src/main/assets'),**kwargs)
    def do_GET(self):
        parsed=urlparse(self.path)
        if parsed.path!='/api/tafsir':return super().do_GET()
        try:
            q=parse_qs(parsed.query);s=int(q['s'][0]);a=int(q['a'][0]);b=int(q['b'][0])
            surahs=json.loads((ROOT/'app/src/main/assets/surahs.json').read_text(encoding='utf-8'))
            if not 1<=s<=114 or not 1<=a<=b<=surahs[s-1]['verses_count'] or b-a+1>100:raise ValueError('Rentang tidak valid')
            deadline=time.monotonic()+100
            rows=[{'verse':v,'text':fetch_verse(s,v,deadline),'url':f'https://tafsir.app/saadi/{s}/{v}'} for v in range(a,b+1)]
            data=json.dumps({'surah':s,'first':a,'last':b,'verses':rows}).encode()
            self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(data)
        except Exception:
            self.send_error(502,'Tafsir source unavailable')

if __name__=='__main__':
    print('Preview: http://127.0.0.1:18766',flush=True)
    ThreadingHTTPServer(('127.0.0.1',18766),Handler).serve_forever()
