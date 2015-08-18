require("./index.js").then(function(rest){
  var log = require("./lib/SimpleLogger.js").getLogger();

  // Example
  // If you return string response gets Content-Type: text/plain automatically.
  rest.get("/test", function() {
    return "return text/plain string";
  });

  // Automatic variable name mapping (order of arguments in function doesn't matter)
  // e.g. /user/1/name --> 1, name
  rest.get("/user/:userId/:userProperty", function(userProperty, userId) {
    return userId+", "+userProperty;
  });

  // chaining
  rest
      // if you return simple object then the response
      // has Content-Type: application/json automatically
      .get("/object", function () {
        return {msg: "return as application/json"};
      })

      // automatic setting Content-Type via function name
      .get("/pdf", function asApplicationPdf() {
        return {msg: "return as application/pdf"};
      })

      // POST
      .post("/post", function asNonExistent() {
        return "why"; // Content-Type: non-existent
      })

      // file download? no problem!
      .get("/file", function(File) {
        return File("package.json");
      })

      // auto-wire core module? not a problem!
      .delete("/file/:name", function returnsStatusCode(fs, name) {
        if(! fs.existsSync(name)) {
          return 404;
        } else {
          fs.unlinkSync(name);
          return 200;
        }
      })

      // DEPRECATED:
      // asynchronous version of above
      // Note: if Async is injected then framework automatically assumes
      //       asynchronous callback will be called and ignores return
      //       value of handler.
      .delete("/fileAsyncOld/:name", function returnsStatusCode(fs, name, Async) {
        fs.exists(name, function(exists) {

          setTimeout(function(){
            log("Unlink "+name);
            if(! exists) {
              Async(404);
            } else {
              fs.unlinkSync(name);
              Async(200);
            }
          }, 1000);

        });
      })

      // asynchronous version of above
      // Note: if Async is injected then framework automatically assumes
      //       asynchronous callback will be called and ignores return
      //       value of handler.
      .delete("/fileAsync/:name", function returnsStatusCode(fs, name) {
        return new Promise(function(resolve, reject){
          fs.exists(name, function(exists) {

            setTimeout(function(){
              log("Unlink "+name);
              if(! exists) {
                reject(404);
              } else {
                fs.unlinkSync(name);
                resolve(200);
              }
            }, 1000);

          });
        });
      });

});
