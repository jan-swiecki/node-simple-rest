var log = require("./SimpleLogger.js").getLogger();

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

RequestRouter.prototype.findHandlerForRequest = function(req, res, callback) {
	var self = this;

	log("Processing request " + req.method + " " + req.url);
	log("Handlers available " + JSON.stringify(this.handlers));

	var handlers = this.handlers[req.method.toLowerCase()];

	return new Promise(function(resolve, reject){
		if (!handlers) {
			log("FAIL No handlers found for " + req.method);
			reject();
		} else {
			//log("OK handlers found for " + req.method + ", hs=" + JSON.stringify(handlers));

			Promise.map(handlers, function(handler){
				log("Matching " + handler.path + " vs " + req.url);
				return self.urlMatcher.match(handler.path, req.url).then(function(pathVarsObj){
					log("OK handler found for " + req.url);
					resolve(handler, pathVarsObj);
					//handler.produceResponse(req, res, match.args, callback);
				});
			}).any().catch(function(){
				log("No handler found for " + req.url);
				reject();
			});
		}
	});
};

module.exports = RequestRouter;
