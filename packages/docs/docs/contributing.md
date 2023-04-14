# Contributing

## Development server

We are using `Vite` to power our `playground`, which caches all the built `@rjsf/*` distributions.
In order to test the `playground` locally after a new clone or fresh pull from `main`, run the following from the root directory of the monorepo:

```bash
npm install
npm run build
cd packages/playground
npm start
```

This will start the live development server showcasing components at [localhost:8080](http://localhost:8080).

Whenever you make changes to source code, stop the running playground and return to the root directory and rerun `npm run build`.
Thanks to `nx` caching, this should only rebuild what is necessary.
After the build is complete, return to the root of the `playground` and restart the server via `npm start`.

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

You can also run `npm cs-format` within any package directory you are changing.

## Documentation

We use [Docusaurus](https://docusaurus.io/) to build our documentation. To run documentation locally, run:

```bash
cd packages/docs
npm start
```

Documentation will be served on [localhost:3000](http://localhost:3000).

## Tests

You can run all tests from the root directory OR from `packages` subdirectory using the following command:

```bash
npm run test
```

### Snapshot testing

All the themes, including `core` use snapshot testing (NOTE: `core` also has extensive non-snapshot tests).
The source-code of these snapshot tests reside in the `core` package in the `testSnap` directory and are shared with all the themes.
In order to support the various themes, the code for the tests are actually functions that take two parameters:

- `Form`: ComponentType&lt;FormProps> - The component from the theme implementation
- `[customOptions]`: { [key: string]: TestRendererOptions } - an optional map of `react-test-renderer` `TestRendererOptions` implementations that some themes need to be able properly run

There are functions in the `testSnap` directory: `arrayTests`, `formTests` and `objectTests`, each with its own definition of `customOptions`

Each theme will basically run these functions by creating a `Xxx.test.tsx` file (where `Xxx` is `Array`, `Form` or `Object`) that looks like the following:

```tsx
import arrayTests from '@rjsf/core/testSnap/arrayTests'; // OR
// import arrayTests from '@rjsf/core/testSnap/formTests'
// import arrayTests from '@rjsf/core/testSnap/objectTests'

import Form from '../src';

arrayTests(Form); // OR
// formTests(Form);
// objectTests(Form);
```

Anytime you add a new feature, be sure to update the appropriate `xxxTests()` function in the `testSnap` directory and do `npm run test` from the root directory to update all the snapshots.
If you add a theme-only feature, it is ok to update the appropriate `Xxx.test.tsx` file to add (or update) the theme-specific `describe()` block.
For example:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import arrayTests from '@rjsf/core/testSnap/formTests';

import Form from '../src';

formTests(Form);

describe('Theme specific tests', () => {
  it('test a theme-specific option', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    };
    const uiSchema: UiSchema = {
      // Enable the theme specific feature
    };
    const tree = renderer.create(<Form schema={schema} uiSchema={uiSchema} validator={validator} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
```

See the `antd` `Form.test.tsx` for a specific example of this.

### Code coverage

Code coverage reports are currently available only for the `@rjsf/core` theme package.
They are generated using [nyc](https://github.com/istanbuljs/nyc) each time the `npm test-coverage` script is run.
The full report can be seen by opening `./coverage/lcov-report/index.html`.

#### Utils and validator-ajvX code coverage

100% code coverage is required by the `@rjsf/utils` and `@rjsf/validator-ajv6` and `@rjsf/validator-ajv8` tests.
If you make changes to those libraries, you will have to maintain that coverage, otherwise the tests will fail.

> NOTE: All three of these directories share the same tests for verifying `validator` based APIs. See the documentation in the `getTestValidator()` functions for more information.

## Releasing

To release, go to the main branch (NOT a fork) and then create a new branch with the version number (with an `rc` prefix instead of `v`).
For instance if you are about to create the new `5.100.10` branch, then you would run the following commands:

```bash
git checkout -b rc5.100.10
git push
npx lerna version
npm run post-versioning
```

Make sure you use [semver](https://semver.org/) for version numbering when selecting the version.
The `npx lerna version` command will create a new version tag and push it to GitHub.

The `npm run post-versioning` script will update the peer dependencies in all of the `packages/*/package.json` files if necessary.
It will then clean up the `node_modules` directories and rerun `npm install` to update the `package-lock.json` files.
Finally, it creates and pushes a new commit with those `package.json` and `package-lock.json` files up to GitHub.

> NOTE: this command will take a while, be patient

Then, make a PR to main. Merge the PR into main -- make sure you use "merge commit", not squash and merge, so that
the original commit where the tag was based on is still present in the main branch.

Then, create a release in the GitHub "Releases" tab, select the new tag that you have added,
and add a description of the changes in the new release. You can copy
the latest changelog entry in `CHANGELOG.md` to make the release notes, and update as necessary.

This will trigger a GitHub Actions pipeline that will build and publish all packages to npm.

The package is published through an automation token belonging to the
[rjsf-bot](https://www.npmjs.com/~rjsf-bot) user on npm. This token
is stored as the `NPM_TOKEN` secret on GitHub Actions.

### Releasing docs

Docs are automatically published to GitHub Pages when the `main` branch is updated.

We are currently in the process of automatically configuring versionable documentation on our new docs site.

### Releasing the playground

The playground automatically gets deployed from GitHub Pages.

If you need to manually publish the latest playground to [https://rjsf-team.github.io/react-jsonschema-form/](https://rjsf-team.github.io/react-jsonschema-form/), though, run:

```bash
cd packages/playground
npm run publish-to-gh-pages
```
