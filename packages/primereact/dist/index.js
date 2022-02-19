
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./primereact.cjs.production.min.js')
} else {
  module.exports = require('./primereact.cjs.development.js')
}
