Simple REST
===========

Prototype of simple REST framework.

Installation
------------



Usage
-----

```javascript
rest = require("./index.js");

// Example
// If you return response as string then response will have Content-Type: text/plain automatically.
rest.get("/test", function() {
  return "return text/plain string";
});

// Automatic variable name mapping
// e.g. requesting /test/a/b will make myVar1 = "b", myVar2 = "a"
rest.get("/test/:myVar2/:myVar1", function(myVar1, myVar2, myVar3) {
  return "Variable name injection";
});

// chaining
rest
  // if you return simple object then the response
  // will have Content-Type: application/json automatically
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
