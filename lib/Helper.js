module.exports = {
  formatDate: function(date) {
    var str = date.toISOString().replace(/T/, " ");
    var ret = str.substring(0,str.length - 2);
    return "["+ret+"]";
  },
  callbackNameToContentType: function(name) {
    if(name.match(/^as/)) {

      name = name.substring(2, name.length);
      name = name[0].toLowerCase() + name.substring(1, name.length);
      name = name.replace(/([A-Z])/g, function(match, x) {
        return "/"+x.toLowerCase();
      });

      return name;
    } else {
      return null;
    }
  },
  callbackNameToReturnType: function(name) {
    let m = name.match(/returns(.*?)$/i);
    if(m) {
      name = m[1]
      name = name[0].toLowerCase() + name.substring(1, name.length);
      return name;
    } else {
      return null;
    }
  }
};
