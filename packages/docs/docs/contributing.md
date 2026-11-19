# Contributing

## Development server

We are using `Vite` to power our `playground`, which caches all the built `@rjsf/*` distributions.
In order to test the `playground` locally after a new clone or fresh pull from `main`, run the following from the root directory of the monorepo:

```bash
pnpm install
pnpm run build
cd packages/playground
pnpm start
```

This will start the live development server showcasing components at [localhost:8080](http://localhost:8080).

Whenever you make changes to source code, stop the running playground and return to the root directory and rerun `pnpm run build`.
Thanks to `nx` caching, this should only rebuild what is necessary.
After the build is complete, return to the root of the `playground` and restart the server via `pnpm start`.

### First time step

If this is the first time you have cloned the repo, run the `pnpm run prepare` script that will set up `husky` to provide a git precommit hook that will format and lint any code you have added to a PR.

### Optional development process

With the large number of packages, sometimes running `pnpm run build` or `pnpm start` from the root directory will overwhelm an underpowered computer.
If that is the situation for you, you can instead use `pnpm run build-serial` to build the packages one at a time instead of all at once.
Also, if you are only working on one package, you can `pnpm run build` and `pnpm run test` from within the subdirectory.
Finally, you can simply `pnpm start` inside of the `playground` directory to test changes if you have already built all of your packages, without needing to watch all of the packages via the root directory `pnpm start`.

### Troubleshooting build failures

Sometimes your local builds fail and you can't figure out why. This is most likely to happen after rebase to `main` due
to `package.json` changes upstream. There are two commands you can use to (hopefully) get your environment back to a
working state. Try running the following two commands:

```bash
pnpm run refresh-node-modules
pnpm run clean-build
```

The first command will delete all of the `node_modules` directories in the environment and then rerun `pnpm install`.
The second command deletes every package's built `lib/` before retrying the build.

Worst case scenario when neither of those commands work, try running `pnpm run nuke-build-env` and then rerun the two commands.

## Cloud builds

When building in environments with limited memory, such as Netlify, it's recommended to use `pnpm run build-serial` that builds the packages serially.

## Coding style

All the JavaScript/Typescript code in this project is formatted with [oxfmt](https://oxc.rs/docs/guide/usage/formatter) and linted with [oxlint](https://oxc.rs/docs/guide/usage/linter).
oxfmt formats every file type it supports, not just source: Markdown, YAML, JSON and CSS are checked too, so a changelog or docs edit can need formatting as much as a component does.
Staged files are automatically formatted upon commit using precommit hooks, assuming you followed the `First time step` above.

CI checks the formatting with `pnpm cs-check`, so run `pnpm cs-format` from the repository root for any commit the hooks did not see — one made with `--no-verify`, from a fresh worktree, or through the GitHub web editor.

## Public entry points

A package's public API is what its root exports, plus the subpaths its `package.json` `exports` lists: `@rjsf/core/markdown`, `@rjsf/core/testing`, core's two stylesheets, `compileSchemaValidators` in `@rjsf/validator-ajv8` and `@rjsf/validator-ata`, and `@rjsf/snapshot-tests/setup`.
Nothing under `lib/` can be imported on its own, so a new module is internal until the package root exports something from it, and every name the root exports has to keep working until the next major.
To make something public, export it from the package root and add a changelog entry; add a subpath to `exports` only for an entry point that has to load separately, as `@rjsf/core/markdown` does.
`@rjsf/utils` exports only what another RJSF package's source imports, which `pnpm run knip` checks: its `src/index.ts` names every value it exports rather than re-exporting a module with `export *`, and an export only tests import is tagged `@testSeam`. An export that is public API though no other package's source imports it is tagged `@public`, which knip never reports: the validator-based schema functions, which consumers call on their own though RJSF reaches them through `createSchemaUtils()`, the id generators `optionDescriptionId()`, `optionHelpId()` and `selectedOptionDescriptionId()`, which name parts RJSF renders, `RJSF_PROVENANCE_KEY`, which consumers' tests strip from a retrieved schema before comparing it with one written by hand, and `SHARED_COPY_ID`, by which a custom validator recognises a part an option's scoring copy holds once.

## Changelog

A PR that changes anything a user of a published package can notice adds an entry to the changelog for each change users notice, so a PR that fixes one thing and adds another adds two.
Append each as the last bullet under the heading of each package whose users notice the change, in the upcoming release at the top of the file.
If the top heading is dated, that release has shipped: add an undated heading for the next version above it.
A change that belongs to no single package, such as a new Node or React requirement, goes once under `All packages` instead.
If the change needs a bigger semver bump than that release's heading names, update the heading.
A change to a package's peer dependency range goes under that package, and so does a dependency bump that changes what its users get, such as a fix or a new minimum version.
Tests, CI, refactors, docs changes, playground changes and dependency bumps users can't notice need no entry, and neither does a change to something that isn't released yet: edit that change's entry instead, keeping its PR link and adding yours after it.

Write the entry for someone deciding whether to upgrade, who won't open the PR:

- Start with `Add`, `Change`, `Deprecate`, `Fix` or `Remove`, and name the component, prop or export a user meets, in backticks.
  Use `Fix` when the old behavior was wrong for users and `Change` when it worked as intended but now works differently.
- Say what users notice, not how the code does it, and leave out internal helpers, hooks and concepts users never meet. A fix names what went wrong for them: "Fix `ArrayField` dropping the last item's errors when an item is removed".
- Leave the reasoning, the alternatives, the edge cases and related issues to the PR description.
- End the entry with its PR and then each issue it fixes, as in `([#5305](https://github.com/rjsf-team/react-jsonschema-form/pull/5305), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666))`: a PR's link has `pull`, an issue's has `issues`.
- Start a breaking change with `**BREAKING CHANGE:**` followed by the verb, as in `**BREAKING CHANGE:** Remove …`, say what now happens, and end the text with `See [the upgrade guide](…)`, linking the [upgrade guide](#upgrade-guide) entry that says what to change.
  Link the entry's page on the docs site, `https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/vN/<id>`, since the changelog entry is also copied into a GitHub Release, where relative paths don't resolve.
- A change is breaking if users have to change their code, styles or tests to keep what they had, including a different default, generated `id` or class name, or a narrower or reshaped type, such as an `enum` becoming a union type. A type-only break gets an upgrade guide entry too.
- Aim for a sentence or two, about 200 characters of text, not counting link URLs. If it can't be both short and clear, keep it clear.

For example, instead of an entry that explains the implementation:

> Fixed `ObjectFieldTemplate` rendering a property with no column span when the `colSpan` map in `formContext` has no usable entry for its widget or field name. The lookup now falls through to the schema type and then to the default span, skipping entries that are not a whole number of columns from 0 to 24 and a `ui:field` that names no registered component. …

write what users see:

> Fix `ObjectFieldTemplate` giving a property no column span when `formContext.colSpan` has no valid entry for it ([#5450](https://github.com/rjsf-team/react-jsonschema-form/pull/5450), [#5447](https://github.com/rjsf-team/react-jsonschema-form/issues/5447))

A breaking entry has the same shape:

> **BREAKING CHANGE:** Change an additional property's key input id from `root_foo-key` to `root_foo__key`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7/ids-cant-collide-or-split-an-id-list) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))

## Upgrade guide

A breaking change also gets an entry in the upgrade guide for the next major version N, in the same PR: one Markdown file, `packages/docs/docs/migration-guides/vN/<id>.md`. If the directory doesn't exist yet, also create `packages/docs/docs/migration-guides/vN.x upgrade guide.mdx` beside it, rendering `<UpgradeGuide version="vN" />`: the page that lists every entry, which readers can narrow by theme, validator, code and schemas if they choose.

The guide tells a developer with a working app on the previous major version everything about their app that vN changes, and what to do about each change. An entry is one action a reader takes: one thing to find and one change to make. Consequences of that change a reader should check are bullets under its `## Verify`. Split an entry only when a reader could need one action and not the other, or when the action differs per package (then one entry per theme or validator). A rule that reads the same in several themes is one entry listing them. Fixed crashes, unchanged behavior, rationale and new features are not entries.

The id is the file name: lowercase kebab-case, at most 64 characters, naming the change as users meet it. An entry for exactly one theme or validator starts with that package's name without `@rjsf/`, e.g. `mantine-…` or `validator-ata-…`. Once a changelog entry links an entry, its id is permanent: a release copies the changelog into a GitHub Release, which keeps the link forever, so never rename or delete a linked entry.

`packages/docs/docs/migration-guides/vN/_anchors.json` maps an anchor of the filtered page that no longer names an entry, such as a heading of an older guide or the id of an entry that was merged into another, to what it names now: an entry id, a list of them, or a relative link to another doc's `.md` or `.mdx` file with an optional `#anchor` of one of its headings. The page opens, lists or goes to what the anchor maps to.

The frontmatter says who the entry is for:

- `title`: the change as users meet it, in sentence case. Plain text only: Docusaurus shows it as written, so no backticks, `*`, `[` or `<`. An `_` inside an identifier such as `ADDITIONAL_PROPERTY_FLAG` is fine.
- `description`: one line of at most 260 characters in two sentences: what changed (the old behavior, then the new), then what to do about it. It has to make sense without the title or the body. Inline code is fine here. It is also the page's meta description and the text under the row's title on the filtered page.
- `packages`: the packages it affects. A change every user meets lists `@rjsf/core`; `*` means every `@rjsf/*` package.
- `uses`: how the reader's code meets it. `form` means every user of those packages, whatever their schema.
- `schema`: optionally, the schema features it depends on. An entry with any applies only to readers whose schemas use one of them; leave it out when the schema doesn't matter.
- `affects`: what the change touches in the reader's app, most important first, from `setup` (dependencies, peer versions, Node and React, CSS or subpath imports), `code` (imports, props, options and signatures, custom widgets, templates and fields), `data` (defaults, the `anyOf`/`oneOf` option picked, the data and errors a form submits and validates), `appearance` (class names, elements and nesting that CSS rules, selectors and DOM snapshots rely on) and `experience` (label and button text, accessible names, focus, keyboard use and when errors appear). The first value decides the heading the entry is listed under on the filtered page and in the agent files.
- `deprecated`: optionally `true`, only for something that still works in this version and goes in a later major. The entry is listed under a final Deprecations heading instead of its `affects` heading.
- `related`: optionally, ids of entries that must be read with this one. The entry's row on the filtered page and its own page link them under "Also read".

`packages/docs/plugins/upgrade-guide/vocabulary.js` is the single list of allowed `packages`, `uses`, `schema` and `affects` values, with what each one means; add a value there rather than inventing one in an entry.

The body has no `#` title (the frontmatter `title` is the page title) and these `##` sections, in this order:

- `## Detect`: concrete things to search for or observe (export, type or prop names, `ui:` keys, schema keywords, import paths, CSS classes, a visible symptom) and where each one shows. When the type checker reports the change, quote its exact error text.
- `## Change`: what to do, with a before/after `diff` when code has to change. Never "as above": each entry stands alone.
- `## Verify`: what passing looks like, and the consequences of the change to check.
- `## If you can't preserve it`: optional, only when the old behavior can't be kept.

Write plain reference prose in short declarative sentences, as the rest of the docs do: no em or en dashes, no bold labels on list items, no "not X but Y" contrasts, no closing one-liners.

Link another entry as `./<id>.md` and other docs with relative links to their `.md` or `.mdx` file under `packages/docs/docs`, which must be a published page: not a draft, and not a `_` file or in a `_` directory. Never link the `vN.x upgrade guide` page itself. `pnpm --filter ./packages/docs build` checks every entry against these rules, and checks that every link the root `CHANGELOG-vN.md` makes to an entry's page or to an anchor of the filtered page names an entry or an `_anchors.json` key. It fails listing every problem it finds. It also writes the guide's `llms.txt`, a Markdown copy of each entry, and one combined file per theme and validator for agents.

New features, the reasons behind a change and comparisons of alternatives belong in the reference docs, not in the guide; link them from the entry.

## Documentation

We use [Docusaurus](https://docusaurus.io/) to build our documentation. To run documentation locally, run:

```bash
cd packages/docs
pnpm start
```

Documentation will be served on [localhost:3000](http://localhost:3000).

## Tests

You can run all tests from the root directory OR from `packages` subdirectory using the following command:

```bash
pnpm run test
```

### Snapshot testing

All the themes, including `core` use snapshot testing (NOTE: `core` also has extensive non-snapshot tests).
The source-code of these snapshot tests resides in the `snapshot-tests` package and is shared with all the themes. `core`'s own snapshot tests live in `packages/snapshot-tests/test`, since `snapshot-tests` depends on `core`.
In order to support the various themes, the code for the tests are actually functions that take the theme's `Form` component (`ComponentType<FormProps>`).
The `snapshot-tests` package provides `arrayTests`, `formTests` and `objectTests`, plus `gridTests`, which also takes a map of the props (such as `className`s) that the theme's layout grid needs for each row and column width.

Each theme will basically run these functions by creating a `Xxx.test.tsx` file (where `Xxx` is `Array`, `Form` or `Object`) that looks like the following:

```tsx
import { arrayTests } from '@rjsf/snapshot-tests'; // OR
// import { formTests } from '@rjsf/snapshot-tests';
// import { objectTests } from '@rjsf/snapshot-tests';

import Form from '../src';

arrayTests(Form); // OR
// formTests(Form);
// objectTests(Form);
```

The suites expect `getTestIds` from `@rjsf/utils` to be mocked out before the theme's `Form` is imported, so each theme's `vitest.config.mts` lists a `test/snapshotSetup.ts` that loads `@rjsf/snapshot-tests/setup`. Without it the snapshots pick up numbered `data-testid` values that the other themes don't produce, and fail.
The file imports the setup rather than `setupFiles` naming it, since Vitest resolves a `setupFiles` entry without the `@rjsf/source` condition, so naming it there would load the built `lib/setup.js` and need a build first:

```ts
// test/snapshotSetup.ts
import '@rjsf/snapshot-tests/setup';
```

```ts
export default mergeConfig(base, {
  test: {
    setupFiles: ['./test/snapshotSetup.ts'],
  },
});
```

Anytime you add a new feature, be sure to update the appropriate `xxxTests()` function in the `snapshot-tests` package and do `pnpm run test:update` from the root directory to update all the snapshots.
If you add a theme-only feature, it is ok to update the appropriate `Xxx.test.tsx` file to add (or update) the theme-specific `describe()` block.
For example:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { arrayTests } from '@rjsf/snapshot-tests';

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
They are generated using [nyc](https://github.com/istanbuljs/nyc) each time the `pnpm test-coverage` script is run.
The full report can be seen by opening `./coverage/lcov-report/index.html`.

#### Utils and validator-ajv8 code coverage

100% code coverage is required by the `@rjsf/utils` and `@rjsf/validator-ajv8` tests.
If you make changes to those libraries, you will have to maintain that coverage, otherwise the tests will fail.

> NOTE: All three of these directories share the same tests for verifying `validator` based APIs. See the documentation in the `getTestValidator()` functions for more information.

## Releasing

Each release starts by turning the upcoming release's section of the changelog into release notes. Commit them on the `rc` branch below before you run `pnpm exec nx release version --git-tag`, so that the tagged commit carries them. Date the section's heading with the day you plan to publish, as in `# 6.100.10 (2026-11-01)`, and if the rc PR merges on a later day, correct the date in that PR before merging it. Start the section with a few highlights, put breaking changes first under each package, and merge entries that describe one change.

To release, go to the main branch (NOT a fork) and then create a new branch with the version number (with an `rc` prefix instead of `v`).
For instance if you are about to create the new `6.100.10` branch, then you would run the following commands:

```bash
git checkout -b rc6.100.10
git commit -m "Release notes for 6.100.10" CHANGELOG.md
pnpm exec nx release version --git-tag
git commit -m "Releasing 6.100.10"
git push
pnpm run update-version-tags
```

Make sure you use [semver](https://semver.org/) for version numbering when selecting the version.
The `pnpm exec nx release version --git-tag` command will update the `package*.json` files and create a new version tag.
Committing and pushing the branch will allow you to create the PR on GitHub.
The `pnpm run update-version-tags` will push the tags up to GitHub.

Then, make a PR to main. Merge the PR into main -- make sure you use "merge commit", not squash and merge, so that
the original commit where the tag was based on is still present in the main branch.

Then, create a release in the GitHub "Releases" tab, select the new tag that you have added,
and copy the release's changelog section into its description.
If this is a new major's first stable release (e.g. `7.0.0`), also update the previous major's docs banner as [Releasing docs](#releasing-docs) describes.

This will trigger a GitHub Actions pipeline that will build and publish all packages to npm.

The package is published through an automation token belonging to the
[rjsf-bot](https://www.npmjs.com/~rjsf-bot) user on npm. This token
is stored as the `NPM_TOKEN` secret on GitHub Actions.

### Releasing docs

Docs are automatically published to GitHub Pages when the `main` branch is updated.

`packages/docs/docs` holds the docs for the major on `main`; each earlier major keeps a frozen copy under `packages/docs/versioned_docs/`.
Once a new major lands on `main`, freeze the outgoing major's docs:

1. Check out the outgoing major's last release commit (e.g. `Releasing 6.11.1`), run `pnpm install`, then `pnpm --filter ./packages/docs docusaurus docs:version <x.y.z>` with that release's version.
   It writes `versioned_docs/version-<x.y.z>/`, `versioned_sidebars/version-<x.y.z>-sidebars.json` and the `versions.json` entry; copy those onto a branch from `main`.
   In the copy, point the `blob/main` and `tree/main` GitHub links at the release's tag (e.g. `blob/v6.11.1`), so they keep showing that release's code.
2. Add the version to `versions` in `packages/docs/docusaurus.config.js` with `label: 'v<major>'` and `path: 'version-<x.y.z>'`, and change the `current` label to the new major (e.g. `Current (v7)`).
   Until the new major's first stable release (e.g. `7.0.0`) is published, also give the frozen version `banner: 'none'`: until then, npm's `latest` tag still installs the frozen major, so its docs are the ones that match.
3. Check that `pnpm --filter ./packages/docs build` passes and that the version dropdown links the frozen pages.

When the new major's first stable release is published, remove that `banner: 'none'`, so the frozen docs show Docusaurus's "no longer actively maintained" banner.

After that, fix the outgoing major's docs in its `versioned_docs/version-<x.y.z>/` copy, not in `packages/docs/docs`.

### Releasing the playground

The playground automatically gets deployed from GitHub Pages.

If you need to manually publish the latest playground to [https://rjsf-team.github.io/react-jsonschema-form/](https://rjsf-team.github.io/react-jsonschema-form/), though, run:

```bash
cd packages/playground
pnpm run publish-to-gh-pages
```

### Releasing a new package

Publishing a new `@rjsf/*` package requires additional setup. The package must first be published locally, then in the NPM web app, you must set up "Trusted Publishing" so future releases can be published via GitHub Actions. The steps to accomplish this are:

1. Create the new release as described above. Existing packages will be published, but the jobs to publish new package(s) will fail.
2. Locally, check out the release tag (e.g. `git checkout v6.8.0`). You may need to `git fetch --tags`. Make sure your `git status` is clean.
3. `cd packages/new-package`
4. `pnpm login` (login to an account with RJSF publishing privileges)
5. `pnpm publish --no-git-checks`.

The new package will be released. Then, set up Trusted Publishing:

1. Navigate to the new package in NPM (e.g. `https://www.npmjs.com/package/@rjsf/new-package`)
2. Go to Settings -> Trusted Publisher -> GitHub Actions
3. Set up the fields to match an existing package (e.g. look at `@rjsf/core`).
   1. Organization or user: `rjsf-team`
   2. Repository: `react-jsonschema-form`
   3. Workflow filename: `release.yml`
   4. Allow `npm publish`
