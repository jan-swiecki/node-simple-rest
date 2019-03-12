var _ = require('lodash');
var log = require("./SimpleLogger.js").getLogger('accesslog');

function access_log(req, res, body, is_response = false) {
  if(_.isString(req)) {
    log(req);
    return;
  }

  log(`${req.method} ${req.url}${is_response ? ' = '+res.statusCode : ''}`);

  if(process.env.DEBUG_UNSAFE && !is_response) {
    if(req.headers['content-type']) {
      log(`<-- Content-Type: ${req.headers['content-type']}`);
    }
    if(req.headers['cookie']) {
      log(`<-- Cookie: ${req.headers['cookie']}`);
    }
  }

  if(process.env.DEBUG_UNSAFE && req.body && Object.keys(req.body).length > 0 && !is_response) {
    log(`<-- `+JSON.stringify(req.body, undefined, 2));
  }

  if(is_response) {
    log(`--> STATUS: ${res.statusCode}`);
  }

  if(process.env.DEBUG_UNSAFE && is_response) {
    res.getHeaderNames().forEach(h => {
      log(`--> HEADER: ${h}=${res.getHeader(h)}`);
    });
  }

  if(process.env.DEBUG_UNSAFE && body && is_response) {
    log(`--> BODY: ${body}`);
  }
}

module.exports = access_log;