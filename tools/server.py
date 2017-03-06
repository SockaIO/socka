#!/usr/bin/env python

"""
Simple Webserver used to serve songs files. It supports authentication and CORS
"""

try:
    from SimpleHTTPServer import SimpleHTTPRequestHandler
    from BaseHTTPServer import HTTPServer
except ImportError:
    from http.server import SimpleHTTPRequestHandler
    from http.server import HTTPServer
import base64

PASSWORD = "admin:password"

HOST = ''
PORT = 8000

_KEY = base64.b64encode(PASSWORD.encode("utf-8")).decode("utf-8")

class AuthHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:8080')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Connection', 'Close')
        self.end_headers()

    def do_HEAD(self):
        self.end_headers()

    def do_AUTHHEAD(self):
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm=\"Test\"')
        self.end_headers()

    def do_GET(self):
        try:
            auth = self.headers['Authorization']
        except KeyError:
            auth = self.headers.getheader('Authorization')

        if auth is None:
            self.do_AUTHHEAD()
            self.wfile.write('No Auth Header received'.encode("utf-8"))
        elif auth == 'Basic ' + _KEY:
            SimpleHTTPRequestHandler.do_GET(self)
        else:
            self.do_AUTHHEAD()
            self.wfile.write(auth.encode("utf-8"))
            self.wfile.write('Bad Auth')

def main():
    """ Run the server """
    httpd = HTTPServer((HOST, PORT), AuthHandler)
    httpd.serve_forever()

if __name__ == '__main__':
    main()
