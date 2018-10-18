const _ = require('lodash');
const cookie = require('cookie');

class Cookies {
  constructor(cookies, res) {
    this.cookies = cookies;
    this.res = res;
  }

  /**
   * 
   * @param {string} key 
   * @param {string} value 
   * @param {object} options options from https://github.com/jshttp/cookie with
   *                 addition of maxAge (in seconds) and path defaults to '/'
   */
  set(key, value, opts = {}) {
    if ('maxAge' in opts) {
      opts.expires = new Date(Date.now() + opts.maxAge*1000);
    }
  
    if (opts.path == null) {
      opts.path = '/';
    }
  
    this.res.setHeader('Set-Cookie', cookie.serialize(key, String(value), opts));
  }

  unset(key) {
    this.set(key, '', {
      maxAge: -3600
    });
  }

  get(key) {
    return this.cookies[key];
  }
}

module.exports = Cookies;