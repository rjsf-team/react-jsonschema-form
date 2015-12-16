var jsdom = require("jsdom");

// Setup the jsdom environment
// @see https://github.com/facebook/react/issues/5046
global.document = jsdom.jsdom("<!doctype html><html><body></body></html>");
global.window = document.defaultView;
global.navigator = global.window.navigator;

// Setup dumb localStorage for tests
global.localStorage = (function() {
  var _state = {};
  return {
    getItem(key) {
      return _state.hasOwnProperty(key) ? _state[key] : undefined;
    },
    setItem(key, value) {
      _state[key] = value === null ? "null" : value; // that's the spec
    },
    removeItem(key) {
      delete _state[key];
    }
  };
})();
