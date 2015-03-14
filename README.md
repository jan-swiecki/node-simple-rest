Simple REST
===========

Prototype of simple REST framework.

Usage:

```javascript
rest = require("./index.js");

// Example
// If you return string response gets Content-Type: text/plain automatically.
rest.get("/test", function() {
  return "return text/plain string";
});

// Automatic variable name mapping
// e.g. /test/a/b will put "a" in myVar2, and "b" in myVar1
rest.get("/test/:myVar2/:myVar1", function(myVar1, myVar2, myVar3) {
  return "Variable name injection";
});

// chaining
rest
  // if you return simple object response
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
    return "why";
  });
```
