// @ts-check
// The agent-readable copies of a version's guide, written beside its pages: `llms.txt`, `<id>.md` per entry, and the
// combined `all.md` and `<package>.md` files.

const fs = require('node:fs/promises');
const path = require('node:path');

const { localMarkdownFile } = require('./entries.js');
const { demoteHeadings, mapLinks } = require('./markdown.js');
const { appliesToPackage } = require('./resolve.js');
const { AFFECTS, ALWAYS_PACKAGES, EVERY_USER_USE, HEADINGS, SCHEMA, USES, headingId } = require('./vocabulary.js');

/**
 * How a reader or agent decides whether an entry applies: the rule the filtered page applies to the answers given in
 * its filter bar, where an unanswered question hides nothing.
 */
const APPLIES_RULE = `An entry applies to you when all three hold: your package.json has one of its \`packages\` (\`*\` is every \`@rjsf/*\` package, and every user has ${andList(
  codes(ALWAYS_PACKAGES.filter((id) => id !== '*')),
)}); its \`uses\` lists \`${EVERY_USER_USE}\` (every user) or something your code does; and its \`schema\` is empty (\`any\`) or names something at least one of your schemas has. When you can't tell whether one holds, keep the entry: the filtered page hides an entry only when an answer rules it out, and shows every entry when nothing is answered.`;

/** Where the sections come from and the order to work through them. */
const ORDER_RULE =
  'Work through the sections in order. Each entry is listed under the heading of its first `affects` value, or under Deprecations when it has `deprecated: true`.';

/**
 * @typedef {import('./resolve.js').ResolvedVersion} ResolvedVersion
 * @typedef {import('./resolve.js').ResolvedEntry} ResolvedEntry
 * @typedef {import('./resolve.js').Permalinks} Permalinks
 * @typedef {{ siteUrl: string; baseUrl: string; permalinks: Permalinks }} Site
 */

/**
 * @param {ResolvedVersion[]} versions
 * @param {string} outDir
 * @param {Site} site
 */
async function writeOutputs(versions, outDir, site) {
  for (const version of versions) {
    const dir = path.join(outDir, decodeURI(version.route.slice(site.baseUrl.length)));
    await fs.mkdir(dir, { recursive: true });
    /** @type {[string, string][]} */
    const files = [
      ['llms.txt', renderLlmsTxt(version, site)],
      ...version.entries.map(
        (entry) => /** @type {[string, string]} */ ([`${entry.id}.md`, renderEntry(entry, version, site)]),
      ),
      ...version.combined.map(({ key, packageId }) => {
        const entries = packageId
          ? version.entries.filter((entry) => appliesToPackage(entry, packageId))
          : version.entries;
        return /** @type {[string, string]} */ ([`${key}.md`, renderCombined(version, packageId, entries, site)]);
      }),
    ];
    for (const [name, text] of files) {
      await fs.writeFile(path.join(dir, name), text);
    }
  }
}

/**
 * @param {ResolvedVersion} version
 * @param {Site} site
 */
