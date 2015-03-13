rest = require("./index.js");

rest.get("/test", function() {
  return "yeah1!";
});

rest.get("/test/:myVar", function(myVar) {
  console.log("!!! myVar =", myVar);
  return "myVar = "+myVar;
});
