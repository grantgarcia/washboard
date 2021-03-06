import errno
import json
import socket
import urlparse

import oauth2

class Tumblr(object):

    OAUTH_BASE = 'https://www.tumblr.com/oauth/'
    REQUEST_TOKEN = OAUTH_BASE + 'request_token'
    AUTHORIZE = OAUTH_BASE + 'authorize?oauth_token=%s'
    ACCESS_TOKEN = OAUTH_BASE + 'access_token'
    API_BASE = 'https://api.tumblr.com/v2/'
    USER_INFO = API_BASE + 'user/info'

    def __init__(self, api_key, api_secret, token_key=None, token_secret=None,
                 token_verifier=None):
        consumer = oauth2.Consumer(api_key, api_secret)
        if token_key and token_secret:
            token = oauth2.Token(token_key, token_secret)
            if token_verifier:
                token.set_verifier(token_verifier)
            self.client = oauth2.Client(consumer, token)
        else:
            self.client = oauth2.Client(consumer)

    def request_qsl(self, url, method, data=''):
        resp, content = self.client.request(url, method, data)
        return dict(urlparse.parse_qsl(content))

    def request_json(self, url, method, data=''):
        try:
            resp, content = self.client.request(url, method, data)
        except socket.error as e:
            if e.errno != errno.ECONNRESET:
                raise
            return {'meta': {
                'status': '502',
                'msg': 'Dropped connection.  Refreshing should fix this.',
            }}

        try:
            return json.loads(content)
        except ValueError:
            raise ValueError(content)
