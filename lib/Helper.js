PATH = require("path");

var loggerNameSeparator = "_";

module.exports = {
  formatDate: function(date) {
    var str = date.toISOString().replace(/T/, " ");
    var ret = str.substring(0,str.length - 2);
    return "["+ret+"]";
  },
  getLogger: function() {
    var loggerName = PATH.parse(module.parent.id).base
      .replace(/\.[A-z]+$/, "")
      .replace(/([A-Z])/g, function(m, char) {
        return loggerNameSeparator+m;
      }).toUpperCase();

    if(loggerName[0] === loggerNameSeparator) {
      loggerName = loggerName.substr(1, loggerName.length - 1);
    }

    return function(msg) {
      console.log("["+loggerName+"]", module.exports.formatDate(new Date()), msg);
    }
  }
}
