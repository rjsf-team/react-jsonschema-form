// @ts-check
// Reads every version's entries and checks them against the entry contract (contributing.md, `## Upgrade guide`).

const fs = require('node:fs/promises');
const path = require('node:path');

const { createSlugger, parseMarkdownHeadingId } = require('@docusaurus/utils');

const { GUIDES_DIR, VERSION_DIR, filteredPageFile, filteredPageName } = require('./layout.js');
const { FRONT_MATTER, headings, linkDestinations } = require('./markdown.js');
const { AFFECTS, SCHEMA, USES, packagesForVersion } = require('./vocabulary.js');

/**
 * @typedef {{
 *   id: string;
 *   source: string;
 *   title: string;
 *   description: string;
 *   packages: string[];
 *   uses: string[];
 *   schema: string[];
 *   affects: string[];
 *   deprecated: boolean;
 *   related: string[];
 *   frontMatter: string;
 *   body: string;
 * }} Entry
 * `source` is the file's path with Docusaurus's `@site` alias, the docs plugin's key for it. `frontMatter` is the raw
 * YAML between the `---` lines.
 *
 * @typedef {{ source: string; hash: string }} PageAnchor
 * The doc an anchor goes to: `source` is its path with the `@site` alias, `hash` is `''` or `#` and one of its
 * headings' anchors.
 *
 * @typedef {{
 *   name: string;
 *   number: number;
 *   sourceDir: string;
 *   entries: Entry[];
 *   anchors: Record<string, string[]>;
 *   pageAnchors: Record<string, PageAnchor>;
 *   packages: import('./vocabulary.js').Package[];
 * }} Version
 * `sourceDir` is the version's directory with the `@site` alias. `anchors` and `pageAnchors` are `_anchors.json`'s
 * mappings to entries and to other docs (see loadAnchors).
 *
 * @typedef {import('@docusaurus/types').ParseFrontMatter} ParseFrontMatter
 *
 * @typedef {(target: string) => Promise<string | undefined>} WhyUnpublished
 * Why the docs plugin makes no page of the Markdown file `target`, or `undefined` if it makes one.
 */

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ID_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 260;
const FIELDS = ['title', 'description', 'packages', 'uses', 'schema', 'affects', 'deprecated', 'related'];
/** Docusaurus shows a frontmatter `title` as written, so Markdown in it would show literally. `_` is let through for
 * identifiers such as `ADDITIONAL_PROPERTY_FLAG`. */
