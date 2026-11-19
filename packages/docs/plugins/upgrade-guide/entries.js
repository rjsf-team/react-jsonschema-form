// @ts-check
// Reads every version's entries and checks them against the entry contract (contributing.md, `## Upgrade guide`).

const fs = require('node:fs/promises');
const path = require('node:path');

const { GUIDES_DIR, VERSION_DIR, filteredPageFile, filteredPageName } = require('./layout.js');
const { headings, linkDestinations } = require('./markdown.js');
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
 * @typedef {{
 *   name: string;
 *   number: number;
 *   sourceDir: string;
 *   entries: Entry[];
 *   anchors: Record<string, string[]>;
 *   packages: import('./vocabulary.js').Package[];
 * }} Version
 * `sourceDir` is the version's directory with the `@site` alias.
 *
 * @typedef {import('@docusaurus/types').ParseFrontMatter} ParseFrontMatter
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
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const ANCHORS_FILE = '_anchors.json';
/** Ids taken by the files postBuild writes beside the entries, and `index`, which would be the directory's own page. */
const RESERVED_IDS = ['index', 'all', 'llms'];

/**
 * @param {string} siteDir
 * @param {string} docsDir
 * @param {ParseFrontMatter} parseFrontMatter
 * @returns {Promise<Version[]>}
 */
async function loadVersions(siteDir, docsDir, parseFrontMatter) {
  const guidesDir = path.join(docsDir, GUIDES_DIR);
  const dirs = await fs.readdir(guidesDir, { withFileTypes: true }).catch(() => []);
  /** @type {string[]} */
  const errors = [];
  /** @type {Version[]} */
  const versions = [];
  for (const dir of dirs) {
    const match = dir.isDirectory() ? VERSION_DIR.exec(dir.name) : null;
    if (match) {
      versions.push(
        await loadVersion(
          siteDir,
          docsDir,
          path.join(guidesDir, dir.name),
          dir.name,
          Number(match[1]),
          parseFrontMatter,
          errors,
        ),
      );
    }
  }
  if (errors.length > 0) {
    throw new Error(
      `The upgrade guide has ${errors.length} ${errors.length === 1 ? 'problem' : 'problems'}:\n${errors
        .map((error) => `  - ${error}`)
        .join('\n')}`,
    );
  }
  return versions.sort((a, b) => a.number - b.number);
}

/**
 * @param {string} siteDir
 * @param {string} docsDir
 * @param {string} dir
 * @param {string} name
 * @param {number} number
 * @param {ParseFrontMatter} parseFrontMatter
 * @param {string[]} errors
 * @returns {Promise<Version>}
 */
async function loadVersion(siteDir, docsDir, dir, name, number, parseFrontMatter, errors) {
  const packages = packagesForVersion(number);
  const files = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  const relativeDir = path.relative(siteDir, dir);
  /** @type {Entry[]} */
  const entries = [];
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    const relativePath = path.join(relativeDir, file.name);
    if (file.name.startsWith('_')) {
      continue;
    }
    if (!file.isFile() || path.extname(file.name) !== '.md') {
      errors.push(`${relativePath}: an upgrade guide directory holds only \`<id>.md\` entries and \`_\` files.`);
      continue;
    }
    const entry = await loadEntry(siteDir, filePath, relativePath, parseFrontMatter, errors);
    if (entry) {
      entries.push(entry);
    }
  }

  const filteredPage = path.join(path.dirname(dir), filteredPageFile(name));
  if (!(await isFile(filteredPage))) {
    errors.push(
      `${path.relative(siteDir, filteredPage)}: missing; it is the ${name} filtered page, rendering \`<UpgradeGuide version="${name}" />\`.`,
    );
  }

  const ids = new Set(entries.map(({ id }) => id));
  const reserved = new Set([
    ...RESERVED_IDS,
    ...packages.filter(({ group }) => group === 'theme' || group === 'validator').map(({ short }) => short),
  ]);
  for (const entry of entries) {
    validateEntry(entry, packages, ids, reserved, path.join(relativeDir, `${entry.id}.md`), errors);
    await validateLinks(
      entry,
      { siteDir, docsDir, dir, name, ids, parseFrontMatter },
      path.join(relativeDir, `${entry.id}.md`),
      errors,
    );
  }

  return {
    name,
    number,
    sourceDir: toSitePath(siteDir, dir),
    entries,
    anchors: await loadAnchors(dir, relativeDir, ids, errors),
    packages,
  };
}

/**
 * @param {string} siteDir
 * @param {string} filePath
 */
