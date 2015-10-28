var Q = require('q');
var TwineClient = require('../src/client');

describe("Package Configuration:", function () {

  var backend;
  var client;
  var settings = {
    fakeServerEvent: null,
    failToConnect: false,
    serverData: {projectId: "MyProject"}
  };

  beforeEach(function() {

    settings.fakeServerEvent = null;
    settings.failToConnect = false;
    settings.serverData = {projectId: "MyProject"};

    client = new TwineClient({endpoint: 'localhost:3000', username: 'username', password: 'password', bundleId: 'bundleId', useLatestVersion: true});

    backend = {
      validUsername: "username",
      validPassword: "password",
      postChange: function(data) {
        settings.serverData = data;
        settings.fakeServerEvent();
      },
      login: function(username, password) {
        if (username === this.validUsername && password === this.validPassword) {
          return Q.when();
        }
        else {
          return Q.reject({message: "login failed"});
        }
      },
      subscribe: function(bundleId, onData) {
        settings.fakeServerEvent = onData;
        if (!settings.failToConnect) {
            return Q.when();
        }
        else {
          return Q.reject({message: "subscription failed"});
        }
      },
      fetch: function(bundleId, useLatestVersion, onDataReceived) {
        return Q.when(settings.serverData).then(function(data) {
          onDataReceived(data);
          return data;
        });;
      }
    };

    client.backend = function() {
      return backend;
    }
  });

  it("calls onError if a subscription fails", function (done) {
    settings.failToConnect = true;

    client.onError(function(error) {
      expect(error.message).toMatch(/subscription/);
      done();
    });

    client.connect();
  });

  it("calls onChange with the initial data, after connecting", function(done) {
    client.onChange(function(data) {
      expect(data).toEqual({"projectId": "MyProject"});
      done();
    });
    client.connect();
  });

  it("calls onChange with any subsequent changes", function(done) {

    var spy = jasmine.createSpy();
    client.onChange(spy);

    // Important that we connect before.
    client.connect().then(function() {
      // Fake an update from the server.
      backend.postChange({"projectId": "UpdatedId"});
    });

    setTimeout(function(){
      expect(spy.calls.count()).toEqual(2);
      expect(spy.calls.argsFor(0)).toEqual([{"projectId": "MyProject"}]);
      expect(spy.calls.argsFor(1)).toEqual([{"projectId": "UpdatedId"}]);
      done();
    }, 0);
  });

  it("calls onError if login fails", function(done) {
    backend.validUsername = "foo";
    backend.validPassword = "bar";

    client.onError(function(error) {
      expect(error.message).toMatch(/login/);
      done();
    });

    client.connect();
  });
});
