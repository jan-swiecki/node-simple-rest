_ = require("lodash")
http = require("http")

require("./lib/SimpleLogger.js").noDate();

var log = require("./lib/SimpleLogger.js").getLogger();

NameUrlMatcher = require("./lib/NameUrlMatcher.js");
Processor = require("./lib/Processor.js");
Rest = require("./lib/Rest.js");
Injector = require("./lib/Injector.js");

var urlMatcher = new NameUrlMatcher();
var processor = new Processor(urlMatcher);
var injector = new Injector();
var rest = new Rest(processor, injector);

module.exports = rest;

http.createServer(function(req,res){

  if(! rest.process(req,res)) {
    res.writeHead(404);
    res.end("404 Not Found");
  }

}).listen(3000);
