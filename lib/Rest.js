var Response = require("./Response.js");
var Helper = require("./Helper.js");
var Promise = require("bluebird");

var log = require("./SimpleLogger.js").getLogger();

function Rest(requestRouter, injector) {
  this.requestRouter = requestRouter;
  this.injector = injector;
}

/**
 *
 * @param method http method
 * @returns {Function} function(path, callback) which is used to register callbacks to certain URL paths
 */
var handlerFactory = function(method) {
  return function(path, callback){
    log("Registering router handler for "+path);
    this.requestRouter.addHandler({
      method: method,
      path: path,
      callback: callback
      //produceResponse: this.getResponseGenerator(callback)
    });

    return this;
  };
};

Rest.prototype.get = handlerFactory("get");
Rest.prototype.post = handlerFactory("post");
Rest.prototype.delete = handlerFactory("delete");
Rest.prototype.put = handlerFactory("put");

Rest.prototype.getServerHandler = function() {
  var self = this;
  return function(req, res) {
    self.requestRouter.findHandlerForRequest(req, res)
      // handler found
      // pathVarsMap - map of path variables to their values
      .then(function (handler, pathVarsMap) {
        self.injector.executeInject(handler.callback, pathVarsMap)
          .then(function(result) {
            var response = self.promiseResponse(result, handler.callback);
            response.write(res);
          })
          .catch(function(error) {
            log.error("Error processing request " + error);
            res.write(500);
          });
      })

      // handler not found
      .catch(function () {
        res.writeHead(404);
        res.end("404 Not Found");
      })
  };
}

/**
 *
 * @param result
 * @param statusCode
 * @param functionName
 * @returns {bluebird|exports|module.exports}
 */
Rest.prototype.promiseResponse = function(result, handlerCallback) {
  var self = this;

  var functionName = self.injector.getFunctionName(handlerCallback);

  var contentType = Helper.callbackNameToContentType(functionName) || "text/plain";
  var returnType = Helper.callbackNameToReturnType(functionName);
  var statusCode = 200;

  return new Promise(function(resolve, reject) {
    log("result.promise -> "+result.promise);

    if(result instanceof Promise) {
      resolve(result.then(getResponse));
    } else {
      var response = getResponse(result);
      resolve(response);
    }

    function getResponse(returnValue) {
      if(! returnValue && statusCode !== 200) {
        returnValue = {500: "500 Internal Server Error"}[statusCode];
      }

      if(returnType === "statusCode") {
        log.debug("returnType = "+returnType);
        statusCode = returnValue;
        returnValue = "";
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

          response = new Response(returnValue, contentType).setStatusCode(statusCode);
        }
      } else {
        response = new Response("", contentType).setStatusCode(statusCode);
      }

      return response;
    }
  });

};

Rest.prototype.respond = function(response) {
  response.write(res);
};

Rest.prototype.process = function(req, res, callback) {
  return this.requestRouter.process(req, res, callback);
};

module.exports = Rest;
