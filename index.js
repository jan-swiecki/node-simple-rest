_ = require("lodash")
http = require("http")
esprima = require("esprima");

function formatDate(date) {
  var str = date.toISOString().replace(/T/, " ");
  var ret = str.substring(0,str.length - 2);
  return "["+ret+"]";
}

var log = function(msg) {
  console.log("[LOG]", formatDate(new Date()), msg);
}

function UrlMatcher() {
}

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



function LinearUrlMatcher() {
}

LinearUrlMatcher.prototype.match = function(restPath, requestUrl) {
  var restPaths = restPath.split("/");
  var requestUrls = requestUrl.split("/");

  if(restPaths.length !== requestUrls.length) {
    return {
      ok: false,
      args: []
    };
  }

  var ok = true;
  var args = [];
  restPaths.forEach(function(restPathPart,k) {
    var requestUrlPart = requestUrls[k];
    log(requestUrlPart+" <-> "+restPathPart);
    if(requestUrlPart !== restPathPart) {
      if(restPathPart[0] === ":") {
        args.push(requestUrlPart);
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
        var ret = v.execute(req, res, match.args);
        if(ret.response) {
          res.end(ret.response);
        }
        return false;
      }
    });
  }

}

function Rest(processor) {
  this.processor = processor;
}

Rest.prototype.get = function(path, callback){
  log("Registering handler for "+path);
  processor.addHandler({
    method: "get",
    path: path,
    execute: this.getExecutor(callback)
  });

  return this;
};

Rest.prototype.getExecutor = function(callback) {
  var self = this;
  return function(req, res, args) {

    log("Executing callback: "+callback);

    var response = self.executeInject(callback, args);

    var ret = {};
    if(typeof response !== 'undefined') {
      if(_.isObject(response)) {
        ret.response = JSON.stringify(response);
      } else {
        ret.response = response;
      }
    }

    return ret;
  }
}

Rest.prototype.executeInject = function(callback, args) {

  if(_.isArray(args)) {
    return callback.apply(undefined, args);
  } else if(_.isPlainObject(args)) {

    var parsedCallback = esprima.parse("("+callback+")");
    var callbackParamNames = parsedCallback.body[0].expression.params.map(function(v) { return v.name; });

    var arrayArgs = [];
    _(callbackParamNames).forEach(function(paramName,key) {
      arrayArgs.push(args[paramName]);
    }).value();

    log("arrayArgs = "+arrayArgs);

    return callback.apply(undefined,arrayArgs);

  } else {
    throw "Unprocessable type of args: "+args;
  }

}

Rest.prototype.process = function(req, res) {
  return this.processor.process(req,res);
}

var urlMatcher = new NameUrlMatcher();
var processor = new Processor(urlMatcher);
var rest = new Rest(processor);

module.exports = rest;

http.createServer(function(req,res){

  if(! rest.process(req,res)) {
    res.writeHead(404);
    res.end("404 Not Found");
  }

}).listen(3000);
