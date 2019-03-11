var debug = require('debug');
var PATH = require("path");
var stackTrace = require('stack-trace');

var loggerNameSeparator = "_";

var levelToCode = ["", "FATAL", "ERROR", "WARNING", "INFO", "DEBUG", "TRACE"]

function SimpleLogger() {
  this.date = false;
  this.level = 0;
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

SimpleLogger.prototype.getLogger = function(name) {
  var loggerName;

  if(name) {
    loggerName = name;
  } else {
    var parentFilename = stackTrace.get()[1].getFileName();
  
    var loggerName = PATH.parse(parentFilename).base
      .replace(/\.[A-Za-z0-9]+$/, "")
      // .replace(/([A-Z])/g, function(m, char) {
      //   return loggerNameSeparator+m;
      // }).toUpperCase();
      .toLowerCase();
  
    if(loggerName[0] === loggerNameSeparator) {
      loggerName = loggerName.substr(1, loggerName.length - 1);
    }
  }

  var d = debug('simplerest:'+loggerName);

  var self = this;
  function log(message, level) {
    var msg = [];

    level = level || 0;

    if(level < self.level) {
      return false;
    }

    if(level === 0) {
      // msg.push("["+loggerName+"]");
    } else if(level === 1 || level === 2 || level === 3) {
      msg.push("["+levelToCode[level]+"]");
      if(message instanceof Error) {
        message = message.toString()+"\n"+message.stack;
      }
    } else {
      msg.push("["+levelToCode[level]+"]");
    }

    if(self.date) {
      msg.push(self.formatDate(new Date()));
    }

    msg.push(message);

    // process.stdout.write(msg.join(" ")+"\n");
    d(msg.join(' '));
  }

  // TODO: do this with meta programming/code mutation
  log.fatal = function(message) {
    log(message, 1);
  }

  log.error = function(message, error) {
    if(error && error instanceof Error) {
      message += " "+error.message+"\n"+error.stack;
    }
    log(message, 2);
  }

  log.warn = function(message) {
    log(message, 3);
  }

  log.info = function(message) {
    log(message, 4);
  }

  log.debug = function(message) {
    log(message, 5);
  }

  log.trace = function(message) {
    log(message, 6);
  }

  return log;
}

module.exports = new SimpleLogger();