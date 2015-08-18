var log = require("./SimpleLogger.js").getLogger();

function Response(body, contentType) {
  this.body = body;
  this.statusCode = 200;
  this.contentType = contentType || "text/plain";
}

Response.prototype.setStatusCode = function(statusCode) {
  this.statusCode = statusCode;
  return this;
}

Response.prototype.setContentType = function(contentType) {
  this.contentType = contentType;
}

Response.prototype.setBody = function(body) {
  this.body = body;
  return this;
}

Response.prototype.write = function(res) {
  res.writeHead(this.statusCode, {
    "Content-Type": this.contentType || "text/plain"
  });

  if(typeof this.body !== 'undefined') {
    res.end(this.body);
  } else {
    log.error("Cannot respond with no body: "+this.body);
  }
}

module.exports = Response;
