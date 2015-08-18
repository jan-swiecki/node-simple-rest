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

  return new Promise(function(resolve, reject){
    if(restPaths.length !== requestUrls.length) {
      reject();
    }

    var ok = true;
    var args = {};
    restPaths.forEach(function(restPathPart,k) {
      var requestUrlPart = requestUrls[k];
      log(requestUrlPart+" <-> "+restPathPart);
      if(requestUrlPart !== restPathPart) {
        if(restPathPart[0] === ":") {
          args[restPathPart.substring(1, restPathPart.length)] = requestUrlPart;
        } else {
          ok = false;
          return false;
        }
      }
    });

    log((ok ? "OK" : "FAIL")+" args = "+JSON.stringify(args));

    if(!ok) {
      reject();
    } else {
      resolve(args);
    }
  });
}

module.exports = NameUrlMatcher;
