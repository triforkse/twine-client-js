var Asteroid = require('asteroid/dist/asteroid.browser.js');

var AsteroidBackend = function(endpoint) {
  console.log(endpoint);
  this.ddpClient = new Asteroid(endpoint, true);
};

AsteroidBackend.prototype.login = function(username, password) {
  console.log("login");

  return this.ddpClient.loginWithPassword(username, password).timeout(30000).fail(function(x) {
    console.error(x);
  });
};

AsteroidBackend.prototype.subscribe = function(bundleId, triggerFetch) {
  console.log("subscribe");
  var self = this;
  return this.ddpClient.subscribe("api/v1/translations", bundleId).ready.then(function () {
    var translations = self.ddpClient.getCollection("translations");
    var query = translations.reactiveQuery({});
    query.on("change", function(_data) {
      console.log("CHANGE");
      triggerFetch();
    });
  });
};

AsteroidBackend.prototype.fetch = function(bundleId, useLatestVersion, onDataReceived) {
  return this.ddpClient.call("bundle/download", bundleId, useLatestVersion).result.then(function(data) {
    onDataReceived(data);
    return data;
  });
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
    if (self.changeCallback) {
      console.log("onDataReceived", data);
      self.changeCallback(data);
    }
  };

  var triggerFetchData = function() {
    console.log("fetchInitialData");
    return ddpClient.fetch(opt.bundleId, opt.useLatestVersion, onDataReceived);
  };

  var subscribe = function() {
    console.log("subscribe");
    return ddpClient.subscribe(opt.bundleId, triggerFetchData);
  };

  return ddpClient.login(opt.username, opt.password)
    .then(triggerFetchData)
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
