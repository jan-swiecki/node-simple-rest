var _ = require('lodash');
var log = require("./SimpleLogger.js").getLogger('accesslog');

function access_log(req, res, body) {
  if(_.isString(req)) {
    log(req);
    return;
  }

  log(`${req.method} ${req.url} = ${res.statusCode}`);

  if(process.env.DEBUG_UNSAFE) {
    if(req.headers['content-type']) {
      log(`<-- Content-Type: ${req.headers['content-type']}`);
    }
    if(req.headers['cookie']) {
      log(`<-- Cookie: ${req.headers['cookie']}`);
    }
  }

  if(process.env.DEBUG_UNSAFE && req.body && Object.keys(req.body).length > 0) {
    log(`<-- `+JSON.stringify(req.body, undefined, 2));
  }

  log(`--> STATUS: ${res.statusCode}`);

  if(process.env.DEBUG_UNSAFE) {
    res.getHeaderNames().forEach(h => {
      log(`--> HEADER: ${h}=${res.getHeader(h)}`);
    });
  }

  if(process.env.DEBUG_UNSAFE && body) {
    log(`--> BODY: ${body}`);
  }
}

module.exports = access_log;