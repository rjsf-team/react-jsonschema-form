import '@testing-library/jest-dom';
import html from 'html';
import { setImmediate } from 'timers';

// atob
global.atob = require('atob');

// HTML debugging helper
global.d = function d(node) {
  console.log(html.prettyPrint(node.outerHTML, { indent_size: 2 }));
};

global.setImmediate = setImmediate;
