// @ts-check
// Keeps upgrade guide entries out of the sidebar; the filtered page beside their directory stays in it. Entries are
// still pages, so search and the sitemap still list them; `unlisted` would drop them from both. A version's
// `whats-new-v<N>` page is listed under its filtered page rather than beside it.

const { GUIDES_DIR, isUpgradeGuideDir } = require('./layout.js');

/** @typedef {import('@docusaurus/plugin-content-docs').PluginOptions['sidebarItemsGenerator']} SidebarItemsGenerator */
/** @typedef {Awaited<ReturnType<SidebarItemsGenerator>>} SidebarItems */

/** @type {SidebarItemsGenerator} */
async function sidebarItemsGenerator({ defaultSidebarItemsGenerator, ...args }) {
  const hidden = new Set(args.docs.filter((doc) => isUpgradeGuideDir(doc.sourceDirName)).map((doc) => doc.id));
  const titles = new Map(args.docs.map((doc) => [doc.id, doc.frontMatter.sidebar_label ?? doc.title]));
  return withWhatsNewNested(withoutDocs(await defaultSidebarItemsGenerator(args), hidden), titles);
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

/**
 * Lists each version's `whats-new-v<N>` doc under that version's filtered page, which becomes a category linking to it.
 *
 * @param {SidebarItems} items
 * @param {Map<string, string>} titles
 * @returns {SidebarItems}
 */
function withWhatsNewNested(items, titles) {
  const docIds = new Set(items.flatMap((item) => (item.type === 'doc' ? [item.id] : [])));
  /** @param {string} id */
  const whatsNewOf = (id) => {
    const version = new RegExp(`^${GUIDES_DIR}/(v\\d+)\\.x upgrade guide$`).exec(id)?.[1];
    const whatsNew = `${GUIDES_DIR}/whats-new-${version}`;
    return version && docIds.has(whatsNew) ? whatsNew : undefined;
  };
  const nested = new Set(items.flatMap((item) => (item.type === 'doc' ? (whatsNewOf(item.id) ?? []) : [])));
  return items.flatMap((item) => {
    if (item.type === 'category') {
      return [{ ...item, items: withWhatsNewNested(item.items, titles) }];
    }
    if (item.type !== 'doc') {
      return [item];
    }
    if (nested.has(item.id)) {
      return [];
    }
    const whatsNew = whatsNewOf(item.id);
    if (whatsNew === undefined) {
      return [item];
    }
    return [
      {
        type: 'category',
        label: item.label ?? titles.get(item.id) ?? item.id,
        link: { type: 'doc', id: item.id },
        items: [{ type: 'doc', id: whatsNew }],
      },
    ];
  });
}

module.exports = { sidebarItemsGenerator };
