// The filtered page's logic that needs neither React nor the browser, so `node --test` runs it as it is.

// The shape of the `v<N>.json` plugins/upgrade-guide/index.js writes.
interface Package {
  id: string;
  short: string;
  group: 'always' | 'theme' | 'validator' | 'other';
  removed: boolean;
}

export interface Choice {
  id: string;
  label: string;
  detect: string;
}

export interface Kind {
  id: string;
  label: string;
  description: string;
}

export interface Noticed {
  id: string;
  label: string;
  short: string;
  hint: string;
  badge: string;
}

export interface Entry {
  id: string;
  title: string;
  description: string;
  packages: string[];
  uses: string[];
  schema: string[];
  kind: string;
  noticed: string;
  permalink: string;
}

export interface Guide {
  uses: Choice[];
  /** Every user renders a form, so an entry with this use shows whatever else is ticked; it has no checkbox. */
  everyUserUse: string;
  schema: Choice[];
  kinds: Kind[];
  noticed: Noticed[];
  packages: Package[];
  entries: Entry[];
  anchors: Record<string, string[]>;
  llmsTxt: string;
  combined: Record<string, string>;
}

export interface Filters {
  theme: string;
  validator: string;
  uses: string[];
  schema: string[];
  other: string[];
  noticed: string;
}

function shortNames(packages: Package[], group: Package['group']) {
  return packages.filter((pkg) => pkg.group === group).map((pkg) => pkg.short);
}

/** The filters a query string names, dropping any value the guide's vocabulary doesn't have. */
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
    uses: many(
      'uses',
      guide.uses.map((use) => use.id),
    ),
    schema: many(
      'schema',
      guide.schema.map((feature) => feature.id),
    ),
    other: many('other', shortNames(packages, 'other')),
    noticed: one(
      'noticed',
      guide.noticed.map((noticed) => noticed.id),
    ),
  };
}

/** Every value is `[a-z0-9-]`, so the query is built by hand to keep the commas readable in a shared link. */
export function writeFilters({ theme, validator, uses, schema, other, noticed }: Filters) {
  const params = [
    theme && `theme=${theme}`,
    validator && `validator=${validator}`,
    uses.length > 0 && `uses=${uses.join(',')}`,
    schema.length > 0 && `schema=${schema.join(',')}`,
    other.length > 0 && `other=${other.join(',')}`,
    noticed && `noticed=${noticed}`,
  ].filter(Boolean);
  return params.length > 0 ? `?${params.join('&')}` : '';
}

/** The ids of the packages the reader has: the `always` group and the chosen theme, validator and others. */
export function chosenPackages(guide: Guide, filters: Filters): Set<string> {
  const chosen = [filters.theme, filters.validator, ...filters.other];
  return new Set(
    guide.packages.filter((pkg) => pkg.group === 'always' || chosen.includes(pkg.short)).map((pkg) => pkg.id),
  );
}

/** The rule `APPLIES_RULE` in plugins/upgrade-guide/outputs.js states. */
export function matches(entry: Entry, packages: ReadonlySet<string>, filters: Filters, everyUserUse: string) {
  const { uses, schema } = filters;
  return (
    entry.packages.some((pkg) => packages.has(pkg)) &&
    (uses.length === 0 || entry.uses.some((use) => use === everyUserUse || uses.includes(use))) &&
    (schema.length === 0 || entry.schema.length === 0 || entry.schema.some((feature) => schema.includes(feature)))
  );
}

export function decodeHash(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return '';
  }
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
  kinds: Kind[],
  page: { href: string; origin: string },
) {
  const count = `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`;
  const parts = [
    `> react-jsonschema-form ${version} upgrade guide: the ${count} that ${rows.length === 1 ? 'matches' : 'match'} ${page.href}, in the order to apply them.`,
  ];
  rows.forEach((entry, index) => {
    const kind = kinds.find(({ id }) => id === entry.kind)?.label ?? entry.kind;
    const facts = [
      `- kind: ${kind}; noticed: \`${entry.noticed}\``,
      `- packages: ${entry.packages.map((pkg) => `\`${pkg}\``).join(', ')}`,
      `- source: ${markdownUrl(entry, page.origin)}`,
    ];
    const body = texts[index].replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n/, '').trim();
    parts.push(`# ${entry.title}\n\n${facts.join('\n')}\n\n${entry.description}\n\n${body}`);
  });
  return `${parts.join('\n\n')}\n`;
}
