// @ts-check
// The single list of values an upgrade guide entry's frontmatter may use. The plugin validates entries against it and
// hands it to the filtered page through global data, so adding a value here is the whole change.

/**
 * @typedef {{ id: string; label: string; detect: string }} Use
 * @typedef {{ id: string; label: string; detect: string }} SchemaFeature
 * @typedef {{ id: string; label: string; description: string }} Kind
 * @typedef {{ id: string; label: string; short: string; hint: string }} Noticed
 * `label` heads a summary tile, `short` is a row's badge.
 * @typedef {'always' | 'theme' | 'validator' | 'other'} PackageGroup
 * @typedef {{ id: string; group: PackageGroup; removedIn?: number }} PackageDefinition
 * @typedef {{ id: string; short: string; group: PackageGroup; removed: boolean }} Package
 */

/** @type {Use[]} */
const USES = [
  { id: 'form', label: 'Renders a form', detect: 'Your code renders `<Form>` (every user).' },
  { id: 'typescript', label: 'TypeScript', detect: 'Your code is TypeScript.' },
  { id: 'ui-schema', label: 'uiSchema', detect: 'Your code uses `ui:` keys or a `uiSchema`.' },
  {
    id: 'form-props',
    label: 'Less common Form props',
    detect:
      'Your code passes a less common `Form` prop such as `customMergeAllOf`, `defaultFormStateBehavior`, `nameGenerator`, `extraErrors`, `transformErrors`, `noValidate`, `liveValidate` or an `onChange` that reads the event, or reads native form data (`FormData`, input `name`s).',
  },
  { id: 'form-ref', label: 'Form ref', detect: 'Your code holds a ref to `Form` or calls `FormRef` methods.' },
  {
    id: 'custom-widgets',
    label: 'Custom widgets',
    detect: 'Your code passes `widgets=` or sets `ui:widget` to a component.',
  },
  {
    id: 'custom-templates',
    label: 'Custom templates',
    detect: 'Your code passes `templates=` or sets a `ui:*Template`.',
  },
  { id: 'custom-fields', label: 'Custom fields', detect: 'Your code passes `fields=` or sets `ui:field`.' },
  { id: 'custom-theme', label: 'Custom theme', detect: 'Your code calls `withTheme` or builds a `ThemeProps`.' },
  {
    id: 'custom-validator',
    label: 'Custom validator',
    detect: 'Your code calls `customizeValidator`, uses a precompiled validator, or implements `ValidatorType`.',
  },
  {
    id: 'utils-api',
    label: 'Utils functions',
    detect: 'Your code imports functions (not only types) from `@rjsf/utils`.',
  },
  {
    id: 'markup',
    label: 'Markup',
    detect: "Your code has CSS or tests that select RJSF's DOM, classes or ids, or snapshots of it.",
  },
  {
    id: 'tooling',
    label: 'Build and test tooling',
    detect: 'Your build, bundler, test runner, CDN or Node setup loads RJSF packages.',
  },
];

/**
 * What an entry's `schema` may name: an entry with any of these applies only to readers whose schemas use one of them.
 *
 * @type {SchemaFeature[]}
 */
const SCHEMA = [
  {
    id: 'any-of-one-of',
    label: 'anyOf / oneOf',
    detect: 'Your schema has `anyOf` or `oneOf`, including `dependencies` with `oneOf`.',
  },
  {
    id: 'refs',
    label: 'References',
    detect: 'Your schema has `$ref`, `$defs` or `definitions`, `$id`, `$anchor`, or recursion.',
  },
  {
    id: 'defaults',
    label: 'Defaults',
    detect: 'Your schema has `default`, `allOf`, `dependencies`, `if`/`then`/`else`, or a `const` used as a default.',
  },
  {
    id: 'additional-properties',
    label: 'Additional properties',
    detect: 'Your schema has `additionalProperties`, `patternProperties` or `propertyNames`.',
  },
  {
    id: 'arrays',
    label: 'Arrays',
    detect: 'Your schema has an `array` with `items`, a tuple, `minItems` or `uniqueItems`.',
  },
  { id: 'numbers', label: 'Numbers', detect: 'Your schema has a `number` or `integer` field.' },
  { id: 'dates', label: 'Dates and times', detect: 'Your schema has `format: date`, `date-time` or `time`.' },
  {
    id: 'enums',
    label: 'Enums and booleans',
    detect: 'Your schema has `enum`, `const`, boolean fields, or constant `anyOf`/`oneOf` options.',
  },
  { id: 'type-lists', label: 'Type lists', detect: 'Your schema has `type` as a list, or a field with no `type`.' },
];

