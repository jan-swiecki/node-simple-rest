var Autowire = require("./node-autowire");
var Promise = require("bluebird");

module.exports = Autowire(function(http, lodash, SimpleLogger, NameUrlMatcher, RequestRouter, Rest){
  var log = SimpleLogger.getLogger();

  var _ = lodash;

  var Injector = Autowire.Injector;

  var urlMatcher = new NameUrlMatcher();
  var requestRouter = new RequestRouter(urlMatcher);
  var injector = new Injector();
  var rest = new Rest(requestRouter, injector);

  http.createServer(rest.getServerHandler()).listen(3000);

  return rest;
});