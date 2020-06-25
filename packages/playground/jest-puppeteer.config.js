module.exports = {
  server: {
    // In CI mode, run from built production version instead of the dev version.
    command: "serve -l 8080",
    port: 8080,
    usedPortAction: "kill"
  },
  chromiumFlags: ['--font-render-hinting=none', '--enable-font-antialiasing']
};
