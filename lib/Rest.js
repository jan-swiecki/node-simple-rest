var Response = require("./Response.js");
var Helper = require("./Helper.js");
var Promise = require("bluebird");
var _ = require("lodash");

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
      .spread(function(handler, pathVarsMap) {
        self.injector.executeInject(handler.callback, pathVarsMap)
          .then(function(result) {
            return self.promiseResponse(result, handler.callback).then(function(response){
              response.write(res);
            });
          })
          .catch(function(error) {
            log.error("Error processing request", error);
            Write500(res);
          });
      })

      // handler not found or error
      .catch(function(error) {
        if(! error) {
          Write404(res);
        } else {
          log.error(error);
          Write500(res);
        }
      })
  };
}

function Write404(res) {
  res.writeHead(404);
  res.end("404 Not Found");
}

function Write500(res) {
  res.writeHead(500);
  res.end("500 Internal Server Error");
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

  var contentType = functionName ? (Helper.callbackNameToContentType(functionName) || "text/plain") : "text/plain";
  var returnType = functionName ? Helper.callbackNameToReturnType(functionName) : null;
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
