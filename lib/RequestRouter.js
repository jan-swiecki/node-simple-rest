var log = require("./SimpleLogger.js").getLogger();
var _ = require("lodash");

function RequestRouter(urlMatcher) {
	this.handlers = {};
	this.urlMatcher = urlMatcher;
}

/**
 *
 * @param handler which is object with keys: method (http method), path (url path), execute (callback executor)
 */
RequestRouter.prototype.addHandler = function(handler) {
	handler.method = handler.method.toLowerCase();

	this.handlers[handler.method] = this.handlers[handler.method] || [];
	this.handlers[handler.method].push(handler);
};

RequestRouter.prototype.findHandlerForRequest = function(req, res) {
	var self = this;

	log("Processing request " + req.method + " " + req.url);
	log("Handlers available " + JSON.stringify(this.handlers));

	var handlers = this.handlers[req.method.toLowerCase()];

	return new Promise(function(resolve, reject){
		if (!handlers) {
			let errorMessage = `FAIL No handlers found for ${req.method}`;
			log(errorMessage);
			reject();
		} else {
			log("OK handlers found for " + req.method + ", hs=" + JSON.stringify(handlers));

			for(let i = 0; i < handlers.length; i++) {
				let handler = handlers[i];
				log("Matching " + handler.path + " vs " + req.url);
				let pathVarsMap = self.urlMatcher.match(handler.path, req.url)
				if(pathVarsMap) {
					log("OK handler found for " + req.url);
					log.trace("pathVarsMap = "+JSON.stringify(pathVarsMap));
					// resolve([handler, pathVarsMap]);
					return resolve({
						handler: handler,
						pathVarsMap: pathVarsMap
					});
					//handler.produceResponse(req, res, match.args, callback);
				};
			}

			// no error in reject means 404 error
			return reject();
		}
	});
};

module.exports = RequestRouter;
