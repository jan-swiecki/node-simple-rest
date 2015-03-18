rest = require("./index.js");

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
  });
