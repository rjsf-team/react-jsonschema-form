// The upgrade guide's page logic that needs neither React nor the browser, so `node --test` runs it as it is.

import { FRONT_MATTER, andList, codeList, codes } from '../../../plugins/upgrade-guide/markdown.js';

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
  /** The Nothing chip: the reader customizes nothing. It answers the chips' question without naming a chip. */
  nothing: boolean;
  /** The ticked customization chips and More checkboxes. */
  uses: string[];
  schema: string[];
  /** The ticked packages for theme authors. */
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

/** Copy as Markdown fetches every shown entry's `.md` copy; this many at a time, so a long list can't flood the server. */
const COPY_CONCURRENCY = 6;

function shortNames(packages: Package[], group: Package['group']) {
  return packages.filter((pkg) => pkg.group === group).map((pkg) => pkg.short);
}

/** The uses shown as chips in the filter bar. */
export function customizations(guide: Guide) {
  return guide.uses.filter((use): use is Choice & { chip: string } => use.chip !== undefined);
}

/** The uses shown as checkboxes under More: every use but the chips and the one every user has. */
export function moreUses(guide: Guide) {
  return guide.uses.filter((use) => use.chip === undefined && use.id !== guide.everyUserUse);
}

function isChip(guide: Guide, id: string) {
  return guide.uses.some((use) => use.id === id && use.chip !== undefined);
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

/** Pressing Nothing: the reader customizes nothing, so no chip stays ticked. The More uses are another question. */
export function toggleNothing(guide: Guide, filters: Filters): Filters {
  return filters.nothing
    ? { ...filters, nothing: false }
    : { ...filters, nothing: true, uses: filters.uses.filter((use) => !isChip(guide, use)) };
}

/** Ticks or unticks the use `id`. A chip answers the same question as Nothing, so it unticks Nothing. */
export function toggleUse(guide: Guide, filters: Filters, id: string): Filters {
  const uses = filters.uses.includes(id) ? filters.uses.filter((use) => use !== id) : [...filters.uses, id];
  return { ...filters, uses, nothing: filters.nothing && !isChip(guide, id) };
}

/** Whether More starts open: when it holds an answer, so the reader sees every answer the URL carries. */
export function opensMore(guide: Guide, filters: Filters) {
  return (
    filters.validator !== '' ||
    filters.schema.length > 0 ||
    filters.other.length > 0 ||
    filters.uses.some((use) => !isChip(guide, use))
  );
}

/** The one theme or validator an entry is for, when that is all its `packages` lists. */
export function badgeOf(entry: Entry, packagesById: ReadonlyMap<string, Package>) {
  const only = entry.packages.length === 1 ? packagesById.get(entry.packages[0]) : undefined;
  return only?.group === 'theme' || only?.group === 'validator' ? only : undefined;
}

/**
 * Tests one entry against the answers, applying the rule `APPLIES_RULE` in plugins/upgrade-guide/outputs.js states,
 * with each question nobody answered keeping every entry. A theme or validator picked is the one of its kind the
 * reader has, and once either is picked the packages for theme authors count only when ticked. The chips are one
 * question, answered by Nothing or a chip, and the More uses another, answered by a More use: an entry's `uses` hold
 * when they have `everyUserUse`, a ticked use, or a use of a question left unanswered.
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
  const chipsAnswered = nothing || uses.some((use) => isChip(guide, use));
  const moreAnswered = uses.some((use) => !isChip(guide, use));
  const useHolds = (use: string) =>
    use === guide.everyUserUse || uses.includes(use) || !(isChip(guide, use) ? chipsAnswered : moreAnswered);
  const tokens = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
  return (entry) =>
    entry.packages.some(hasPackage) &&
    entry.uses.some(useHolds) &&
    (schema.length === 0 || entry.schema.length === 0 || entry.schema.some((feature) => schema.includes(feature))) &&
    (tokens.length === 0 ||
      tokens.every((token) => `${entry.title}\n${entry.description}\n${entry.id}`.toLowerCase().includes(token)));
}

/** The hint under the filter bar: what the list shows, and that answering is optional. Its only Markdown is code. */
export function describeFilters(filters: Filters, guide: Guide) {
  const everyChange = "Showing every change. Answer any of these to hide what doesn't apply to you.";
  if (!isAnswered(filters)) {
    return everyChange;
  }
  const label = (choices: Choice[], ids: string[]) =>
    choices.filter((choice) => ids.includes(choice.id)).map((choice) => choice.label);
  // The packages for theme authors narrow the list only once a theme or validator is picked (see matcher).
  const otherNarrows = filters.theme !== '' || filters.validator !== '';
  const packages = guide.packages
    .filter(
      (pkg) =>
        pkg.short === filters.theme ||
        pkg.short === filters.validator ||
        (otherNarrows && filters.other.includes(pkg.short)),
    )
    .map((pkg) => pkg.id);
  const custom = label(customizations(guide), filters.uses).map((text) => text.toLowerCase());
  const code = label(moreUses(guide), filters.uses);
  const schema = label(guide.schema, filters.schema);
  const search = filters.search.trim();
  const lead = [
    packages.length > 0 && `for ${andList(codes(packages))}`,
    custom.length > 0 ? `with ${andList(custom)}` : filters.nothing && 'with no customization',
  ]
    .filter(Boolean)
    .join(' ');
  const parts = [
    lead,
    code.length > 0 && `for code using ${andList(code)}`,
    schema.length > 0 && `for schemas with ${andList(schema, 'or')}`,
    search && `matching "${search}"`,
  ].filter(Boolean);
  if (parts.length === 0) {
    return everyChange;
  }
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

/**
 * The links an entry's own page lists for its `related` ids. Every entry's page is its id beside this one's
 * (resolveVersions in plugins/upgrade-guide/resolve.js fails the build otherwise), and so is its doc id; `docs` is the
 * docs plugin's version metadata, keyed by doc id.
 */
export function relatedLinks(
  doc: { id: string; permalink: string },
  related: string[],
  docs: Readonly<Record<string, { title: string }>>,
) {
  const dir = doc.id.slice(0, doc.id.lastIndexOf('/') + 1);
  const route = doc.permalink.replace(/[^/]+\/?$/, '');
  return related.map((id) => ({ id, title: docs[`${dir}${id}`]?.title ?? id, permalink: `${route}${id}` }));
}

/** The `.md` copy postBuild writes beside the entry's page. */
function markdownUrl(entry: Entry, origin: string) {
  return new URL(`${entry.permalink.replace(/\/$/, '')}.md`, origin).href;
}

/**
 * One Markdown document of `rows`, in order, with `texts` their `.md` copies. Each entry keeps its body's `##`
 * sections, so its title is a `#` heading. `page.url` is the filtered page's address with the reader's answers, which
 * the document cites; `page.origin` is the site's.
 */
export function toMarkdownDocument(
  rows: Entry[],
  texts: string[],
  version: string,
  page: { url: string; origin: string },
) {
  const count = `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`;
  const parts = [
    `> react-jsonschema-form ${version} upgrade guide: the ${count} that ${rows.length === 1 ? 'matches' : 'match'} ${page.url}, in the order the page lists them.`,
  ];
  rows.forEach((entry, index) => {
    const facts = [
      `- affects: ${codeList(entry.affects)}${entry.deprecated ? '; deprecated' : ''}`,
      `- packages: ${codeList(entry.packages)}`,
      `- source: ${markdownUrl(entry, page.origin)}`,
    ];
    const body = texts[index].replace(FRONT_MATTER, '').trim();
    parts.push(`# ${entry.title}\n\n${facts.join('\n')}\n\n${entry.description}\n\n${body}`);
  });
  return `${parts.join('\n\n')}\n`;
}

/** `map` over `items`, at most `limit` calls in flight at once, the results in `items`' order. */
export async function mapConcurrently<T, R>(items: T[], limit: number, map: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await map(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Copy as Markdown's document: `rows`' `.md` copies, fetched a few at a time, as toMarkdownDocument joins them. */
export async function fetchMarkdown(
  rows: Entry[],
  version: string,
  page: { url: string; origin: string },
  fetchUrl: (url: string) => Promise<Response>,
) {
  const texts = await mapConcurrently(rows, COPY_CONCURRENCY, async (entry) => {
    const url = markdownUrl(entry, page.origin);
    const response = await fetchUrl(url);
    if (!response.ok) {
      throw new Error(`${url} answered ${response.status}`);
    }
    return response.text();
  });
  return toMarkdownDocument(rows, texts, version, page);
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
