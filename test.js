rest = require("./index.js");

rest.get("/test", function() {
  return "yeah1!";
});

rest.get("/test/:myVar1", function(myVar1, myVar2, myVar3) {
  console.log("!!! myVar =", myVar1);
  return "myVar = "+myVar1;
});

rest.get("/test/:myVar1/:myVar2", function(myVar1, myVar2, myVar3) {
  console.log("!!! myVar =", myVar1, myVar2);
  return ":)";
});
