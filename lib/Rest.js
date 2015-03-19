var Response = require("./Response.js");

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

    var result = self.injector.executeInject(callback, args);

    var returnValue = result.returnValue;
    var statusCode = result.error ? 500 : 200;

    if(! returnValue && statusCode !== 200) {
      returnValue = {500: "500 Internal Server Error"}[statusCode];
    }

    var response;
    if(typeof returnValue !== 'undefined') {
      // wrapped response (e.g. file stream)
      if(result.returnValue instanceof Response) {
        response = result.returnValue;
      }
      else if(_.isObject(returnValue)) {
        response = new Response(JSON.stringify(returnValue), "application/json").setStatusCode(statusCode);
      } else {
        if(! _.isString(returnValue)) {
          returnValue = returnValue+"";
        }

        response = new Response(returnValue, "text/plain").setStatusCode(statusCode);
      }
    } else {
      response = new Response("", "text/plain").setStatusCode(statusCode);
    }

    response.write(res);
    return true;

  }
}

Rest.prototype.respond = function(response) {
  response.write(res);
}

// @DEPRECATED
Rest.prototype.executeInject = function(callback, args) {
  var result = this.injector.executeInject(callback, args);

  return {
    returnValue: result.returnValue,
    statusCode: result.error || 200,
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