function renderLlmsTxt(version, site) {
  const lines = [
    `# react-jsonschema-form ${version.name} upgrade guide`,
    '',
    `> Every breaking change in react-jsonschema-form ${version.name}, one Markdown entry per action to take. ${APPLIES_RULE} ${ORDER_RULE}`,
    '',
    `Each entry's frontmatter has \`packages\`, \`uses\`, \`schema\` (left out or empty, shown as \`any\` below, when the change doesn't depend on your schema), \`affects\` (what the change touches in your app, most important first) and, for something that still works in ${version.name} and goes in a later major version, \`deprecated: true\`. Its body has a \`## Detect\` section (what to search your code for), \`## Change\` (what to do) and \`## Verify\` (what passing looks like). People filter the same entries at ${absolute(site, version.page)}.`,
    '',
    'The `uses` values:',
    '',
    ...USES.map(({ id, detect }) => `- \`${id}\`: ${detect}`),
    '',
    'The `schema` values:',
    '',
    ...SCHEMA.map(({ id, detect }) => `- \`${id}\`: ${detect}`),
    '',
    'The `affects` values, in the order of their sections:',
    '',
    ...AFFECTS.map(({ id, heading, line }) => `- \`${id}\`: ${heading}. ${line}`),
    '',
    '## Combined files',
    '',
    ...version.combined.map(
      ({ label, path: file, packageId }) =>
        `- [${label}](${absolute(site, file)}): ${
          packageId
            ? `every entry for a user of \`${packageId}\`, under the same headings`
            : 'every entry of every package, under the same headings'
        }`,
    ),
  ];
  for (const { heading, line, entries } of byHeading(version.entries)) {
    lines.push('', `## ${heading}`, '', line, '', ...entries.map((entry) => llmsTxtLine(entry, version, site)));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * The headings that list at least one of `entries`, in order, each with its entries.
 *
 * @param {ResolvedEntry[]} entries
 */
function byHeading(entries) {
  return HEADINGS.map((heading) => ({
    ...heading,
    entries: entries.filter((entry) => headingId(entry) === heading.id),
  })).filter((group) => group.entries.length > 0);
}

/**
 * The frontmatter facts that decide whether an entry applies and where it is listed.
 *
 * @param {ResolvedEntry} entry
 */
function facts(entry) {
  return [
    `packages: ${codeList(entry.packages)}`,
    `uses: ${codeList(entry.uses)}`,
    `schema: ${schemaList(entry.schema)}`,
    `affects: ${codeList(entry.affects)}`,
    ...(entry.deprecated ? ['deprecated: `true`'] : []),
  ];
}

/**
 * @param {ResolvedEntry} entry
 * @param {ResolvedVersion} version
 * @param {Site} site
 */
function llmsTxtLine(entry, version, site) {
  return `- [${entry.title}](${entryMarkdownUrl(entry.id, version, site)}): ${facts(entry).join('; ')}. ${entry.description}`;
}

/**
 * @param {ResolvedEntry} entry
 * @param {ResolvedVersion} version
 * @param {Site} site
 */
function renderEntry(entry, version, site) {
  return `---\n${entry.frontMatter}\n---\n${rewriteLinks(entry, version, site)}`;
}

/**
 * @param {ResolvedVersion} version
 * @param {string | undefined} packageId
 * @param {ResolvedEntry[]} entries
 * @param {Site} site
 */
function renderCombined(version, packageId, entries, site) {
  const count = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
  const lines = packageId
    ? [
        `# react-jsonschema-form ${version.name} upgrade guide for ${packageId}`,
        '',
        `> Every ${version.name} breaking change that applies to a user of \`${packageId}\`: the entries for \`${packageId}\` and for ${andList(codes(ALWAYS_PACKAGES))}. ${count}.`,
      ]
    : [
        `# react-jsonschema-form ${version.name} upgrade guide, every entry`,
        '',
        `> Every ${version.name} breaking change of every package. ${count}.`,
      ];
  lines.push(
    '',
    `${APPLIES_RULE} ${ORDER_RULE} The index of every entry and combined file is ${absolute(site, `${version.route}llms.txt`)}.`,
  );
  for (const { heading, line, entries: listed } of byHeading(entries)) {
    lines.push('', `## ${heading}`, '', line);
    for (const entry of listed) {
      const lists = [
        ...facts(entry).map((fact) => `- ${fact}`),
        ...(entry.related.length > 0
          ? [`- related: ${entry.related.map((id) => `[${id}](${entryMarkdownUrl(id, version, site)})`).join(', ')}`]
          : []),
        `- source: ${entryMarkdownUrl(entry.id, version, site)}`,
      ];
      lines.push(
        '',
        `### ${entry.title}`,
        '',
        ...lists,
        '',
        entry.description,
        '',
        demoteHeadings(rewriteLinks(entry, version, site), 2).trim(),
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Makes every relative link in an entry's body absolute: a link to another entry goes to its `.md` copy, a link to any
 * other doc to that doc's page.
 *
 * @param {ResolvedEntry} entry
 * @param {ResolvedVersion} version
 * @param {Site} site
 */
function rewriteLinks(entry, version, site) {
  return mapLinks(entry.body, (destination) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(destination) || destination.startsWith('#')) {
      return destination;
    }
    if (destination.startsWith('/')) {
      return absolute(site, `${site.baseUrl}${destination.slice(1)}`);
    }
    const file = localMarkdownFile(destination);
    if (file === undefined) {
      return new URL(destination, absolute(site, entry.permalink)).href;
    }
    if (file === null) {
      throw new Error(`${entry.source}: the link \`${destination}\` has a malformed \`%\` escape.`);
    }
    const suffixStart = destination.search(/[?#]/);
    const suffix = suffixStart === -1 ? '' : destination.slice(suffixStart);
    const source = path.posix.join(version.sourceDir, file);
    if (path.posix.dirname(source) === version.sourceDir && version.entries.some(({ source: s }) => s === source)) {
      return `${entryMarkdownUrl(path.posix.basename(source, '.md'), version, site)}${suffix}`;
    }
    const permalink = site.permalinks.get(source);
    if (permalink === undefined) {
      throw new Error(`${entry.source}: the link \`${destination}\` names ${source}, which has no page.`);
    }
    return `${absolute(site, permalink)}${suffix}`;
  });
}

/**
 * @param {string} id
 * @param {ResolvedVersion} version
 * @param {Site} site
 */
function entryMarkdownUrl(id, version, site) {
  return absolute(site, `${version.route}${id}.md`);
}

/**
 * @param {Site} site
 * @param {string} sitePath a path from the site root, base URL included
 */
function absolute(site, sitePath) {
  return `${site.siteUrl.replace(/\/$/, '')}${encodeURI(sitePath)}`;
}

/** @param {string[]} values */
function codes(values) {
  return values.map((value) => `\`${value}\``);
}

/** @param {string[]} values */
function codeList(values) {
  return codes(values).join(', ');
}

/**
 * `a`, `a and b`, `a, b and c`.
 *
 * @param {string[]} values
 */
function andList(values) {
  return values.length > 1 ? `${values.slice(0, -1).join(', ')} and ${values.at(-1)}` : values.join('');
}

/**
 * An entry's `schema`, with `any` for an entry that doesn't depend on the schema.
 *
 * @param {string[]} values
 */
function schemaList(values) {
  return values.length > 0 ? codeList(values) : '`any`';
}

module.exports = { writeOutputs };
