// The filtered page's logic that needs neither React nor the browser, so `node --test` runs it as it is.

import { FRONT_MATTER } from '../../../plugins/upgrade-guide/markdown.js';

// The shape of the `v<N>.json` plugins/upgrade-guide/index.js writes.
export interface Package {
  id: string;
  short: string;
  group: 'always' | 'theme' | 'validator' | 'other';
  removed: boolean;
}

export interface Choice {
  id: string;
  label: string;
  detect: string;
  /** Set on a customization use: its chip's label in the filter bar. */
  chip?: string;
}

export interface Heading {
  id: string;
  heading: string;
  line: string;
}

export interface Entry {
  id: string;
  title: string;
  description: string;
  packages: string[];
  uses: string[];
  schema: string[];
  affects: string[];
  deprecated: boolean;
  /** The ids of the entries to read with this one. */
  related: string[];
  permalink: string;
}

export interface Guide {
  uses: Choice[];
  /** Every user renders a form, so an entry with this use shows whatever else is answered; it has no checkbox. */
  everyUserUse: string;
  schema: Choice[];
  /** The `affects` headings, then Deprecations, whose id is the last. */
  headings: Heading[];
  packages: Package[];
  entries: Entry[];
  /** An anchor to the ids of the entries it names. */
  anchors: Record<string, string[]>;
  /** An anchor to the site path, with its hash, of the other doc it names. */
  pageAnchors: Record<string, string>;
  llmsTxt: string;
  combined: Record<string, string>;
}

/** The reader's answers. An empty value is an unanswered question, which hides nothing. */
export interface Filters {
  theme: string;
  validator: string;
  /** The Nothing chip: the reader customizes nothing. It counts as answering the uses without naming one. */
  nothing: boolean;
  /** The ticked customization chips and More checkboxes. */
  uses: string[];
  schema: string[];
  other: string[];
  search: string;
}

export const NO_FILTERS: Filters = {
  theme: '',
  validator: '',
  nothing: false,
  uses: [],
  schema: [],
  other: [],
  search: '',
};

function shortNames(packages: Package[], group: Package['group']) {
  return packages.filter((pkg) => pkg.group === group).map((pkg) => pkg.short);
}

/** The uses shown as chips in the filter bar. */
export function customizations(guide: Guide) {
  return guide.uses.filter((use) => use.chip !== undefined);
}

/** The uses shown as checkboxes under More: every use but the chips and the one every user has. */
export function otherUses(guide: Guide) {
  return guide.uses.filter((use) => use.chip === undefined && use.id !== guide.everyUserUse);
}

/** The filters a query string names, dropping any key or value the guide's vocabulary doesn't have. */
export function readFilters(search: string, guide: Guide): Filters {
  const { packages } = guide;
  const params = new URLSearchParams(search);
  const one = (key: string, allowed: string[]) => {
    const value = params.get(key) ?? '';
    return allowed.includes(value) ? value : '';
  };
  const many = (key: string, allowed: string[]) =>
    (params.get(key) ?? '').split(',').filter((value) => allowed.includes(value));
  return {
    theme: one('theme', shortNames(packages, 'theme')),
    validator: one('validator', shortNames(packages, 'validator')),
    nothing: params.get('customized') === 'none',
    uses: many(
      'uses',
      guide.uses.filter((use) => use.id !== guide.everyUserUse).map((use) => use.id),
    ),
    schema: many(
      'schema',
      guide.schema.map((feature) => feature.id),
    ),
    other: many('other', shortNames(packages, 'other')),
    search: params.get('q') ?? '',
  };
}

/** Every value but the search is `[a-z0-9-]`, so the query is built by hand to keep the commas readable in a link. */
export function writeFilters({ theme, validator, nothing, uses, schema, other, search }: Filters) {
  const params = [
    theme && `theme=${theme}`,
    validator && `validator=${validator}`,
    nothing && 'customized=none',
    uses.length > 0 && `uses=${uses.join(',')}`,
    schema.length > 0 && `schema=${schema.join(',')}`,
    other.length > 0 && `other=${other.join(',')}`,
    search && `q=${encodeURIComponent(search)}`,
  ].filter(Boolean);
  return params.length > 0 ? `?${params.join('&')}` : '';
}

/** Whether the reader answered anything or searched, which is when the page offers to clear it all. */
export function isAnswered({ theme, validator, nothing, uses, schema, other, search }: Filters) {
  return (
    theme !== '' ||
    validator !== '' ||
    nothing ||
    uses.length > 0 ||
    schema.length > 0 ||
    other.length > 0 ||
    search.trim() !== ''
  );
}

/**
 * Tests one entry against the answers, applying the rule `APPLIES_RULE` in plugins/upgrade-guide/outputs.js states:
 * an unanswered question keeps every entry; a theme or validator picked is the one of its kind the reader has, and
 * once either is picked the packages for theme authors count only when ticked; and once Nothing or any use is ticked,
 * the ticked uses are all the reader's code does, so an entry stays only when its `uses` has `everyUserUse` or a
 * ticked use.
 */
export function matcher(guide: Guide, filters: Filters): (entry: Entry) => boolean {
  const { theme, validator, nothing, uses, schema, other } = filters;
  const packages = new Map(guide.packages.map((pkg) => [pkg.id, pkg]));
  // A theme author's package such as snapshot-tests is for readers who tick it, once they say which packages they have.
  const anyOther = theme === '' && validator === '';
  const hasPackage = (id: string) => {
    const pkg = packages.get(id);
    switch (pkg?.group) {
      case 'always':
        return true;
      case 'theme':
        return theme === '' || theme === pkg.short;
      case 'validator':
        return validator === '' || validator === pkg.short;
      case 'other':
        return anyOther || other.includes(pkg.short);
      default:
        return false;
    }
  };
  const usesAnswered = nothing || uses.length > 0;
  const tokens = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
  return (entry) =>
    entry.packages.some(hasPackage) &&
    (!usesAnswered || entry.uses.some((use) => use === guide.everyUserUse || uses.includes(use))) &&
    (schema.length === 0 || entry.schema.length === 0 || entry.schema.some((feature) => schema.includes(feature))) &&
    (tokens.length === 0 ||
      tokens.every((token) => `${entry.title}\n${entry.description}\n${entry.id}`.toLowerCase().includes(token)));
}

