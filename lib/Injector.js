var esprima = require("esprima");

function Injector() {
}

Injector.prototype.executeInject = function(callback, args) {
  var parsedCallback = esprima.parse("("+callback+")");
  var functionName = parsedCallback.body[0].expression.id;

  if(_.isArray(args)) {
    return {
      returnValue: callback.apply(undefined, args),
      functionName: functionName
    };
  } else if(_.isPlainObject(args)) {
    var callbackParamNames = parsedCallback.body[0].expression.params.map(function(v) { return v.name; });

    var arrayArgs = [];
    _(callbackParamNames).forEach(function(paramName,key) {
      arrayArgs.push(args[paramName]);
    }).value();

    log("arrayArgs = "+arrayArgs);

    return {
      returnValue: callback.apply(undefined,arrayArgs),
      functionName: functionName
    };

  } else {
    throw "Unprocessable type of args: "+args;
  }
}



module.exports = Injector;
