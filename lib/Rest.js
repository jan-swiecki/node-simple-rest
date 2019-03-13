var Response = require("./Response.js");
var Helper = require("./Helper.js");
var Cookies = require("./Cookies.js");
var _ = require("lodash");
var bodyParser = require("body-parser");
var cookie = require('cookie');
var JSON_prune = require('./JSON.prune')
var log = require("./SimpleLogger.js").getLogger();
var access_log = require('./access_log.js');

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
  this.jsonErrors = false;

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

Rest.prototype.setJsonErrors = function(jsonErrors) {
  this.jsonErrors = jsonErrors;
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
      access_log(req, res);
      const end = res.end.bind(res);
      res.end = (data) => {
        if(_.isString(data) || !data) {
          access_log(req, res, data, true);
        } else {
          access_log(req, res, '<Buffer>', true);
        }

        end(data);
      };

      return self.requestRouter.findHandlerForRequest(req, res)
        // handler found
        // pathVarsMap - map of path variables to their values
        .then(async obj => {
          const handler = obj.handler;
          const pathVarsMap = obj.pathVarsMap;
          
          // predefined injected variables
          ['Cookies', 'Payload', 'req'].forEach(v => {
            if(! _.isUndefined(pathVarsMap[v])) {
              throw new Error(`${v} name cannot be used in path variables`);
            }
          });

          pathVarsMap['Cookies'] = new Cookies(cookie.parse(req.headers.cookie || ''), res);
          pathVarsMap['Payload'] = req.body;
          pathVarsMap['RemoteAddress'] = req.connection.remoteAddress;
          pathVarsMap['req'] = req;

          for(let i = 0; i < self.injectorMiddlewares.length; i++) {
            let newVarsMap = await self.injector.exec(self.injectorMiddlewares[i], pathVarsMap, true);
            _.assign(pathVarsMap, newVarsMap);
          }

          let result = self.injector.exec(handler.callback, pathVarsMap, true);
          
          return self.promiseResponse(
            result,
            self.injector.parseFunction(handler.callback).funcName
          ).then(function(response){
            response.write(res);
            // access_log(req, res);
          });
        });
    })
    // handler not found or error
    .catch(function(error) {
      if(! error) {
        self.Write404(res);
      } else {
        let status = 500;
        if(error instanceof Error) {
          let mapping = self.errorMapping[error.constructor.name];
          // log(`mapping ${self.errorMapping}, ${error.constructor.name}`)
          if(mapping && error instanceof mapping.clazz) {
            status = mapping.status;
          }
        }

        if(error instanceof Error) {
          try {
            self.errorHandler(error);
          } catch(err) {
            log.error('errorHandler error');
            log.error(err);
            self.Write500(res);
            return;
          }
        }

        if(status === 404) {
          self.Write404(res, error);
        } else if(status >= 400 && status < 500) {
          self.WriteXxx(res, status, error);
          log.error(error);
        } else {
          self.WriteXxx(res, 500, error);
          log.error(error);
        }
      }
    });

  };
};

Rest.prototype.Write404 = function Write404(res, error) {
  error = error || {};
  error.message = error.message || "Not Found";
  return this.WriteXxx(res, 404, error);
}

Rest.prototype.Write500 = function Write500(res, error) {
  error.message = error.message || "Internal Server Error";
  return this.WriteXxx(res, 500, error);
}

Rest.prototype.WriteXxx = function WriteXxx(res, status, error) {
  let end;
  if(this.jsonErrors) {
    end = {
      status: status,
    };
    if(error) {
      end.message = error.message;
      if(error.uniqId) {
        end.uniqId = error.uniqId;
      }
    }
    end = JSON.stringify(end, undefined, 2);
  } else {
    end = `${status} ${error.message}`;
  }
  res.writeHead(status);
  res.end(end);
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
