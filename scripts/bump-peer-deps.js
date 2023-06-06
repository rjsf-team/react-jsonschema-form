const fs = require('fs');
const path = require('path');
const os = require('os');
const lodash = require('lodash');

const { forEach } = lodash;

// Regex to find the major and minor versions of dependency
const MAJOR_MINOR_REGEX = /^\^(\d+.\d+).\d+$/;

// Since this file is in the `scripts` directory, the root dir of the repo is up one level
const rootDir = path.resolve(__dirname, '../');
// Read all the packages directory names
const dirs = fs.readdirSync(path.resolve(rootDir, 'packages'));
dirs.forEach((dir) => {
  // Get the name of each of the package.json files from the directory
  const fileName = path.resolve(rootDir, `packages/${dir}/package.json`);
  console.log(`Processing ${fileName}...`);
  // Read the file and parse it into a json object and find the dev and peer dependencies
  const packageJson = fs.readFileSync(fileName);
  const packageObject = JSON.parse(packageJson);
  const peerDeps = packageObject.peerDependencies;
  const devDeps = packageObject.devDependencies;
  // For each of the peer dependencies, we go looking for any that start with `@rjsf/`
  forEach(peerDeps, (value, key) => {
    if (key.startsWith('@rjsf/')) {
      // Due to an [odd bug](https://github.com/npm/cli/issues/3847) with npm we can't just set the peer dependency to
      // the same value as the devDependency, so instead we extract out the major.minor versions
      const majorMinorMatch = devDeps[key].match(MAJOR_MINOR_REGEX);
      if (!majorMinorMatch) {
        console.log(`Can't find major.minor version in ${devDeps[key]} for ${key}`);
        process.exit(1);
      }
      // To work around the bug, instead of using the `^Major.minor.patch` from the devDependency we use a different but
      // similar notation that does not cause problems with npm: `Major.minor.x`
      // We do this because it is possible that minor versions can add functionality that does not exist in an earlier
      // version that other packages may depend on (patch versions should never do this). For example:
      //
      // A new API is added in `@rjsf/utils@5.4.0` that is used by `@rjsf/core@5.4.0`. If someone were to only update
      // `@rjsf/core` to 5.4.0 but keep using `@rjsf/utils@5.3.0` then we will have a problem. By bumping the
      // peerDependencies to `5.4.x` we support any patch versions of `5.4` but will prevent the user from forgetting to
      // bump `@rjsf/utils` to 5.4
      //
      peerDeps[key] = `^${majorMinorMatch[1]}.x`;
    }
  });
  // Now write the package.json file with the update packageObject, maintaining the 2 character spacing and remembering
  // to add the OS end of line character
  fs.writeFileSync(fileName, JSON.stringify(packageObject, null, 2) + os.EOL, function handleError(err) {
    if (err) return console.log(err);
    console.log(`Writing peerDep changes to ${fileName}`);
  })
});
