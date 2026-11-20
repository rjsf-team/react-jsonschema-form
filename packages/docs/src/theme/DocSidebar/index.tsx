import type { ReactNode } from 'react';
import type { PropSidebarItem } from '@docusaurus/plugin-content-docs';
import { GUIDES_DIR, filteredPageName } from '@site/plugins/upgrade-guide/layout.js';
import DocSidebar from '@theme-original/DocSidebar';
import type { Props } from '@theme/DocSidebar';

const ENTRY_PATH = new RegExp(`/${GUIDES_DIR}/(v\\d+)/[^/]+/?$`);

/** The href of the sidebar item that links to the page whose decoded path ends with `pagePath`. */
function findHref(items: readonly PropSidebarItem[], pagePath: string): string | undefined {
  for (const item of items) {
    if (item.type === 'html') {
      continue;
    }
    if (item.href !== undefined && decodeURI(item.href).replace(/\/$/, '').endsWith(pagePath)) {
      return item.href;
    }
    const found = item.type === 'category' ? findHref(item.items, pagePath) : undefined;
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

/**
 * An upgrade guide entry's page is left out of the sidebar, so the sidebar marks the entry's filtered page as the
 * current one: its category opens and the reader sees where to go back to.
 */
export default function DocSidebarWrapper(props: Props): ReactNode {
  const version = ENTRY_PATH.exec(decodeURI(props.path))?.[1];
  const guideHref =
    version === undefined ? undefined : findHref(props.sidebar, `/${GUIDES_DIR}/${filteredPageName(version)}`);
  return <DocSidebar {...props} path={guideHref ?? props.path} />;
}
