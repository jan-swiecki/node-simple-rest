var log = require("./SimpleLogger.js").getLogger();

function Processor(urlMatcher) {
  this.handlers = {};
  this.urlMatcher = urlMatcher;
}

Processor.prototype.addHandler = function(handler) {
  handler.method = handler.method.toLowerCase();

  this.handlers[handler.method] = this.handlers[handler.method] || [];
  this.handlers[handler.method].push(handler);
};

Processor.prototype.process = function(req, res) {
  var self = this;

  log("Processing request "+req.method+" "+req.url);
  log("Handlers available "+JSON.stringify(this.handlers));

  var hs = this.handlers[req.method.toLowerCase()];

  var ret = false;

  if(! hs) {
    log("FAIL No handlers found for "+req.method);
    return false;
  } else {
    log("OK handlers found for "+req.method+", hs="+JSON.stringify(hs));

    var h = hs[req.url];

    hs.forEach(function(v) {
      log("Matching "+v.path+" vs "+req.url);

      var match = self.urlMatcher.match(v.path, req.url);

      if(match.ok) {
        log("OK handler found for "+req.url);
        ret = true;
        v.execute(req, res, match.args);
        return true;
      }
    });
  }

  return ret;

}

module.exports = Processor;
