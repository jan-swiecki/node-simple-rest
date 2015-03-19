PATH = require("path");
fs = require("fs");
FileResponse = require("./FileResponse");
Response = require("./Response");

function File(path) {
   var absPath = PATH.resolve(path);
   var resp = new FileResponse(absPath);
   return resp;
}

module.exports = File;
