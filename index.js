var Autowire;

if(process.env.LOCAL_DEV) {
  Autowire = require("./node-autowire");
} else {
  Autowire = require("autowire");
}

Autowire.alias("Promise", "bluebird");
Autowire.alias("_", "lodash");

module.exports = Autowire(function(http, _, SimpleLogger, NameUrlMatcher, RequestRouter, Rest){
  var log = SimpleLogger.getLogger();

  var injector = Autowire.getNewDependencies().injector;

  var urlMatcher = new NameUrlMatcher();
  var requestRouter = new RequestRouter(urlMatcher);
  var rest = new Rest(requestRouter, injector);

  //var server = http.createServer(rest.getServerHandler()).listen(3000);

  rest.setServer(http.createServer(rest.getServerHandler()));
  //rest.start();

  return rest;
});