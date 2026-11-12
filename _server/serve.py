#!/usr/bin/env python3
"""Serves the saved yaowang.cargo.site locally so it looks and behaves like the original."""
import http.server, os, re, sys, webbrowser, threading, urllib.parse
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8795
PAGES = {d for d in os.listdir(ROOT) if os.path.isfile(os.path.join(ROOT, d, 'page.html'))}
# Rewrites applied to each page so images, videos and Cargo's core scripts come from this folder.
REWRITES = [
    (b'https://freight.cargo.site/', b'/_freight/'), (b'//freight.cargo.site/', b'/_freight/'),
    (b'https:\\/\\/freight.cargo.site\\/', b'\\/_freight\\/'), (b'\\/\\/freight.cargo.site\\/', b'\\/_freight\\/'),
    (b'https://files.cargocollective.com/c1646262/', b'/_media/files/'), (b'//files.cargocollective.com/c1646262/', b'/_media/files/'),
    (b'https:\\/\\/files.cargocollective.com\\/c1646262\\/', b'\\/_media\\/files\\/'),
    (b'https://static.cargo.site/assets/builds/apipackage.min.js', b'/_static/apipackage.min.js'),
    (b'//static.cargo.site/libs/cargo.apicore.package.jquery213.min.js', b'/_static/cargo.apicore.package.jquery213.min.js'),
    (b'https://static.cargo.site/assets/social/IconFont-Regular-0.9.3.woff2', b'/_static/IconFont-Regular-0.9.3.woff2'),
    (b'https://yaowang.cargo.site/', b'/'), (b'//yaowang.cargo.site/', b'/'), (b'https:\\/\\/yaowang.cargo.site\\/', b'\\/'),
    (b'href="/stylesheet?', b'href="/_static/stylesheet.css?'),
]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, fmt, *a):
        if len(a) > 1 and str(a[1]) in ('404',): sys.stderr.write('404 ' + str(a[0]) + '\n')
    def send_file(self, path, ctype=None, inject=False):
        if not os.path.isfile(path): self.send_error(404); return
        data = open(path, 'rb').read()
        if inject:
            for a, b in REWRITES: data = data.replace(a, b)
            data = data.replace(b'<head>', b'<head><meta name="robots" content="noindex, nofollow">', 1)
        self.send_response(200)
        self.send_header('Content-Type', ctype or self.guess_type(path))
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        p = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        name = p.strip('/')
        if p == '/' or name == 'Front-page': return self.send_file(os.path.join(ROOT, 'Front-page', 'page.html'), 'text/html; charset=utf-8', True)
        if name in PAGES: return self.send_file(os.path.join(ROOT, name, 'page.html'), 'text/html; charset=utf-8', True)
        if p.startswith('/_api/') and os.path.isfile(os.path.join(ROOT, p.strip('/'))):
            return self.send_file(os.path.join(ROOT, p.strip('/')), 'application/json')
        if p.startswith('/followingframe') or p.startswith('/_api/'):
            self.send_response(204); self.end_headers(); return
        m = re.search(r'/i/([0-9a-f]{64})/([^/]+)$', p)
        if m and not p.startswith('/_media/'):
            return self.send_file(os.path.join(ROOT, '_media', m.group(1), m.group(2)))
        return super().do_GET()
if __name__ == '__main__':
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H)
    url = 'http://127.0.0.1:%d/' % PORT
    print('Serving the saved site at', url, '(Ctrl+C to stop)')
    if '--no-open' not in sys.argv: threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try: srv.serve_forever()
    except KeyboardInterrupt: pass