function toSitePath(siteDir, filePath) {
  return `@site/${path.relative(siteDir, filePath).split(path.sep).join('/')}`;
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
  const fileContent = await fs.readFile(filePath, 'utf8');
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
    errors.push(`${relativePath}: unreadable frontmatter: ${error instanceof Error ? error.message : String(error)}`);
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
 * @param {Set<string>} reserved
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
  if (reserved.has(id)) {
    errors.push(`${at}: \`${id}\` is a reserved id (\`index\` or a file the build writes beside the entries).`);
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
 * A link to `<id>.md` in the entry's directory must name an entry; a link to any other `.md`/`.mdx` must name a file
 * under the docs directory that the docs plugin publishes: no `_` file or directory, no draft. Docusaurus only warns
 * about a broken one (`onBrokenMarkdownLinks`), and postBuild needs every one to have a page. No link may go to the
 * version's filtered page, which took over the single-page guide's URL: every section of that guide is an entry now.
 *
 * @param {Entry} entry
 * @param {{
 *   siteDir: string;
 *   docsDir: string;
 *   dir: string;
 *   name: string;
 *   ids: Set<string>;
 *   parseFrontMatter: ParseFrontMatter;
 * }} version
 * @param {string} at
 * @param {string[]} errors
 */
async function validateLinks(entry, { siteDir, docsDir, dir, name, ids, parseFrontMatter }, at, errors) {
  const guidePage = filteredPageName(name);
  for (const destination of linkDestinations(entry.body)) {
    if (namesPage(destination, guidePage)) {
      errors.push(`${at}: the link \`${destination}\` goes to the ${name} guide page; link the entry that covers it.`);
      continue;
    }
    const file = localMarkdownFile(destination);
    if (file === undefined) {
      continue;
    }
    if (file === null) {
      errors.push(`${at}: the link \`${destination}\` has a malformed \`%\` escape.`);
      continue;
    }
    const target = path.resolve(dir, file);
    if (path.dirname(target) === dir && target.endsWith('.md')) {
      if (!ids.has(path.basename(target, '.md'))) {
        errors.push(`${at}: the link \`${destination}\` names no entry of this version.`);
      }
      continue;
    }
    const unpublished = await whyUnpublished(target, docsDir, parseFrontMatter);
    if (unpublished) {
      errors.push(`${at}: the link \`${destination}\` names \`${path.relative(siteDir, target)}\`, ${unpublished}.`);
    }
  }
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
  const fileContent = await fs.readFile(target, 'utf8');
  try {
    const { frontMatter } = await parseFrontMatter({
      filePath: target,
      fileContent,
      defaultParseFrontMatter: parseFrontMatter,
    });
    return frontMatter.draft === true ? 'which is a draft' : undefined;
  } catch (error) {
    return `whose frontmatter is unreadable: ${error instanceof Error ? error.message : String(error)}`;
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
 * The file path a relative link to a Markdown file names, `null` for a relative link whose path has a malformed `%`
 * escape, or `undefined` for any other link.
 *
 * @param {string} destination
 * @returns {string | null | undefined}
 */
function localMarkdownFile(destination) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(destination) || destination.startsWith('/') || destination.startsWith('#')) {
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
 * `_anchors.json` maps a heading anchor of the version's single-page guide to the entry id (or ids) it became.
 *
 * @param {string} dir
 * @param {string} relativeDir
 * @param {Set<string>} ids
 * @param {string[]} errors
 * @returns {Promise<Record<string, string[]>>}
 */
async function loadAnchors(dir, relativeDir, ids, errors) {
  const at = path.join(relativeDir, ANCHORS_FILE);
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(await fs.readFile(path.join(dir, ANCHORS_FILE), 'utf8'));
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      return {};
    }
    errors.push(`${at}: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    errors.push(`${at}: must be an object mapping an old anchor to an entry id or a list of them.`);
    return {};
  }
  /** @type {Record<string, string[]>} */
  const anchors = {};
  for (const [anchor, value] of Object.entries(parsed)) {
    const targets = typeof value === 'string' ? [value] : value;
    if (!Array.isArray(targets) || targets.length === 0 || targets.some((target) => typeof target !== 'string')) {
      errors.push(`${at}: \`${anchor}\` must map to an entry id or a non-empty list of them.`);
      continue;
    }
    for (const target of targets) {
      if (!ids.has(target)) {
        errors.push(`${at}: \`${anchor}\` maps to \`${target}\`, which is not an entry of this version.`);
      }
    }
    anchors[anchor] = targets;
  }
  return anchors;
}

module.exports = { loadVersions, localMarkdownFile };
