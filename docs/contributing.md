## Contributing

### Development server

When developing a package, to run the playground with your latest changes, cd to the package directory and then run `npm start`. For example, to run the playground, run:

```bash
cd packages/core
npm install
npm start
```

A live development server showcasing components with hot reload enabled will then run at [localhost:8080](http://localhost:8080).

### Coding style

All the JavaScript code in this project conforms to the [prettier](https://github.com/prettier/prettier) coding style. Code is automatically prettified upon commit using precommit hooks.

### Documentation

We use [mkdocs](https://www.mkdocs.org/) to build our documentation. To run documentation locally, run:

```bash
pip install mkdocs==1.0.4
mkdocs serve
```

Documentation will be served on [localhost:8000](http://localhost:8000).

### Tests

```bash
npm test
```

#### Code coverage

Code coverage reports are currently available only for the `@rjsf/core` package. They are generated using [nyc](https://github.com/istanbuljs/nyc) each time the `npm test-coverage` script is run.
The full report can be seen by opening `./coverage/lcov-report/index.html`.

### Notes on the local playground

The playground located in `packages/playground` contains code that is published as the `@rjsf/playground` package. This package is used by the local playgrounds in packages such as `packages/core`, so that when you run `npm start` from `packages/core`, it will run the playground component from `@rjsf/playground` but with the local changes to react-jsonschema-form.

Note that when doing local development in a package such as `packages/core`, making changes to `packages/playground` will not affect the local playground that is run from `packages/core`. This should be fine in most cases for development, unless you need to update and test the default playground examples. In this case, you could use `npm link` to use the latest changes both from the playground and your package. As an example, to do this when developing locally on `packages/core`, you can run:

```bash
cd packages/playground
npm run build:lib
npm link
cd ../core
npm link @rjsf/playground
npm start
```

After the above is run, you will have a playground that has both your local changes to `packages/core` and `packages/playground`. Note that while the `packages/core` changes will live reload, the `packages/playground` changes will not -- you will need to run `npm run build:lib` from `packages/playground` each time you update a playground example.

### Releasing

To release, run:

```bash
lerna version
lerna publish
git push --tags origin master
```

Make sure you use [semver](https://semver.org/) for version numbering. Once a new version has been released, create a release in the Github "Releases" tab and add the version history.

#### Releasing docs

Docs are automatically released using [Read The Docs](https://readthedocs.org/) based on the latest commits from the `master` branch.

#### Releasing the playground

Note that publishing the `@rjsf/playground` package will update the version of the playground used in the local development playgrounds for packages such as `@rjsf/core`, etc. However, in order to publish the latest playground to [https://rjsf-team.github.io/react-jsonschema-form/](https://rjsf-team.github.io/react-jsonschema-form/) after a new rjsf release, run:

```bash
cd packages/playground
npm run publish-to-gh-pages
```