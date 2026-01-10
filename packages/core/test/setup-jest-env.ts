import { setImmediate } from 'timers';

// atob
global.atob = require('atob');

global.setImmediate = setImmediate;
