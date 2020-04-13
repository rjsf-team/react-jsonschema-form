const {createJestConfig} = require('tsdx/dist/createJestConfig');
const {paths} = require('tsdx/dist/constants');

let config = createJestConfig(undefined, paths.appRoot);

config.globals = {
    "setupFiles": [
        "<rootDir>/setupTests.ts"
    ]
}

config = {
    ...config,
    "setupFiles": [
        "<rootDir>/setupTests.ts"
    ]
}

module.exports = config;