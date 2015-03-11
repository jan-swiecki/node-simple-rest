_ = require("lodash")
http = require("http")

var log = function(msg) {
  console.log("[LOG]", msg);
}

function Processor() {
  this.handlers = {};

}

Processor.prototype.addHandler = function(handler) {
  handler.method = handler.method.toLowerCase();

  this.handlers[handler.method] = this.handlers[handler.method] || {};
  //     handlers[handler.method][handler.path] = handlers[handler.method][handler.path] || {};
  this.handlers[handler.method][handler.path] = handler;
};

Processor.prototype.process = function(req, res) {


  log("Processing request "+req.method+" "+req.url);
  log("Handlers available "+JSON.stringify(this.handlers));

  var hs = this.handlers[req.method.toLowerCase()];

  if(! hs) {
    log("FAIL No handlers found for "+req.method);
    return false;
  } else {

    log("OK handlers found for "+req.method);

    var h = hs[req.url];

    if(! h) {
      log("FAIL No handler found for "+req.url);
      return false;
    } else {
      log("OK handler found for "+req.url);
      log("Executing handler");
      var body = h.execute(req, res);
      if(typeof body !== 'undefined') {
        res.end(body);
      }
    }

  }

}

function Rest(processor) {
  this.processor = processor;
}

Rest.prototype.get = function(path, callback){
  processor.addHandler({
    method: "get",
    path: path,
    execute: callback
  });

  return this;
};

Rest.prototype.process = function(req, res) {
  return this.processor.process(req,res);
}

var processor = new Processor();
var rest = new Rest(processor);

module.exports = rest;

http.createServer(function(req,res){

  if(! rest.process(req,res)) {
    res.writeHead(404);
    res.end("404 Not Found");
  }

}).listen(3000);