/**
 * In apply order: an entry whose change fits several kinds takes the earliest.
 *
 * @type {Kind[]}
 */
const KINDS = [
  {
    id: 'install',
    label: 'Install',
    description: 'Changes in package.json: dependencies, peers, Node or React versions, a removed package, ESM.',
  },
  {
    id: 'removal',
    label: 'Removals',
    description: 'An export, prop, option or parameter is gone or renamed, or a function signature changed.',
  },
  { id: 'type', label: 'Types', description: 'A compile error only, with no runtime change.' },
  { id: 'runtime', label: 'Behaviour', description: 'Behaviour changes.' },
  { id: 'markup', label: 'Markup', description: 'DOM, classes, aria, ids, snapshots.' },
  { id: 'deprecation', label: 'Deprecations', description: 'Still works, and will go in a later major version.' },
];

/**
 * How a TypeScript reader with tests first meets a change, in the order the filtered page's summary shows them.
 *
 * @type {Noticed[]}
 */
const NOTICED = [
  {
    id: 'build',
    label: 'Build or install fails',
    short: 'build fails',
    hint: 'Installing, bundling or loading RJSF under Node fails.',
  },
  {
    id: 'type-error',
    label: 'The type checker reports it',
    short: 'type error',
    hint: 'Detect gives the exact error text.',
  },
  {
    id: 'runtime-error',
    label: 'It throws or warns at runtime',
    short: 'runtime error',
    hint: 'The form throws or logs a console warning.',
  },
  {
    id: 'test',
    label: 'A test or snapshot fails',
    short: 'test fails',
    hint: 'The type checker and the console stay quiet.',
  },
  { id: 'review', label: 'Nothing reports it', short: 'review', hint: 'Read the entry and check your form yourself.' },
];

/**
 * `*` stands for every `@rjsf/*` package. Every user has `@rjsf/core` and `@rjsf/utils`, so an entry every user meets
 * lists `@rjsf/core`.
 *
 * @type {PackageDefinition[]}
 */
const PACKAGES = [
  { id: '*', group: 'always' },
  { id: '@rjsf/core', group: 'always' },
  { id: '@rjsf/utils', group: 'always' },
  { id: '@rjsf/antd', group: 'theme' },
  { id: '@rjsf/bootstrap3', group: 'theme' },
  { id: '@rjsf/chakra-ui', group: 'theme' },
  { id: '@rjsf/daisyui', group: 'theme' },
  { id: '@rjsf/fluentui-rc', group: 'theme' },
  { id: '@rjsf/mantine', group: 'theme' },
  { id: '@rjsf/mui', group: 'theme' },
  { id: '@rjsf/react-bootstrap', group: 'theme' },
  { id: '@rjsf/shadcn', group: 'theme' },
  { id: '@rjsf/primereact', group: 'theme', removedIn: 7 },
  { id: '@rjsf/semantic-ui', group: 'theme', removedIn: 7 },
  { id: '@rjsf/validator-ajv8', group: 'validator' },
  { id: '@rjsf/validator-ata', group: 'validator' },
  { id: '@rjsf/validator-cfworker', group: 'validator' },
  { id: '@rjsf/snapshot-tests', group: 'other' },
];

/**
 * The packages an entry of major version `version` may name: a package removed in that version is still there (its
 * users need the entry saying so) and marked removed; one removed in an earlier version is gone.
 *
 * @param {number} version
 * @returns {Package[]}
 */
function packagesForVersion(version) {
  return PACKAGES.filter(({ removedIn }) => removedIn === undefined || removedIn >= version).map(
    ({ id, group, removedIn }) => ({
      id,
      short: id.replace(/^@rjsf\//, ''),
      group,
      removed: removedIn === version,
    }),
  );
}

module.exports = { USES, SCHEMA, KINDS, NOTICED, packagesForVersion };
