"""Source adapters for the local, loopback-only UI preview."""
import json
import re
import time
from functools import lru_cache
from html.parser import HTMLParser
from urllib.request import Request, urlopen


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, text):
        self.parts.append(text)

    def handle_starttag(self, tag, attrs):
        if tag in ('p', 'div', 'br', 'li'):
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if tag in ('p', 'div', 'li'):
            self.parts.append('\n')


def text(html):
    parser = PlainText()
    parser.feed(html)
    return re.sub(r'\n\s*\n+', '\n\n', ''.join(parser.parts)).strip()


def fetch(url, limit=12_000_000):
    with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0 MAQRI/1.0'}), timeout=25) as response:
        data = response.read(limit + 1)
        if len(data) > limit:
            raise ValueError('Sumber terlalu besar')
        return data.decode('utf-8')


@lru_cache(maxsize=8)
def indonesian_sections(surah):
    raw = fetch(f'https://saadi.islamenc.com/id/browse/sura/{surah}')
    anchors = list(re.finditer(r'<a\b[^>]*\bid\s*=\s*["\']aya-(\d+)["\'][^>]*>', raw, re.I))
    if not anchors:
        raise ValueError('Struktur sumber berubah')
    footer = raw.lower().find('<footer', anchors[-1].end())
    if footer < 0:
        raise ValueError('Sumber tidak lengkap')
    arabic = re.compile(r'<div\b[^>]*\bclass\s*=\s*["\'][^"\']*\b_ar\b[^"\']*["\'][^>]*>.*?</div\s*>', re.I | re.S)
    result, pending = {}, []
    for index, anchor in enumerate(anchors):
        pending.append(int(anchor[1]))
        end = anchors[index + 1].start() if index + 1 < len(anchors) else footer
        section = raw[anchor.end():end]
        if not arabic.search(section):
            if text(section):
                raise ValueError('Bagian tafsir tidak dikenali')
            continue
        section = arabic.sub('', section)
        section = re.sub(r'<a\b[^>]*>.*?</a\s*>', '', section, flags=re.I | re.S)
        section = re.sub(r'<(script|style)\b[^>]*>.*?</\1\s*>', '', section, flags=re.I | re.S)
        entry = {'verse': pending[0], 'lastVerse': pending[-1], 'text': text(section),
                 'url': f'https://saadi.islamenc.com/id/browse/sura/{surah}#aya-{pending[0]}'}
        for verse in pending:
            result[verse] = entry
        pending = []
    if pending:
        raise ValueError('Teks tafsir tidak lengkap')
    return result


def fetch_indonesian_range(surah, first, last):
    sections = indonesian_sections(surah)
    rows, seen = [], set()
    for verse in range(first, last + 1):
        entry = sections.get(verse, {'verse': verse, 'lastVerse': verse, 'text': '',
                                    'url': f'https://saadi.islamenc.com/id/browse/sura/{surah}#aya-{verse}'})
        if entry['verse'] not in seen:
            rows.append(entry)
            seen.add(entry['verse'])
    return rows


def fetch_verse(surah, verse, deadline):
    if time.monotonic() > deadline:
        raise TimeoutError('Coba rentang yang lebih pendek')
    data = json.loads(fetch(f'https://tafsir.app/get.php?src=saadi&s={surah}&a={verse}&ver=1', 2_000_000))
    if not isinstance(data.get('data'), str):
        raise ValueError('Format sumber berubah')
    return text(data['data'])
