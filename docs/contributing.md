# Contributing

## Development server

When developing, run the following from the root-level directory:

```bash
npm install
npm run build
npm start
```

All packages will be live-built, and a live development server showcasing components with hot reload enabled will then run at [localhost:8080](http://localhost:8080).

### First time step

If this is the first time you have cloned the repo, run the `npm run prepare` script that will set up `husky` to provide a git precommit hook that will format and lint any code you have added to a PR.

### Optional development process
With the large number of packages, sometimes running `npm run build` or `npm start` from the root directory will overwhelm an underpowered computer.
If that is the situation for you, you can instead use `npm run build-serial` to build the packages one at a time instead of all at once.
Also, if you are only working on one package, you can `npm run build` and `npm run test` from within the subdirectory.
Finally, you can simply `npm start` inside of the `playground` directory to test changes if you have already built all of your packages, without needing to watch all of the packages via the root directory `npm start`.

## Cloud builds

When building in environments with limited memory, such as Netlify, it's recommended to use `npm run build-serial` that builds the packages serially. 

## Coding style

All the JavaScript/Typescript code in this project conforms to the [prettier](https://github.com/prettier/prettier) coding style.
Code is automatically prettified upon commit using precommit hooks, assuming you followed the `First time step` above.

## Documentation

We use [mkdocs](https://www.mkdocs.org/) to build our documentation. To run documentation locally, run:

```bash
pip install -r requirements.docs.txt
mkdocs serve
```

Documentation will be served on [localhost:8000](http://localhost:8000).

## Tests

```bash
npm test
```

### Code coverage

Code coverage reports are currently available only for the `@rjsf/core` theme package.
They are generated using [nyc](https://github.com/istanbuljs/nyc) each time the `npm test-coverage` script is run.
The full report can be seen by opening `./coverage/lcov-report/index.html`.

#### Utils and validator-ajvX code coverage

100% code coverage is required by the `@rjsf/utils` and `@rjsf/validator-ajv6` and `@rjsf/validator-ajv8` tests.
If you make changes to those libraries, you will have to maintain that coverage, otherwise the tests will fail.

## Releasing

To release, go to the main branch and then create a new branch with the version number (with an `rc` prefix instead of `v`):

```bash
git checkout -b rc5.0.1
git push
npx lerna version
```

Make sure you use [semver](https://semver.org/) for version numbering when selecting the version.
The command above will create a new version tag and push it to GitHub.

Note that if you are releasing a new major version, you should bump the peer dependency `@rjsf/core` in the `package.json` files of other packages accordingly.

Then, make a PR to main. Merge the PR into main -- make sure you use "merge commit", not squash and merge, so that
the original commit where the tag was based on is still present in the main branch.

Then, create a release in the Github "Releases" tab, select the new tag that you have added,
and add a description of the changes in the new release. You can copy
the latest changelog entry in `CHANGELOG.md` to make the release notes, and update as necessary.

This will trigger a GitHub Actions pipeline that will build and publish all packages to npm.

The package is published through an automation token belonging to the
[rjsf-bot](https://www.npmjs.com/~rjsf-bot) user on npm. This token
is stored as the `NPM_TOKEN` secret on GitHub Actions.

### Releasing docs

Docs are automatically published using [Read The Docs](https://readthedocs.org/) upon a new Release.

You can also publish the latest release of the docs by running the [Release Latest Documentation](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow#running-a-workflow) workflow on GitHub Actions.

### Releasing the playground

The playground automatically gets deployed from GitHub Pages.

If you need to manually publish the latest playground to [https://rjsf-team.github.io/react-jsonschema-form/](https://rjsf-team.github.io/react-jsonschema-form/), though, run:

```bash
cd packages/playground
npm run publish-to-gh-pages
```