const TITLE_MARKDOWN = /[`*[<]/;
const SECTIONS = ['Detect', 'Change', 'Verify'];
const OPTIONAL_LAST_SECTION = "If you can't preserve it";
const ANCHORS_FILE = '_anchors.json';
/** Ids an entry can't take, each with why: the files postBuild writes beside the entries, and the names Docusaurus
 * reads as the directory's own page (`index`, `readme`, and the directory's name, added per version). */
/** @type {Map<string, string>} */
const RESERVED_IDS = new Map([
  ['index', "Docusaurus makes `index.md` the directory's own page"],
  ['readme', "Docusaurus makes `readme.md` the directory's own page"],
  ['all', 'the build writes `all.md` beside the entries'],
  ['llms', 'the build writes `llms.txt` beside the entries'],
]);

/**
 * @param {string} siteDir
 * @param {string} docsDir
 * @param {ParseFrontMatter} parseFrontMatter
 * @param {string} changelogDir the directory holding each version's `CHANGELOG-v<N>.md`, if it has one
 * @returns {Promise<Version[]>}
 */
async function loadVersions(siteDir, docsDir, parseFrontMatter, changelogDir) {
  const guidesDir = path.join(docsDir, GUIDES_DIR);
  const dirs = await fs.readdir(guidesDir, { withFileTypes: true }).catch(() => []);
  const whyUnpublished = cachedWhyUnpublished(docsDir, parseFrontMatter);
  /** @type {string[]} */
  const errors = [];
  const versions = await mapInOrder(
    dirs,
    (dir, versionErrors) => {
      const match = dir.isDirectory() ? VERSION_DIR.exec(dir.name) : null;
      return match
        ? loadVersion(
            siteDir,
            path.join(guidesDir, dir.name),
            dir.name,
            Number(match[1]),
            { parseFrontMatter, whyUnpublished, changelogDir },
            versionErrors,
          )
        : Promise.resolve(undefined);
    },
    errors,
  );
  if (errors.length > 0) {
    throw new Error(
      `The upgrade guide has ${errors.length} ${errors.length === 1 ? 'problem' : 'problems'}:\n${errors
        .map((error) => `  - ${error}`)
        .join('\n')}`,
    );
  }
  return versions.flatMap((version) => (version ? [version] : [])).sort((a, b) => a.number - b.number);
}

/**
 * `map` over every item at once, each call with its own error list, appending the lists to `errors` in `items`' order
 * so the problems are listed in the same order however the reads finish.
 *
 * @template T, R
 * @param {T[]} items
 * @param {(item: T, errors: string[]) => Promise<R>} map
 * @param {string[]} errors
 * @returns {Promise<R[]>}
 */
async function mapInOrder(items, map, errors) {
  const results = await Promise.all(
    items.map(async (item) => {
      /** @type {string[]} */
      const own = [];
      return { value: await map(item, own), own };
    }),
  );
  for (const { own } of results) {
    errors.push(...own);
  }
  return results.map(({ value }) => value);
}

/**
 * @typedef {{ parseFrontMatter: ParseFrontMatter; whyUnpublished: WhyUnpublished; changelogDir: string }} Sources
 */

/**
 * @param {string} siteDir
 * @param {string} dir
 * @param {string} name
 * @param {number} number
 * @param {Sources} sources
 * @param {string[]} errors
 * @returns {Promise<Version>}
 */
async function loadVersion(siteDir, dir, name, number, { parseFrontMatter, whyUnpublished, changelogDir }, errors) {
  const packages = packagesForVersion(number);
  const files = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  const relativeDir = path.relative(siteDir, dir);
  const loaded = await mapInOrder(
    files,
    (file, fileErrors) => {
      const relativePath = path.join(relativeDir, file.name);
      if (file.name.startsWith('_')) {
        return Promise.resolve(undefined);
      }
      if (!file.isFile() || path.extname(file.name) !== '.md') {
        fileErrors.push(`${relativePath}: an upgrade guide directory holds only \`<id>.md\` entries and \`_\` files.`);
        return Promise.resolve(undefined);
      }
      return loadEntry(siteDir, path.join(dir, file.name), relativePath, parseFrontMatter, fileErrors);
    },
    errors,
  );
  const entries = loaded.flatMap((entry) => (entry ? [entry] : []));

  const filteredPage = path.join(path.dirname(dir), filteredPageFile(name));
  if (!(await isFile(filteredPage))) {
    errors.push(
      `${path.relative(siteDir, filteredPage)}: missing; it is the ${name} filtered page, rendering \`<UpgradeGuide version="${name}" />\`.`,
    );
  }

  const ids = new Set(entries.map(({ id }) => id));
  const reserved = new Map([
    ...RESERVED_IDS,
    [name, `Docusaurus makes \`${name}.md\` in \`${name}/\` the directory's own page`],
    ...packages
      .filter(({ group }) => group === 'theme' || group === 'validator')
      .map(
        ({ short }) => /** @type {[string, string]} */ ([short, `the build writes \`${short}.md\` beside the entries`]),
      ),
  ]);
  const context = { siteDir, dir, name, ids, whyUnpublished };
  await mapInOrder(
    entries,
    (entry, entryErrors) => {
      const at = path.join(relativeDir, `${entry.id}.md`);
      validateEntry(entry, packages, ids, reserved, at, entryErrors);
      return validateLinks(entry, context, at, entryErrors);
    },
    errors,
  );

  const anchors = await loadAnchors(context, relativeDir, errors);
  await validateChangelogLinks(changelogDir, name, ids, anchors, errors);

  return {
    name,
    number,
    sourceDir: toSitePath(siteDir, dir),
    entries,
    ...anchors,
    packages,
  };
}

