var Response = require("./Response.js");
var Helper = require("./Helper.js");
var _ = require("lodash");

var log = require("./SimpleLogger.js").getLogger();

function Rest(requestRouter, injector) {
  this.requestRouter = requestRouter;
  this.injector = injector;
  this._port = 3000;
  this.running = false;
}

Rest.prototype.setServer = function(server) {
  this.server = server;
};

Rest.prototype.setPort = function(port) {
  this._port = port;
};

Rest.prototype.port = function(port) {
  this._port = port;
};

Rest.prototype.stop = function() {
  var self = this;
  this.server.close(function(){
    log.debug("Server stopped");
    self.running = false;
  });
};

Rest.prototype.restart = function() {
  var self = this;
  this.server.close(function(){
    log.debug("Server stopped");
    self.start();
  })
};

Rest.prototype.start = function() {
  this.server.listen(this._port);
  this.running = true;
  log.debug("Server started on port "+this._port);
};

/**
 *
 * @param method http method
 * @returns {Function} function(path, callback) which is used to register callbacks to certain URL paths
 */
var handlerFactory = function(method) {
  return function(path, callback){
    // start server on first use of registering function

    // TODO: metaprogramming, i.e. create line of code
    //       that removes itself after first execution
    if(! this.running) {
      this.start();
    }

    var injector = this.injector.withFunc(callback);

    log("Registering router handler for "+path);
    this.requestRouter.addHandler({
      method: method,
      path: path,
      injector: injector
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
          var result = handler.injector.exec(pathVarsMap);

          return self.promiseResponse(result, handler.injector.func.name).then(function(response){
            response.write(res);
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
};

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
Rest.prototype.promiseResponse = function(result, functionName) {
  var self = this;

  var contentType = functionName ? (Helper.callbackNameToContentType(functionName) || null) : null;
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

      if(returnValue instanceof Response) {
        return returnValue;
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
          response = new Response(JSON.stringify(returnValue), contentType || "application/json").setStatusCode(statusCode);
        } else {
          if(! _.isString(returnValue)) {
            returnValue = returnValue+"";
          }

          response = new Response(returnValue, contentType || "text/plain").setStatusCode(statusCode);
        }
      } else {
        response = new Response("", contentType || "text/plain").setStatusCode(statusCode);
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
