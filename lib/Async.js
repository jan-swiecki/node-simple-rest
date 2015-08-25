function AsyncWrapper() {
  this.promise = new Promise();
}

AsyncWrapper.prototype.injector = function(response) {
  this.promise.resolve(response);
}

module.exports = AsyncWrapper;
