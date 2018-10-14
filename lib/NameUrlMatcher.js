var log = require("./SimpleLogger.js").getLogger();

function NameUrlMatcher() {
}

/**
 * Match restPath (e.g. /api/user/:id) to requestUrl (e.g. /api/user/1).
 *
 * @param restPath Rest path (e.g. /api/user/:id)
 * @param requestUrl Actual request url (e.g. /api/user/1)
 * @returns {Promise} Promise of map key to value (key from restPath and matched value from requestUrl)
 */
NameUrlMatcher.prototype.match = function(restPath, requestUrl) {
  var restPaths = restPath.split("/");
  var requestUrls = requestUrl.split("/");

  log("Trying to match restPath = '"+restPath+"' vs requestUrl = '"+requestUrl+"'");

  if(restPaths.length !== requestUrls.length) {
    return false;
  }

  var ok = true;
  var args = {};
  for(let k = 0; k < restPaths.length; k++) {
    let restPathPart = restPaths[k];
    let requestUrlPart = requestUrls[k];

    //log.trace(requestUrlPart+" <-> "+restPathPart);
    if(requestUrlPart !== restPathPart) {
      if(restPathPart[0] === ":") {
        args[restPathPart.substring(1, restPathPart.length)] = requestUrlPart;
      } else {
        ok = false;
        break;
      }
    }
  }

  log((ok ? "OK" : "FAIL")+" args = "+JSON.stringify(args));

  if(!ok) {
    return false;
  } else {
    return args;
  }
}

module.exports = NameUrlMatcher;
