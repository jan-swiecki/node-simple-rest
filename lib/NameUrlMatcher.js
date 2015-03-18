Helper = require("./Helper.js");

var log = Helper.getLogger();

function NameUrlMatcher() {
}

NameUrlMatcher.prototype.match = function(restPath, requestUrl) {
  var restPaths = restPath.split("/");
  var requestUrls = requestUrl.split("/");

  if(restPaths.length !== requestUrls.length) {
    return {
      ok: false,
      args: []
    };
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

  return {
    args: args,
    ok: ok
  };
}

module.exports = NameUrlMatcher;
