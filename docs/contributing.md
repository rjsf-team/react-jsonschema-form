# Contributing

## Development server

When developing, run the following from the root-level directory:

```bash
npm install
npm run build
npm start
```

All packages will be live-built, and a live development server showcasing components with hot reload enabled will then run at [localhost:8080](http://localhost:8080).

## Coding style

All the JavaScript code in this project conforms to the [prettier](https://github.com/prettier/prettier) coding style. Code is automatically prettified upon commit using precommit hooks.

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

Code coverage reports are currently available only for the `@rjsf/core` package. They are generated using [nyc](https://github.com/istanbuljs/nyc) each time the `npm test-coverage` script is run.
The full report can be seen by opening `./coverage/lcov-report/index.html`.


## Releasing

To release, go to the master branch and then run:

```bash
lerna version
```

Make sure you use [semver](https://semver.org/) for version numbering when selecting the version.
The command above will create a new version tag and push it to GitHub. Then, create a release in
the Github "Releases" tab and add a description of the changes in the new release.

This will trigger a GitHub Actions pipeline that will build and publish all packages to npm.

The package is published through an automation token belonging to the
[rjsf-bot](https://www.npmjs.com/~rjsf-bot) user on npm. This token
is stored as the `NPM_TOKEN` secret on GitHub Actions.

### Releasing docs

Docs are automatically released using [Read The Docs](https://readthedocs.org/) based on the latest commits from the `master` branch.

### Releasing the playground

In order to publish the latest playground to [https://rjsf-team.github.io/react-jsonschema-form/](https://rjsf-team.github.io/react-jsonschema-form/) after a new rjsf release, run:

```bash
cd packages/playground
npm run publish-to-gh-pages
```
