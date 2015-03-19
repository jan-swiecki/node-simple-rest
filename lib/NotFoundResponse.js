Response = require("./Response.js");

function NotFoundResponse() {
  NotFoundResponse.super_.call(this);
  this.body = "404 Not Found";
  this.statusCode = 404;
  this.contentType = "text/plain";
}

util.inherits(NotFoundResponse, Response);

NotFoundResponse.prototype.write = function(res) {
  NotFoundResponse.super_.prototype.write.call(this, res);
}

module.exports = NotFoundResponse;
