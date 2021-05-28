#!/usr/bin/python
# encoding : utf-8

from flup.server.fcgi import WSGIServer
import urllib.parse


def myapp(environ, start_response):
    start_response('200 OK', [('Content-Type', 'text/plain')])
    data = environ["wsgi.input"].read()
    with open("../viewer_data/backend-data.txt", 'w+') as f:
        f.write(bytes.decode(data))
    print(data)
    return [data]


if __name__ == '__main__':
    WSGIServer(myapp, bindAddress=('127.0.0.1', 8008)).run()