module.exports = {
  plugins: [
    "@babel/plugin-transform-modules-commonjs"
  ],
  presets: [
    [
      "@babel/preset-env",
      {
        modules: "commonjs",
        targets: { node: "current" }
      },
    ],
    "@babel/preset-react",
  ]
}