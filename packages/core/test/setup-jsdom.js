import { JSDOM } from 'jsdom';
import html from 'html';

// Setup the jsdom environment
// @see https://github.com/facebook/react/issues/5046
if (!('window' in global)) {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = window.document;
  global.window = window;
  global.navigator = global.window.navigator;
  global.File = global.window.File;
}

// atob
global.atob = require('atob');

// HTML debugging helper
global.d = function d(node) {
  console.log(html.prettyPrint(node.outerHTML, { indent_size: 2 }));
};
