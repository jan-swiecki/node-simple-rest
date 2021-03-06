Simple REST
===========

Simple REST framework.

This is alpha version, API may change drastically with major versions. Performance is probably bad.

Installation
------------

    npm install simple-rest

Usage
-----

```javascript
rest = require("simple-rest");

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

  // asynchronous version of above
  // Note: if Promise is returned then framework automatically assumes
  //       asynchronous result and unpacks promise asynchronously.
  .delete("/fileAsync/:name", function returnsStatusCode(fs, name) {
    return new Promise(function(resolve, reject){
      fs.exists(name, function(exists) {

        setTimeout(function(){
          if(! exists) {
              resolve(404);
          } else {
              fs.unlinkSync(name);
              resolve(200);
          }
        }, 1000);

      });
    });
  });
```