/**
 * Every link `CHANGELOG-<name>.md` makes into the guide must name an entry or an `_anchors.json` key: a link to the
 * filtered page's `#<anchor>`, which the page opens, or to an entry's own page `<name>/<id>`. A release copies its
 * changelog into a GitHub Release, where a link that stops working can't be fixed.
 *
 * @param {string} changelogDir
 * @param {string} name
 * @param {Set<string>} ids
 * @param {Pick<Version, 'anchors' | 'pageAnchors'>} anchors
 * @param {string[]} errors
 */
async function validateChangelogLinks(changelogDir, name, ids, { anchors, pageAnchors }, errors) {
  const file = `CHANGELOG-${name}.md`;
  /** @type {string} */
  let changelog;
  try {
    changelog = await readText(path.join(changelogDir, file));
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ENOENT') {
      errors.push(`${file}: ${errorMessage(error)}`);
    }
    return;
  }
  const page = escapeRegExp(`${GUIDES_DIR}/${encodeURI(filteredPageName(name))}#`);
  const entryPage = escapeRegExp(`${GUIDES_DIR}/${name}/`);
  // An entry's page path stops where its id does; `<name>/llms.txt` and the `.md` copies are files, not entries.
  const link = new RegExp(`${page}([^\\s()<>"'\\]]+)|${entryPage}([a-z0-9-]+)(?![\\w.-])`, 'g');
  /** @param {string} anchor */
  const resolves = (anchor) => ids.has(anchor) || Object.hasOwn(anchors, anchor) || Object.hasOwn(pageAnchors, anchor);
  changelog.split('\n').forEach((line, index) => {
    for (const [match, hash, id] of line.matchAll(link)) {
      if (!resolves(hash === undefined ? id : decodeAnchor(hash))) {
        errors.push(
          `${file}:${index + 1}: the link \`${match}\` names neither an entry of ${name} nor an \`${ANCHORS_FILE}\` key.`,
        );
      }
    }
  });
}

/** @param {string} anchor */
function decodeAnchor(anchor) {
  try {
    return decodeURIComponent(anchor);
  } catch {
    return anchor;
  }
}

/** @param {string} text */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @param {unknown} error */
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {string} siteDir
 * @param {string} filePath
 */
function toSitePath(siteDir, filePath) {
  return `@site/${path.relative(siteDir, filePath).split(path.sep).join('/')}`;
}

/**
 * A text file with `\n` line endings, so a checkout with CRLF ones reads the same.
 *
 * @param {string} filePath
 */
async function readText(filePath) {
  return (await fs.readFile(filePath, 'utf8')).replace(/\r\n?/g, '\n');
}

/** @param {string} filePath */
function isFile(filePath) {
  return fs.stat(filePath).then(
    (stat) => stat.isFile(),
    () => false,
  );
}

/**
 * @param {string} siteDir
 * @param {string} filePath
 * @param {string} relativePath
 * @param {ParseFrontMatter} parseFrontMatter
 * @param {string[]} errors
 * @returns {Promise<Entry | undefined>}
 */
async function loadEntry(siteDir, filePath, relativePath, parseFrontMatter, errors) {
  const fileContent = await readText(filePath);
  const rawFrontMatter = FRONT_MATTER.exec(fileContent);
  if (!rawFrontMatter) {
    errors.push(`${relativePath}: no frontmatter; an entry starts with a \`---\` block.`);
    return undefined;
  }
  /** @type {Record<string, unknown>} */
  let frontMatter;
  try {
    ({ frontMatter } = await parseFrontMatter({ filePath, fileContent, defaultParseFrontMatter: parseFrontMatter }));
  } catch (error) {
    errors.push(`${relativePath}: unreadable frontmatter: ${errorMessage(error)}`);
    return undefined;
  }
  /** @param {unknown} value */
  const strings = (value) => (Array.isArray(value) ? value : []);
  const entry = {
    id: path.basename(filePath, '.md'),
    source: toSitePath(siteDir, filePath),
    title: typeof frontMatter.title === 'string' ? frontMatter.title : '',
    description: typeof frontMatter.description === 'string' ? frontMatter.description : '',
    packages: strings(frontMatter.packages),
    uses: strings(frontMatter.uses),
    schema: strings(frontMatter.schema),
    affects: strings(frontMatter.affects),
    deprecated: frontMatter.deprecated === true,
    related: strings(frontMatter.related),
    frontMatter: rawFrontMatter[1],
    body: fileContent.slice(rawFrontMatter[0].length),
  };
  validateFrontMatterTypes(frontMatter, relativePath, errors);
  return entry;
}

