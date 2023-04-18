const fs = require('fs');
const path = require('path');

// Since this file is in the `scripts` directory, the root dir of the repo is up one level
const utilsPackage = path.resolve(__dirname, '../packages/utils/package.json');

// Read the file and parse it into a json object and find the version tag
const packageJson = fs.readFileSync(utilsPackage);
const packageObject = JSON.parse(packageJson);

const { version } = packageObject;

// Write the version, prefixed by the `v` used by lerna to the standard out so it can be used externally
process.stdout.write(`v${version}`);
