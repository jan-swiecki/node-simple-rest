rest = require("./index.js");

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

  // auto-wire core modules? not a problem!
  // Note: function name returnsStatusCode makes return value a statusCode of response
  .delete("/file/:name", function returnsStatusCode(fs, name) {
    if(! fs.existsSync(name)) {
      return 404; // 404 Not Found
    } else {
      fs.unlinkSync(name);
      return 200; // 200 OK
    }
  })

  // combine two function name functionalities
  .get("/combine", function returnsStatusCodeAsApplicationJson(fs, name) {
    return 401;
  })


  .delete("/file_smart/:name", function returnsStatusCode(fs, name) {

  });


