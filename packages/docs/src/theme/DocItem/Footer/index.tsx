import type { ReactNode } from 'react';
import { useDoc, useDocsVersion } from '@docusaurus/plugin-content-docs/client';
import { isUpgradeGuideDir } from '@site/plugins/upgrade-guide/layout.js';
import { relatedLinks } from '@site/src/components/UpgradeGuide/filters.ts';
import { ReadWith } from '@site/src/components/UpgradeGuide/ReadWith.tsx';
import Footer from '@theme-original/DocItem/Footer';

/**
 * An upgrade guide entry's page lists the entries its `related` names above the footer. Their titles come from the
 * docs plugin's version metadata, so the links render with the page on the server.
 */
export default function FooterWrapper(): ReactNode {
  const { metadata, frontMatter } = useDoc();
  const { docs } = useDocsVersion();
  const { related } = frontMatter as { related?: string[] };
  return (
    <>
      {isUpgradeGuideDir(metadata.sourceDirName) && related !== undefined && (
        <ReadWith entries={relatedLinks(metadata, related, docs)} />
      )}
      <Footer />
    </>
  );
}
