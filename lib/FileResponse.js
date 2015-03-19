util = require("util");
mime = require("mime");
fs = require("fs");
PATH = require("path");
NotFoundResponse = require("./NotFoundResponse.js");
var log = require("./SimpleLogger.js").getLogger();

Response = require("./Response.js");

function FileResponse(absPath) {
  FileResponse.super_.call(this);
  this.absPath = absPath;
}

util.inherits(FileResponse, Response);

FileResponse.prototype.write = function(res) {
  var self = this;
  fs.exists(this.absPath, function(exists) {
    if(exists) {
      var filename = PATH.basename(self.absPath);
      self.contentType = self.contentType || mime.lookup(self.absPath);

       res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
       res.setHeader('Content-Type', self.contentType);

      var filestream = fs.createReadStream(self.absPath);
      filestream.pipe(res);
    } else {
      new NotFoundResponse().write(res);
    }
  });
}

module.exports = FileResponse;
