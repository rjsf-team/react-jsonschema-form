const rewireBabelLoader = require("react-app-rewire-babel-loader");
const path = require('path')

module.exports = function override(config, env) {
    //do stuff with the webpack config...

    config = rewireBabelLoader.include(
        config,
        path.join(__dirname, "node_modules", "codemirror", "mode", "javascript"),
    );
    return config;
}