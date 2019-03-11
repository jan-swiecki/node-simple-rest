var Response = require("./Response.js");
var Helper = require("./Helper.js");
var Cookies = require("./Cookies.js");
var _ = require("lodash");
var bodyParser = require("body-parser");
var cookie = require('cookie');
var JSON_prune = require('./JSON.prune')
var log = require("./SimpleLogger.js").getLogger();
var access_log = require("./SimpleLogger.js").getLogger('accesslog');

function Rest(requestRouter, injector) {
  this.requestRouter = requestRouter;
  this.injector = injector;
  this._port = 3000;
  this.running = false;

  // mapping from constructor name to array [statusCode, errorClass]
  this.errorMapping = {};
  this.injectorMiddlewares = [];
  this.serializer = x => JSON.stringify(x);
  this.errorHandler = x => {};

  // exit handling
  this._exitListeners = [];
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

Rest.prototype.setSerializer = function(serializer) {
  this.serializer = serializer;
  return this;
}

Rest.prototype.setErrorHandler = function(errorHandler) {
  this.errorHandler = errorHandler;
  return this;
}

Rest.prototype.onExit = function(callback) {
  this._exitListeners.push(callback);
}

Rest.prototype.stop = function() {
  var self = this;
  this.server.close(function(){
    log.debug("Server stopped");
    self.running = false;

    log.debug("Running exit listeners");
    self._exitListeners.forEach(callback => {
      callback();
    });
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
Rest.prototype.patch = handlerFactory("patch");

Rest.prototype.remapErrors = function(callback) {
  this.errorMapping = _.assign(this.errorMapping, this.injector.exec(callback));
  return this;
}

Rest.prototype.injectorMiddleware = function(callback) {
  this.injectorMiddlewares.push(callback);
  return this;
}

Rest.prototype.getServerHandler = function() {
  var self = this;

  // const cookie_parser = cookieParser();
  const body_parser = bodyParser.json();

  return function(req, res) {
    new Promise((resolve, reject) => {
      body_parser(req, res, resolve)
    // }).then(() => {
    //   return new Promise((resolve, reject) => {
    //     body_parser(req, res, resolve)
    //   });
    }).then(() => {
      return self.requestRouter.findHandlerForRequest(req, res)
        // handler found
        // pathVarsMap - map of path variables to their values
        .then(async obj => {
          const handler = obj.handler;
          const pathVarsMap = obj.pathVarsMap;
          
          // predefined injected variables
          ['Cookies', 'Payload'].forEach(v => {
            if(! _.isUndefined(pathVarsMap[v])) {
              throw new Error(`${v} name cannot be used in path variables`);
            }
          });

          pathVarsMap['Cookies'] = new Cookies(cookie.parse(req.headers.cookie || ''), res);
          pathVarsMap['Payload'] = req.body;
          pathVarsMap['RemoteAddress'] = req.connection.remoteAddress;

          for(let i = 0; i < self.injectorMiddlewares.length; i++) {
            let newVarsMap = await self.injector.exec(self.injectorMiddlewares[i], pathVarsMap, true);
            _.assign(pathVarsMap, newVarsMap);
          }

          let result = self.injector.exec(handler.callback, pathVarsMap, true);
          
          return self.promiseResponse(
            result,
            self.injector.parseFunction(handler.callback).funcName
          ).then(function(response){
            access_log(`${req.method} ${req.url} = ${response.statusCode}`);
            response.write(res);
          });
        });
    })
    // handler not found or error
    .catch(function(error) {
      if(! error) {
        Write404(res);
      } else {
        let status = 500;
        if(error instanceof Error) {
          let mapping = self.errorMapping[error.constructor.name];
          // log(`mapping ${self.errorMapping}, ${error.constructor.name}`)
          if(mapping && error instanceof mapping.clazz) {
            status = mapping.status;
          }
        }

        if(status === 404) {
          Write404(res);
        } else if(status >= 400 && status < 500) {
          Write4xx(res, status, error.message);
          log.error(error);
        } else {
          Write500(res)
          log.error(error);
        }

        if(error instanceof Error) {
          self.errorHandler(error);
        }
      }
    });

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

function Write4xx(res, status, message) {
  res.writeHead(status);
  res.end(`${status} ${message}`);
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
        // log.debug("returnType = "+returnType);
        if(_.isInteger(returnValue)) {
          statusCode = returnValue;
          returnValue = '';
        }
      }

      var response;
      if(typeof returnValue !== 'undefined') {
        // wrapped response (e.g. file stream)
        if(result == null) {
          response = new Response('', contentType || "text/plain").setStatusCode(statusCode);
        }
        // else if(result.returnValue instanceof Response) {
        //   response = result.returnValue;
        // }
        else if(contentType === "application/json" && _.isString(returnValue)) {
          response = new Response(returnValue, contentType).setStatusCode(statusCode);
        }
        else if(_.isObject(returnValue)) {
          response = new Response(self.serializer(returnValue), contentType || "application/json").setStatusCode(statusCode);
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
