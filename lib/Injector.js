var esprima = require("esprima");

var log = require("./SimpleLogger.js").getLogger();

console.log("=============");
console.log(log.error);

function getErrorResponse(functionName) {
  return {
    functionName: functionName,
    statusCode: 500
  };
}

function Injector() {
  this.importExtensions = ["", ".js", ".json"];
  this.importPaths = [
    "",
    "./",
    "./lib/"
  ]
}

Injector.prototype.addImportPath = function(path) {
  this.importPath.push(path);
  return this;
}

Injector.prototype.executeInject = function(callback, args) {
  var parsedCallback = esprima.parse("("+callback+")");
  var functionName = parsedCallback.body[0].expression.id;
  var self = this;

  if(_.isArray(args)) {
    try {
      return {
        returnValue: callback.apply(undefined, args),
        functionName: functionName
      };
    } catch(ex) {
      log.error(ex);
      return getErrorResponse(functionName);
    }
  } else if(_.isPlainObject(args)) {
    var callbackParamNames = parsedCallback.body[0].expression.params.map(function(v) { return v.name; });

    var arrayArgs = [];
    _(callbackParamNames).forEach(function(paramName,key) {

      var value = args[paramName];

      if(typeof value === 'undefined') {
        value = self.tryProvideValue(paramName);
      }

      arrayArgs.push(value);
    }).value();

    log("arrayArgs = "+arrayArgs);

    try {
      return {
        returnValue: callback.apply(undefined,arrayArgs),
        functionName: functionName
      };
    } catch(ex) {
      log.error(ex);
      return getErrorResponse(functionName);
    }

  } else {
    throw "Unprocessable type of args: "+args;
  }
}

Injector.prototype.tryProvideValue = function(paramName) {
  var self = this;
  var ret = undefined;

  // try from modules
  _.each(self.importExtensions, function(ext) {
    _.each(self.importPaths, function(importPath) {
      try {
        var path = importPath+paramName+ext;
        var lib = require(path);

        log("Found lib for "+paramName+": "+path);

        ret = lib;

        return false;
      } catch(ex) {
        if(! ex.message.match(/Cannot find module/)) {
          log.error(ex);
        }
      }
    });
    if(typeof ret !== 'undefined') {
      return false;
    }
  });
}

module.exports = Injector;
