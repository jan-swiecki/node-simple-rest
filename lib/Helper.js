module.exports = {
  formatDate: function(date) {
    var str = date.toISOString().replace(/T/, " ");
    var ret = str.substring(0,str.length - 2);
    return "["+ret+"]";
  }
}
