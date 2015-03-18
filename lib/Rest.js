Helper = require("./Helper.js");

var log = Helper.getLogger();

function Rest(processor) {
  this.processor = processor;
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

    log("Executing callback: "+callback);

    var result = self.executeInject(callback, args);
    var response = result.response;
    var contentType = result.contentType;

    var ret = {};
    if(typeof response !== 'undefined') {
      if(_.isObject(response)) {
        ret.response = JSON.stringify(response);
        contentType = contentType || "application/json";
      } else {
        ret.response = response;
        contentType = contentType || "text/plain";
      }
    }

    res.writeHead(200, {
      "Content-Type": contentType
    });

    return ret;
  }
}

Rest.prototype.executeInject = function(callback, args) {
  if(_.isArray(args)) {
    return {
      response: callback.apply(undefined, args),
      contentType: null
    }
  } else if(_.isPlainObject(args)) {

    var parsedCallback = esprima.parse("("+callback+")");
    var callbackParamNames = parsedCallback.body[0].expression.params.map(function(v) { return v.name; });

    var arrayArgs = [];
    _(callbackParamNames).forEach(function(paramName,key) {
      arrayArgs.push(args[paramName]);
    }).value();

    log("arrayArgs = "+arrayArgs);

    var contentType = this.callbackNameToContentType(parsedCallback.body[0].expression.id);

    return {
      response: callback.apply(undefined,arrayArgs),
      contentType: contentType
    };

  } else {
    throw "Unprocessable type of args: "+args;
  }
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
