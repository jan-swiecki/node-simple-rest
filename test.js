rest = require("./index.js");

rest.get("/test", function(req,res) {
  console.log(req);

  return "yeah!";
});