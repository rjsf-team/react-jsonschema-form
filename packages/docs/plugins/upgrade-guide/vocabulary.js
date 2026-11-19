// @ts-check
// The single list of values an upgrade guide entry's frontmatter may use. The plugin validates entries against it and
// writes it to the filtered page's data, so adding a value here is the whole change.

/**
 * @typedef {{ id: string; label: string; detect: string; chip?: string }} Use
 * `chip` marks a customization use: the filtered page shows it as a chip with this label in its filter bar, and every
 * other use as a checkbox under "More about your app".
 * @typedef {{ id: string; label: string; detect: string }} SchemaFeature
 * @typedef {{ id: string; heading: string; line: string }} Affects
 * `heading` names the section an entry is listed under when this is its first `affects` value; `line` is the sentence
 * under it.
 * @typedef {'always' | 'theme' | 'validator' | 'other'} PackageGroup
 * @typedef {{ id: string; group: PackageGroup; removedIn?: number }} PackageDefinition
 * @typedef {{ id: string; short: string; group: PackageGroup; removed: boolean }} Package
 */

/** Every user renders a form, so an entry with this use applies whatever else the reader's code does. */
const EVERY_USER_USE = 'form';

/** @type {Use[]} */
const USES = [
  { id: EVERY_USER_USE, label: 'Renders a form', detect: 'Your code renders `<Form>` (every user).' },
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
    chip: 'Widgets',
    detect: 'Your code passes `widgets=` or sets `ui:widget` to a component.',
  },
  {
    id: 'custom-templates',
    label: 'Custom templates',
    chip: 'Templates',
    detect: 'Your code passes `templates=` or sets a `ui:*Template`.',
  },
  {
    id: 'custom-fields',
    label: 'Custom fields',
    chip: 'Fields',
    detect: 'Your code passes `fields=` or sets `ui:field`.',
  },
  {
    id: 'custom-theme',
    label: 'Custom theme',
    chip: 'Theme',
    detect: 'Your code calls `withTheme` or builds a `ThemeProps`.',
  },
  {
    id: 'custom-validator',
    label: 'Custom validator',
    chip: 'Validator',
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
 * What a change touches in the reader's app, in the order the guide lists their headings.
 *
 * @type {Affects[]}
 */
const AFFECTS = [
  {
    id: 'setup',
    heading: 'Installation and build',
    line: 'Update dependencies, peer versions, Node and React, and any CSS or subpath imports.',
  },
  {
    id: 'code',
    heading: 'Code and APIs',
    line: 'Fix the imports, props, options and signatures your code uses, and update custom widgets, templates and fields.',
  },
  {
    id: 'data',
    heading: 'Form data',
    line: 'Check the defaults, the anyOf/oneOf option picked, and the data and errors your form now submits and validates.',
  },
  {
    id: 'appearance',
    heading: 'Markup and styles',
    line: 'Update CSS rules, selectors and DOM snapshots that rely on class names, elements or nesting.',
  },
  {
    id: 'experience',
    heading: 'Wording and interaction',
    line: 'Recheck label and button text, accessible names, focus, keyboard use and when errors appear.',
  },
];

/**
 * The heading a `deprecated: true` entry is listed under instead of its `affects` heading, after all of them.
 *
 * @type {Affects}
 */
const DEPRECATIONS = {
  id: 'deprecated',
  heading: 'Deprecations',
  line: 'Still works in this version; goes in a later major version.',
};

/** Every heading in list order: the `affects` headings, then Deprecations. */
const HEADINGS = [...AFFECTS, DEPRECATIONS];

/**
 * The id of the heading an entry is listed under: Deprecations for a deprecated entry, else its first `affects` value.
 *
 * @param {{ affects: string[]; deprecated: boolean }} entry
 */
function headingId(entry) {
  return entry.deprecated ? DEPRECATIONS.id : entry.affects[0];
}

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

/** The packages every user has: an entry naming any of them applies to every user. */
const ALWAYS_PACKAGES = PACKAGES.filter(({ group }) => group === 'always').map(({ id }) => id);

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

module.exports = {
  USES,
  SCHEMA,
  AFFECTS,
  HEADINGS,
  EVERY_USER_USE,
  ALWAYS_PACKAGES,
  headingId,
  packagesForVersion,
};
