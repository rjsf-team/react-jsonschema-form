// @ts-check
// Ties the loaded entries to the pages the docs plugin made of them, so every URL comes from the docs plugin's own
// permalinks rather than from a copy of its routing options.

const path = require('node:path');

const { filteredPageFile } = require('./layout.js');
const { ALWAYS_PACKAGES, KINDS } = require('./vocabulary.js');

/**
 * @typedef {import('./entries.js').Entry & { permalink: string }} ResolvedEntry
 *
 * @typedef {Omit<import('./entries.js').Version, 'entries'> & {
 *   route: string;
 *   page: string;
 *   entries: ResolvedEntry[];
 *   combined: { key: string; label: string; path: string; packageId?: string }[];
 * }} ResolvedVersion
 * `route` is the site path of the version's directory, base URL included, ending in `/`; `page` is the filtered page's
 * permalink. `entries` are in apply order. `combined` lists the combined Markdown files written beside the entries:
 * `all` and one per theme and validator.
 *
 * @typedef {Map<string, string>} Permalinks
 * Docs plugin permalinks keyed by `@site/…` source path.
 */

const DOCS_PLUGIN = 'docusaurus-plugin-content-docs';
const KIND_ORDER = KINDS.map(({ id }) => id);

/**
 * @param {Record<string, Record<string, unknown>>} allContent
 * @returns {Permalinks}
 */
function permalinksFromAllContent(allContent) {
  return permalinksOf(allContent[DOCS_PLUGIN]?.default);
}

/**
 * @param {import('@docusaurus/types').LoadedPlugin[]} plugins
 * @returns {Permalinks}
 */
function permalinksFromPlugins(plugins) {
  return permalinksOf(
    plugins.find((plugin) => plugin.name === DOCS_PLUGIN && plugin.options.id === 'default')?.content,
  );
}

/**
 * @param {unknown} content
 * @returns {Permalinks}
 */
function permalinksOf(content) {
  if (!content) {
    throw new Error('The upgrade guide plugin needs the default docs plugin.');
  }
  const { loadedVersions } = /** @type {import('@docusaurus/plugin-content-docs').LoadedContent} */ (content);
  return new Map(loadedVersions.flatMap((version) => version.docs.map((doc) => [doc.source, doc.permalink])));
}

/**
 * @param {import('./entries.js').Version[]} versions
 * @param {Permalinks} permalinks
 * @returns {ResolvedVersion[]}
 */
function resolveVersions(versions, permalinks) {
  return versions.flatMap((version) => {
    const entries = version.entries
      .map((entry) => {
        const permalink = permalinks.get(entry.source);
        if (permalink === undefined) {
          throw new Error(`The docs plugin made no page of ${entry.source}.`);
        }
        return { ...entry, permalink };
      })
      .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.id.localeCompare(b.id));
    // The `.md` copies, llms.txt and the combined files sit in the entries' directory, so a version needs one entry.
    const first = entries[0]?.permalink.replace(/\/$/, '');
    if (first === undefined) {
      return [];
    }
    const route = first.slice(0, first.lastIndexOf('/') + 1);
    const pageSource = path.posix.join(path.posix.dirname(version.sourceDir), filteredPageFile(version.name));
    const page = permalinks.get(pageSource);
    if (page === undefined) {
      throw new Error(`The docs plugin made no page of ${pageSource}.`);
    }
    for (const entry of entries) {
      // The `.md` copies sit at `<route><id>.md`, which is only beside the page if the page is `<route><id>`.
      if (entry.permalink.replace(/\/$/, '') !== `${route}${entry.id}`) {
        throw new Error(
          `${entry.source}: its page is ${entry.permalink}, not ${route}${entry.id}; entries take no slug.`,
        );
      }
    }
    const combined = [
      { key: 'all', label: 'All entries', path: `${route}all.md` },
      ...version.packages
        .filter(({ group }) => group === 'theme' || group === 'validator')
        .map((pkg) => ({
          key: pkg.short,
          label: pkg.removed ? `${pkg.id} (removed in ${version.name})` : pkg.id,
          path: `${route}${pkg.short}.md`,
          packageId: pkg.id,
        })),
    ];
    return [{ ...version, route, page, entries, combined }];
  });
}

/**
 * Whether an entry applies to a user of `packageId`: every user has the vocabulary's `always` packages.
 *
 * @param {{ packages: string[] }} entry
 * @param {string} packageId
 */
function appliesToPackage(entry, packageId) {
  return entry.packages.some((pkg) => pkg === packageId || ALWAYS_PACKAGES.includes(pkg));
}

module.exports = { permalinksFromAllContent, permalinksFromPlugins, resolveVersions, appliesToPackage };
