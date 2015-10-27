var Asteroid = require('asteroid/dist/asteroid.browser.js');

var AsteroidBackend = function(endpoint) {
  console.log(endpoint);
  this.ddpClient = new Asteroid(endpoint);
};

AsteroidBackend.prototype.login = function(username, password) {
  console.log("login");

  return this.ddpClient.loginWithPassword(username, password).timeout(30000).fail(function(x) {
    console.error(x);
  });
};

AsteroidBackend.prototype.subscribe = function(bundleId, onData) {
  console.log("subscribe");
  var self = this;
  return this.ddpClient.subscribe("api/v1/translations", bundleId).ready.then(function () {
    var translations = self.ddpClient.getCollection("translations");
    var query = translations.reactiveQuery({});
    query.on("change", onData);
  });
};

AsteroidBackend.prototype.fetch = function(bundleId, useLatestVersion) {
  return this.ddpClient.call("bundle/download", bundleId, useLatestVersion).result;
};

var TwineClient = function(options) {
  this.options = options;
  this.backend = AsteroidBackend;
};

TwineClient.prototype.connect = function() {
  var self = this;
  var opt = this.options;
  var ddpClient = new this.backend(opt.endpoint);

  var onError = function(error) {
    console.log("onError");
    if (self.errorCallback) {
      self.errorCallback(error);
    }
  };

  var onDataReceived = function(data) {
    console.log("onDataReceived");
    if (self.changeCallback) {
      self.changeCallback(data);
    }
  };

  var fetchInitialData = function() {
    console.log("fetchInitialData");
    return ddpClient.fetch(opt.bundleId, opt.useLatestVersion);
  };

  var subscribe = function() {
    console.log("subscribe");
    return ddpClient.subscribe(opt.bundleId, onDataReceived);
  };

  return ddpClient.login(opt.username, opt.password)
    .then(fetchInitialData)
    .then(onDataReceived)
    .then(subscribe)
    .fail(onError);
}

TwineClient.prototype.onError = function(cb) {
  this.errorCallback = cb;
};

TwineClient.prototype.onChange = function(cb) {
  this.changeCallback = cb;
};

module.exports = TwineClient;
