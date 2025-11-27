import html from 'html';
import { setImmediate } from 'timers';

// atob
global.atob = require('atob');

// HTML debugging helper
// @ts-expect-error TS7017 because we are avoiding an implicit any
global.d = function d(node: any) {
  console.log(html.prettyPrint(node.outerHTML, { indent_size: 2 }));
};

global.setImmediate = setImmediate;
