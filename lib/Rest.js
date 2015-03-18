var log = require("./SimpleLogger.js").getLogger();

function Rest(processor, injector) {
  this.processor = processor;
  this.injector = injector;
}

handlerFactory = function(method) {
  return function(path, callback){
    log("Registering handler for "+path);
    this.processor.addHandler({
      method: method,
      path: path,
      execute: this.getExecutor(callback)
    });

    return this;
  };
}

Rest.prototype.get = handlerFactory("get");
Rest.prototype.post = handlerFactory("post");
Rest.prototype.delete = handlerFactory("delete");
Rest.prototype.put = handlerFactory("put");

Rest.prototype.getExecutor = function(callback) {
  var self = this;
  return function(req, res, args) {

    // log("Executing callback: "+callback);

    var result = self.executeInject(callback, args);
    var returnValue = result.returnValue;
    var contentType = result.contentType;
    var statusCode = result.statusCode;

    if(! returnValue && statusCode !== 200) {
      returnValue = {500: "500 Internal Server Error"}[statusCode];
    }

    var ret = {};
    if(typeof returnValue !== 'undefined') {
      if(_.isObject(returnValue)) {
        ret.response = JSON.stringify(returnValue);
        contentType = contentType || "application/json";
      } else {
        ret.response = returnValue;
        contentType = contentType || "text/plain";
      }
    }

    res.writeHead(statusCode, {
      "Content-Type": contentType
    });

    return ret;
  }
}

Rest.prototype.executeInject = function(callback, args) {
  var result = this.injector.executeInject(callback, args);

  return {
    returnValue: result.returnValue,
    statusCode: result.statusCode || 200,
    contentType: this.callbackNameToContentType(result.functionName)
  };
}

Rest.prototype.callbackNameToContentType = function(callbackIdentifier) {
  if(! callbackIdentifier) {
    return null;
  } else {
    var name = callbackIdentifier.name;

    if(name.match(/^as/)) {

      name = name.substring(2, name.length);
      name = name[0].toLowerCase() + name.substring(1, name.length);
      name = name.replace(/([A-Z])/g, function(match, x) {
        return "/"+x.toLowerCase();
      });

      return name;
    } else {
      return null;
    }

  }
}

Rest.prototype.process = function(req, res) {
  return this.processor.process(req,res);
}

module.exports = Rest;