/**
 * Presence and shape: the checks that need the parsed frontmatter before it's coerced into an Entry. The value checks
 * in validateEntry skip what fails here, so each problem is reported once.
 *
 * @param {Record<string, unknown>} frontMatter
 * @param {string} at
 * @param {string[]} errors
 */
function validateFrontMatterTypes(frontMatter, at, errors) {
  for (const key of Object.keys(frontMatter)) {
    if (!FIELDS.includes(key)) {
      errors.push(
        `${at}: unknown frontmatter field \`${key}\`; the fields are ${FIELDS.map((f) => `\`${f}\``).join(', ')}.`,
      );
    }
  }
  for (const key of ['title', 'description']) {
    const value = frontMatter[key];
    if (Array.isArray(value)) {
      errors.push(`${at}: \`${key}\` is a list; it takes one value.`);
    } else if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${at}: \`${key}\` is required and must be a non-empty string.`);
    }
  }
  for (const key of ['packages', 'uses', 'schema', 'affects', 'related']) {
    const value = frontMatter[key];
    const required = key === 'packages' || key === 'uses' || key === 'affects';
    if (value === undefined && !required) {
      continue;
    }
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
      errors.push(`${at}: \`${key}\` ${required ? 'is required and ' : ''}must be a list of strings.`);
    } else if (required && value.length === 0) {
      errors.push(`${at}: \`${key}\` needs at least one value.`);
    }
  }
  if (frontMatter.deprecated !== undefined && frontMatter.deprecated !== true) {
    errors.push(`${at}: \`deprecated\` is \`true\` or left out.`);
  }
}

/**
 * @param {Entry} entry
 * @param {import('./vocabulary.js').Package[]} packages
 * @param {Set<string>} ids
 * @param {Map<string, string>} reserved why each reserved id is taken
 * @param {string} at
 * @param {string[]} errors
 */
function validateEntry(entry, packages, ids, reserved, at, errors) {
  const { id, title, description } = entry;
  if (!ID.test(id) || id.length > MAX_ID_LENGTH) {
    errors.push(
      `${at}: the id (the file name) must be lowercase kebab-case \`[a-z0-9-]\`, at most ${MAX_ID_LENGTH} chars.`,
    );
  }
  if (/^\d+-/.test(id)) {
    // Docusaurus's number prefix parser would strip the digits from the page's URL.
    errors.push(`${at}: the id must not start with digits followed by \`-\`.`);
  }
  const reservedBecause = reserved.get(id);
  if (reservedBecause) {
    errors.push(`${at}: \`${id}\` is a reserved id: ${reservedBecause}.`);
  }

  const single = entry.packages.length === 1 ? packages.find(({ id: pkg }) => pkg === entry.packages[0]) : undefined;
  if (single && (single.group === 'theme' || single.group === 'validator') && !id.startsWith(`${single.short}-`)) {
    errors.push(`${at}: an entry only for \`${single.id}\` has an id starting with \`${single.short}-\`.`);
  }

  if (/\n/.test(title)) {
    errors.push(`${at}: \`title\` must be one line.`);
  }
  if (/BREAKING CHANGE/i.test(title)) {
    errors.push(`${at}: \`title\` has no \`BREAKING CHANGE\` suffix.`);
  }
  if (TITLE_MARKDOWN.test(title)) {
    errors.push(`${at}: \`title\` is plain text, with no backtick, \`*\`, \`[\` or \`<\`.`);
  }
  if (/\n/.test(description)) {
    errors.push(`${at}: \`description\` must be one line.`);
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`${at}: \`description\` is ${description.length} chars; the limit is ${MAX_DESCRIPTION_LENGTH}.`);
  }

  validateList(
    entry.packages,
    'packages',
    packages.map((pkg) => pkg.id),
    at,
    errors,
  );
  if (entry.packages.includes('*') && entry.packages.length > 1) {
    errors.push(`${at}: \`packages: ['*']\` already means every package; list nothing beside it.`);
  }
  validateList(
    entry.uses,
    'uses',
    USES.map((use) => use.id),
    at,
    errors,
  );
  validateList(
    entry.schema,
    'schema',
    SCHEMA.map((feature) => feature.id),
    at,
    errors,
  );
  validateList(
    entry.affects,
    'affects',
    AFFECTS.map((affects) => affects.id),
    at,
    errors,
  );
  for (const related of entry.related) {
    if (related === id) {
      errors.push(`${at}: \`related\` lists the entry itself.`);
    } else if (!ids.has(related)) {
      errors.push(`${at}: \`related\` names \`${related}\`, which is not an entry of this version.`);
    }
  }
  if (new Set(entry.related).size !== entry.related.length) {
    errors.push(`${at}: \`related\` lists an id twice.`);
  }

  validateSections(entry.body, at, errors);
}

