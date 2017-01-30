#!/usr/bin/env python2

"""
Simple Webserver used to serve songs files. It supports authentication and CORS
"""

from SimpleHTTPServer import SimpleHTTPRequestHandler
import BaseHTTPServer
import base64

class AuthHandler (SimpleHTTPRequestHandler):

    def end_headers (self):
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
        if self.headers.getheader('Authorization') == None:
            self.do_AUTHHEAD()
            self.wfile.write('No Auth Header received')
            pass
        elif self.headers.getheader('Authorization') == 'Basic ' + key:
            SimpleHTTPRequestHandler.do_GET(self)
            pass
        else:
            self.do_AUTHHEAD()
            self.wfile.write(self.headers.getheader('Authorization'))
            self.wfile.write('Bad Auth')
            pass


if __name__ == '__main__':
    password = "admin:password"
    key = base64.b64encode(password)
    BaseHTTPServer.test(AuthHandler, BaseHTTPServer.HTTPServer)
