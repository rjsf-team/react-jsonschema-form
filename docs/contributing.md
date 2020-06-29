# Contributing

## Development server

When developing, run the following from the root-level directory:

```bash
npm install
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

To release, create a new release branch:

```bash
git checkout -b bump-2.2
lerna version --no-push
# Also change the version on the root-level package.json and package-lock.json (this is not automatically done by Lerna)
npx conventional-changelog --release-count 0 --outfile ./CHANGELOG.md --verbose
npx lerna exec --concurrency 1 --stream -- 'conventional-changelog --release-count 0 --commit-path $PWD --pkg $PWD/package.json --outfile $PWD/CHANGELOG.md --verbose'
git push --tags origin bump-2.2
```

Make sure you use [semver](https://semver.org/) for version numbering. For more info on conventional-changelog and Lerna, see [this link](https://github.com/lerna/lerna/tree/master/commands/version#generating-initial-changelogs).

Once the PR has been approved and merged into master, create a release in the Github "Releases" tab and add the latest version to it. You can use the latest changelog info from conventional-changelog as a guideline. Then publish to npm:

```bash
git checkout master
git pull origin master
lerna run build
lerna publish from-git
```

### Releasing docs

Docs are automatically released using [Read The Docs](https://readthedocs.org/) based on the latest commits from the `master` branch.

### Releasing the playground

In order to publish the latest playground to [https://rjsf-team.github.io/react-jsonschema-form/](https://rjsf-team.github.io/react-jsonschema-form/) after a new rjsf release, run:

```bash
cd packages/playground
npm run publish-to-gh-pages
```