/**
 * @param {string[]} values
 * @param {string} field
 * @param {string[]} allowed
 * @param {string} at
 * @param {string[]} errors
 */
function validateList(values, field, allowed, at, errors) {
  for (const value of values) {
    if (!allowed.includes(value)) {
      errors.push(
        `${at}: \`${field}\` value \`${value}\` is not in the vocabulary (plugins/upgrade-guide/vocabulary.js).`,
      );
    }
  }
  if (new Set(values).size !== values.length) {
    errors.push(`${at}: \`${field}\` lists a value twice.`);
  }
}

/**
 * The body is the sections Detect, Change, Verify and optionally "If you can't preserve it", in that order, as `##`
 * headings, with nothing before the first. Deeper headings are free inside a section.
 *
 * @param {string} body
 * @param {string} at
 * @param {string[]} errors
 */
function validateSections(body, at, errors) {
  const found = headings(body);
  if (found.some(({ level }) => level === 1)) {
    errors.push(`${at}: the body has a \`#\` heading; the frontmatter \`title\` is the page title.`);
  }
  const sections = found.filter(({ level }) => level === 2).map(({ text }) => text);
  const expected = sections.at(-1) === OPTIONAL_LAST_SECTION ? [...SECTIONS, OPTIONAL_LAST_SECTION] : SECTIONS;
  if (sections.join('\n') !== expected.join('\n')) {
    errors.push(
      `${at}: the \`##\` sections are ${sections.map((s) => `"${s}"`).join(', ') || 'missing'}; expected ${SECTIONS.map(
        (s) => `"${s}"`,
      ).join(', ')}, then optionally "${OPTIONAL_LAST_SECTION}".`,
    );
  }
  const firstSection = body.search(/^##[ \t]/m);
  if (firstSection > 0 && body.slice(0, firstSection).trim() !== '') {
    errors.push(`${at}: the body has text before \`## ${SECTIONS[0]}\`.`);
  }
}

/**
 * @typedef {{
 *   siteDir: string;
 *   dir: string;
 *   name: string;
 *   ids: Set<string>;
 *   whyUnpublished: WhyUnpublished;
 * }} VersionContext
 * `dir` is the version's directory and `name` its name, e.g. `v7`; `ids` are its entries' ids.
 */

/**
 * A link to `<id>.md` in the entry's directory must name an entry; a link to any other `.md`/`.mdx` must name a file
 * under the docs directory that the docs plugin publishes: no `_` file or directory, no draft. Docusaurus only warns
 * about a broken one (`onBrokenMarkdownLinks`), and postBuild needs every one to have a page. No link may go to the
 * version's filtered page: a link names the entry that covers the change.
 *
 * @param {Entry} entry
 * @param {VersionContext} version
 * @param {string} at
 * @param {string[]} errors
 */
async function validateLinks(entry, { siteDir, dir, name, ids, whyUnpublished }, at, errors) {
  const guidePage = filteredPageName(name);
  const checks = linkDestinations(entry.body).map(async (destination) => {
    if (namesPage(destination, guidePage)) {
      return `the link \`${destination}\` goes to the ${name} guide page; link the entry that covers it`;
    }
    const file = localMarkdownFile(destination);
    if (file === undefined) {
      return undefined;
    }
    if (file === null) {
      return `the link \`${destination}\` has a malformed \`%\` escape`;
    }
    const target = path.resolve(dir, file);
    if (path.dirname(target) === dir && target.endsWith('.md')) {
      return ids.has(path.basename(target, '.md'))
        ? undefined
        : `the link \`${destination}\` names no entry of this version`;
    }
    const unpublished = await whyUnpublished(target);
    return unpublished && `the link \`${destination}\` names \`${path.relative(siteDir, target)}\`, ${unpublished}`;
  });
  for (const problem of await Promise.all(checks)) {
    if (problem) {
      errors.push(`${at}: ${problem}.`);
    }
  }
}

/**
 * whyUnpublished, reading and parsing each target once however many entries link it.
 *
 * @param {string} docsDir
 * @param {ParseFrontMatter} parseFrontMatter
 * @returns {WhyUnpublished}
 */
function cachedWhyUnpublished(docsDir, parseFrontMatter) {
  /** @type {Map<string, Promise<string | undefined>>} */
  const reasons = new Map();
  return (target) => {
    let reason = reasons.get(target);
    if (reason === undefined) {
      reason = whyUnpublished(target, docsDir, parseFrontMatter);
      reasons.set(target, reason);
    }
    return reason;
  };
}

/**
 * Why the docs plugin makes no page of the Markdown file `target`, or `undefined` if it makes one. These are its
 * default `exclude` globs (the site sets none) and production's dropping of drafts.
 *
 * @param {string} target
 * @param {string} docsDir
 * @param {ParseFrontMatter} parseFrontMatter
 * @returns {Promise<string | undefined>}
 */
async function whyUnpublished(target, docsDir, parseFrontMatter) {
  const relative = path.relative(docsDir, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return 'which is outside the docs directory';
  }
  if (relative.split(path.sep).some((segment) => segment.startsWith('_'))) {
    return 'which the docs plugin skips as a `_` file or directory';
  }
  if (!(await isFile(target))) {
    return "which doesn't exist";
  }
  const fileContent = await readText(target);
  try {
    const { frontMatter } = await parseFrontMatter({
      filePath: target,
      fileContent,
      defaultParseFrontMatter: parseFrontMatter,
    });
    return frontMatter.draft === true ? 'which is a draft' : undefined;
  } catch (error) {
    return `whose frontmatter is unreadable: ${errorMessage(error)}`;
  }
}

/**
 * Whether a link destination, relative or absolute, names the page whose file name without extension is `page`.
 *
 * @param {string} destination
 * @param {string} page
 */
function namesPage(destination, page) {
  const withoutSuffix = destination.replace(/[?#].*$/, '');
  let decoded = withoutSuffix;
  try {
    decoded = decodeURI(withoutSuffix);
  } catch {
    // A malformed escape can't spell the page's name.
  }
  return (
    decoded
      .replace(/\/$/, '')
      .replace(/\.mdx?$/, '')
      .split('/')
      .at(-1) === page
  );
}

/**
 * What a link destination is relative to: nothing (`external`, with a scheme), the site root (`site`), the page
 * (`fragment`, a bare `#anchor`) or the linking file (`relative`).
 *
 * @param {string} destination
 * @returns {'external' | 'site' | 'fragment' | 'relative'}
 */
function linkKind(destination) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(destination)) {
    return 'external';
  }
  if (destination.startsWith('#')) {
    return 'fragment';
  }
  return destination.startsWith('/') ? 'site' : 'relative';
}

/**
 * The file path a relative link to a Markdown file names, `null` for a relative link whose path has a malformed `%`
 * escape, or `undefined` for any other link.
 *
 * @param {string} destination
 * @returns {string | null | undefined}
 */
function localMarkdownFile(destination) {
  if (linkKind(destination) !== 'relative') {
    return undefined;
  }
  let file;
  try {
    file = decodeURI(destination.replace(/[?#].*$/, ''));
  } catch {
    return null;
  }
  return /\.mdx?$/.test(file) ? file : undefined;
}

/**
 * `_anchors.json` maps an anchor the filtered page's URL can carry, such as a heading of a guide the page replaced, to
 * what it names now. The value is an entry id or a list of them, which the page opens or lists, or a relative link to
 * another published doc's `.md`/`.mdx` file, with an optional `#anchor` that must be one of its headings', which the
 * page goes to. The page follows a mapping even when the anchor is also an entry's id.
 *
 * @param {VersionContext} version
 * @param {string} relativeDir
 * @param {string[]} errors
 * @returns {Promise<Pick<Version, 'anchors' | 'pageAnchors'>>}
 */
async function loadAnchors(version, relativeDir, errors) {
  const { siteDir, dir, ids } = version;
  const at = path.join(relativeDir, ANCHORS_FILE);
  /** @type {Record<string, string[]>} */
  const anchors = {};
  /** @type {Record<string, PageAnchor>} */
  const pageAnchors = {};
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(await fs.readFile(path.join(dir, ANCHORS_FILE), 'utf8'));
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ENOENT') {
      errors.push(`${at}: ${errorMessage(error)}`);
    }
    return { anchors, pageAnchors };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    errors.push(`${at}: must be an object mapping an anchor to an entry id, a list of them or a link to a doc.`);
    return { anchors, pageAnchors };
  }
  /** @type {Map<string, Promise<string[]>>} */
  const headingIdsByFile = new Map();
  for (const [anchor, value] of Object.entries(parsed)) {
    const file = typeof value === 'string' ? localMarkdownFile(value) : undefined;
    if (file === null) {
      errors.push(`${at}: \`${anchor}\` maps to \`${value}\`, which has a malformed \`%\` escape.`);
      continue;
    }
    if (file !== undefined) {
      const target = path.resolve(dir, file);
      const hash = value.includes('#') ? value.slice(value.indexOf('#')) : '';
      const problem = await whyPageAnchorFails(value, target, hash, version, headingIdsByFile);
      if (problem) {
        errors.push(`${at}: \`${anchor}\` maps to \`${value}\`, ${problem}.`);
      } else {
        pageAnchors[anchor] = { source: toSitePath(siteDir, target), hash };
      }
      continue;
    }
    const targets = typeof value === 'string' ? [value] : value;
    if (!Array.isArray(targets) || targets.length === 0 || targets.some((target) => typeof target !== 'string')) {
      errors.push(`${at}: \`${anchor}\` must map to an entry id, a non-empty list of them or a link to a doc.`);
      continue;
    }
    for (const target of targets) {
      if (!ids.has(target)) {
        errors.push(`${at}: \`${anchor}\` maps to \`${target}\`, which is not an entry of this version.`);
      }
    }
    anchors[anchor] = targets;
  }
  return { anchors, pageAnchors };
}

/**
 * Why `_anchors.json` can't map an anchor to the doc link `value`, which names `target` and `hash`, or `undefined` if
 * it can.
 *
 * @param {string} value
 * @param {string} target
 * @param {string} hash
 * @param {VersionContext} version
 * @param {Map<string, Promise<string[]>>} headingIdsByFile
 * @returns {Promise<string | undefined>}
 */
async function whyPageAnchorFails(value, target, hash, { siteDir, dir, name, whyUnpublished }, headingIdsByFile) {
  if (namesPage(value, filteredPageName(name))) {
    return `the ${name} guide page itself`;
  }
  if (path.dirname(target) === dir) {
    return "a file of the entries' directory; map to an entry by its id";
  }
  const unpublished = await whyUnpublished(target);
  if (unpublished) {
    return `\`${path.relative(siteDir, target)}\`, ${unpublished}`;
  }
  if (hash === '') {
    return undefined;
  }
  let ids = headingIdsByFile.get(target);
  if (ids === undefined) {
    ids = readText(target).then(headingIds);
    headingIdsByFile.set(target, ids);
  }
  return (await ids).includes(hash.slice(1)) ? undefined : `whose page has no heading with the anchor \`${hash}\``;
}

/**
 * The anchor Docusaurus gives each heading outside code, from its own `{#id}` parser and slugger. Docusaurus slugs the
 * text a heading shows, so a link in it counts as its text.
 *
 * @param {string} markdown
 */
function headingIds(markdown) {
  const slugger = createSlugger();
  return headings(markdown.replace(FRONT_MATTER, '')).map(
    ({ text }) => parseMarkdownHeadingId(text).id ?? slugger.slug(text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')),
  );
}

module.exports = { headingIds, linkKind, loadVersions, localMarkdownFile };
