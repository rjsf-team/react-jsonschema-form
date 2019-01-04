const path = require("path");
const express = require("express");
const webpack = require("webpack");

const server = process.env.RJSF_DEV_SERVER || "localhost:8080";
const splitServer = server.split(":");
const host = splitServer[0];
const port = splitServer[1];
const env = "dev";

const webpackConfig = require("./webpack.config." + env);
const compiler = webpack(webpackConfig);
const app = express();

app.use(require("webpack-dev-middleware")(compiler, {
  publicPath: webpackConfig.output.publicPath,
  noInfo: true
}));

app.use(require("webpack-hot-middleware")(compiler));

app.get("/favicon.ico", function(req, res) {
  res.status(204).end();
});

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "playground", "index.html"));
});

app.listen(port, host, function(err) {
  if (err) {
    console.log(err);
    return;
  }

  console.log(`Listening at http://${server}`);
});
