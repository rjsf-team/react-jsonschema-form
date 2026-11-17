// @ts-check
// Keeps upgrade guide entries out of the sidebar; the filtered page beside their directory stays in it. Entries are
// still pages, so search and the sitemap still list them; `unlisted` would drop them from both.

const { isUpgradeGuideDir } = require('./layout.js');

/** @typedef {import('@docusaurus/plugin-content-docs').PluginOptions['sidebarItemsGenerator']} SidebarItemsGenerator */
/** @typedef {Awaited<ReturnType<SidebarItemsGenerator>>} SidebarItems */

/** @type {SidebarItemsGenerator} */
async function sidebarItemsGenerator({ defaultSidebarItemsGenerator, ...args }) {
  const hidden = new Set(args.docs.filter((doc) => isUpgradeGuideDir(doc.sourceDirName)).map((doc) => doc.id));
  return withoutDocs(await defaultSidebarItemsGenerator(args), hidden);
}

/**
 * Drops the doc items in `hidden`, and any category left with neither items nor a link.
 *
 * @param {SidebarItems} items
 * @param {Set<string>} hidden
 * @returns {SidebarItems}
 */
function withoutDocs(items, hidden) {
  return items.flatMap((item) => {
    if (item.type === 'doc') {
      return hidden.has(item.id) ? [] : [item];
    }
    if (item.type !== 'category') {
      return [item];
    }
    const { link, ...category } = item;
    const keptLink = link?.type === 'doc' && hidden.has(link.id) ? undefined : link;
    const children = withoutDocs(item.items, hidden);
    if (children.length === 0 && keptLink === undefined) {
      return [];
    }
    return [{ ...category, items: children, ...(keptLink && { link: keptLink }) }];
  });
}

module.exports = { sidebarItemsGenerator };
