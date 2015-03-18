_ = require("lodash")
http = require("http")
esprima = require("esprima");

NameUrlMatcher = require("./lib/NameUrlMatcher.js");
Processor = require("./lib/Processor.js");
Rest = require("./lib/Rest.js");

var log = function(msg) {
  console.log("[INDEX]", formatDate(new Date()), msg);
}

var urlMatcher = new NameUrlMatcher();
var processor = new Processor(urlMatcher);
var rest = new Rest(processor);

module.exports = rest;

http.createServer(function(req,res){

  if(! rest.process(req,res)) {
    res.writeHead(404);
    res.end("404 Not Found");
  }

}).listen(3000);
