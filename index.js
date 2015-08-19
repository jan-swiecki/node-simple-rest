var Autowire = require("./node-autowire");
var Promise = require("bluebird");

module.exports = Autowire(function(http, lodash, SimpleLogger, NameUrlMatcher, RequestRouter, Rest){
  var log = SimpleLogger.getLogger();

  var _ = lodash;

  var Injector = Autowire.Injector;

  var codeMutator = new Autowire.CodeMutator();
  var moduleFinder = new Autowire.ModuleFinder();
  var injector = new Injector(moduleFinder, codeMutator);

  var urlMatcher = new NameUrlMatcher();
  var requestRouter = new RequestRouter(urlMatcher);
  var rest = new Rest(requestRouter, injector);

  //var server = http.createServer(rest.getServerHandler()).listen(3000);

  rest.setServer(http.createServer(rest.getServerHandler()));
  //rest.start();

  return rest;
});