PATH = require("path");
stackTrace = require('stack-trace');

var loggerNameSeparator = "_";

function SimpleLogger() {
  this.date = true;
}

SimpleLogger.prototype.noDate = function() {
  this.date = false;
  require.cache[module.id].exports = this;
  return this;
}

SimpleLogger.prototype.formatDate = function(date) {
  var str = date.toISOString().replace(/T/, " ");
  var ret = str.substring(0,str.length - 2);
  return "["+ret+"]";
}

SimpleLogger.prototype.getLogger = function() {

  var parentFilename = stackTrace.get()[1].getFileName();

  var loggerName = PATH.parse(parentFilename).base
    .replace(/\.[A-z]+$/, "")
    .replace(/([A-Z])/g, function(m, char) {
      return loggerNameSeparator+m;
    }).toUpperCase();

  if(loggerName[0] === loggerNameSeparator) {
    loggerName = loggerName.substr(1, loggerName.length - 1);
  }

  var self = this;
  return function(msg) {
    if(self.date) {
      console.log("["+loggerName+"]", msg);
    } else {
      console.log("["+loggerName+"]", self.formatDate(new Date()), msg);
    }
  }
}

module.exports = new SimpleLogger();

