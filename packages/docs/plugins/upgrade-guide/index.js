// @ts-check
// Upgrade guides as one Markdown entry per action a reader takes: `docs/migration-guides/v<N>/<id>.md`. The plugin
// validates every entry (failing the build on any problem), writes each version's entries' frontmatter and the
// vocabulary to `v<N>.json` in its generated data directory for the filtered page (`v<N>.x upgrade guide.mdx`, which
// renders src/components/UpgradeGuide), and writes agent-readable copies beside the entries after the build. The page
// imports that file lazily, so it ships only with the page; global data would put it in every page's bundle. An entry's
// body loads only when its row opens.

const path = require('node:path');

const { loadVersions } = require('./entries.js');
const { GUIDES_DIR } = require('./layout.js');
const { writeOutputs } = require('./outputs.js');
const { permalinksFromAllContent, permalinksFromPlugins, resolveVersions } = require('./resolve.js');
const { EVERY_USER_USE, HEADINGS, SCHEMA, USES } = require('./vocabulary.js');

/** @typedef {import('./entries.js').Version[]} Content */

const NAME = 'rjsf-upgrade-guide';

/**
 * @param {import('@docusaurus/types').LoadContext} context
 * @returns {import('@docusaurus/types').Plugin<Content>}
 */
function upgradeGuidePlugin(context) {
  const { siteDir, siteConfig, baseUrl } = context;
  const docsDir = path.join(siteDir, 'docs');
  const { parseFrontMatter } = siteConfig.markdown;

  return {
    name: NAME,

    getPathsToWatch() {
      return [path.join(docsDir, GUIDES_DIR, 'v*', '*'), path.join(docsDir, GUIDES_DIR, 'v*.x upgrade guide.mdx')];
    },

    // The site's own front matter parser, so an entry reads exactly as the docs plugin reads it. The site configures
    // none, so this is Docusaurus's default, which never calls `defaultParseFrontMatter`.
    loadContent() {
      return loadVersions(siteDir, docsDir, parseFrontMatter);
    },

    // allContentLoaded rather than contentLoaded: the permalinks come from the docs plugin's content.
    async allContentLoaded({ allContent, actions }) {
      const content = /** @type {Content} */ (allContent[NAME]?.default);
      const versions = resolveVersions(content, permalinksFromAllContent(allContent));
      for (const version of versions) {
        await actions.createData(
          `${version.name}.json`,
          JSON.stringify({
            uses: USES,
            everyUserUse: EVERY_USER_USE,
            schema: SCHEMA,
            headings: HEADINGS,
            packages: version.packages,
            entries: version.entries.map(
              ({ id, title, description, packages, uses, schema, affects, deprecated, permalink }) => ({
                id,
                title,
                description,
                packages,
                uses,
                schema,
                affects,
                deprecated,
                permalink,
              }),
            ),
            anchors: version.anchors,
            llmsTxt: `${version.route}llms.txt`,
            combined: Object.fromEntries(version.combined.map(({ key, path: file }) => [key, file])),
          }),
        );
      }
    },

    async postBuild({ content, plugins, outDir }) {
      const permalinks = permalinksFromPlugins(plugins);
      await writeOutputs(resolveVersions(content, permalinks), outDir, {
        siteUrl: siteConfig.url,
        baseUrl,
        permalinks,
      });
    },
  };
}

module.exports = upgradeGuidePlugin;