/** The id of the heading an entry is listed under: the last heading (Deprecations) or its first `affects` value. */
function headingOf(entry: Entry, headings: Heading[]) {
  return entry.deprecated ? headings[headings.length - 1].id : entry.affects[0];
}

/** The headings that list at least one of `entries`, in order, each with its entries in their order. */
export function groupByHeading(entries: Entry[], headings: Heading[]) {
  return headings
    .map((heading) => ({ heading, entries: entries.filter((entry) => headingOf(entry, headings) === heading.id) }))
    .filter((group) => group.entries.length > 0);
}

/** `a`, `a and b`, `a, b and c`, with `or` for `conjunction: 'or'`. */
function joinList(values: string[], conjunction = 'and') {
  return values.length > 1 ? `${values.slice(0, -1).join(', ')} ${conjunction} ${values.at(-1)}` : values.join('');
}

/** The hint under the filter bar: what the list shows, and that answering is optional. Its only Markdown is code. */
export function describeFilters(filters: Filters, guide: Guide) {
  if (!isAnswered(filters)) {
    return "Showing every change. Answer any of these to hide what doesn't apply to you.";
  }
  const label = (choices: Choice[], ids: string[]) =>
    choices.filter((choice) => ids.includes(choice.id)).map((choice) => choice.label);
  const packages = guide.packages
    .filter(
      (pkg) => pkg.short === filters.theme || pkg.short === filters.validator || filters.other.includes(pkg.short),
    )
    .map((pkg) => `\`${pkg.id}\``);
  const custom = label(customizations(guide), filters.uses).map((text) => text.toLowerCase());
  const code = label(otherUses(guide), filters.uses);
  const schema = label(guide.schema, filters.schema);
  const search = filters.search.trim();
  const lead = [
    packages.length > 0 && `for ${joinList(packages)}`,
    custom.length > 0 ? `with ${joinList(custom)}` : filters.nothing && 'with no customization',
  ]
    .filter(Boolean)
    .join(' ');
  const parts = [
    lead,
    code.length > 0 && `for code using ${joinList(code)}`,
    schema.length > 0 && `for schemas with ${joinList(schema, 'or')}`,
    search && `matching "${search}"`,
  ].filter(Boolean);
  return `Showing changes ${parts.join(', ')}. Answer more to narrow the list, or clear to see everything.`;
}

export function decodeHash(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return '';
  }
}

/** What the page does with its URL's hash. */
export type HashTarget =
  /** Open the entry and scroll to it. */
  | { kind: 'entry'; entry: Entry }
  /** List the entries an old anchor became. */
  | { kind: 'entries'; entries: Entry[] }
  /** Replace the hash with the one entry's id an old anchor became. */
  | { kind: 'moved'; id: string }
  /** Go to the other doc an old anchor became, at `url`. */
  | { kind: 'page'; url: string };

/**
 * What `hash` (decoded, without its `#`) names. An `_anchors.json` mapping wins over an entry with the same id, so an
 * anchor that maps to that entry and others lists them all.
 */
export function hashTarget(guide: Guide, hash: string): HashTarget | undefined {
  if (Object.hasOwn(guide.pageAnchors, hash)) {
    return { kind: 'page', url: guide.pageAnchors[hash] };
  }
  const ids = Object.hasOwn(guide.anchors, hash) ? guide.anchors[hash] : [hash];
  const entries = ids.flatMap((id) => guide.entries.filter((entry) => entry.id === id));
  if (entries.length > 1) {
    return { kind: 'entries', entries };
  }
  const [entry] = entries;
  if (entry === undefined) {
    return undefined;
  }
  return entry.id === hash ? { kind: 'entry', entry } : { kind: 'moved', id: entry.id };
}

/** The `.md` copy postBuild writes beside the entry's page. */
export function markdownUrl(entry: Entry, origin: string) {
  return new URL(`${entry.permalink.replace(/\/$/, '')}.md`, origin).href;
}

/**
 * One Markdown document of `rows`, in order, with `texts` their `.md` copies. Each entry keeps its body's `##`
 * sections, so its title is a `#` heading. `page` is the filtered page's location, which the document cites.
 */
export function toMarkdownDocument(
  rows: Entry[],
  texts: string[],
  version: string,
  page: { href: string; origin: string },
) {
  const count = `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`;
  const parts = [
    `> react-jsonschema-form ${version} upgrade guide: the ${count} that ${rows.length === 1 ? 'matches' : 'match'} ${page.href}, in the order the page lists them.`,
  ];
  rows.forEach((entry, index) => {
    const codes = (values: string[]) => values.map((value) => `\`${value}\``).join(', ');
    const facts = [
      `- affects: ${codes(entry.affects)}${entry.deprecated ? '; deprecated' : ''}`,
      `- packages: ${codes(entry.packages)}`,
      `- source: ${markdownUrl(entry, page.origin)}`,
    ];
    const body = texts[index].replace(FRONT_MATTER, '').trim();
    parts.push(`# ${entry.title}\n\n${facts.join('\n')}\n\n${entry.description}\n\n${body}`);
  });
  return `${parts.join('\n\n')}\n`;
}
