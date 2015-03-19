function AsyncWrapper() {
  this.promise = new Promise();
}

AsyncWrapper.prototype.callback = function(response) {
  this.promise.resolve(response);
}

module.exports = AsyncWrapper;
