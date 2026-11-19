import type { ReactNode } from 'react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { isUpgradeGuideDir } from '@site/plugins/upgrade-guide/layout.js';
import { EntryReadWith } from '@site/src/components/UpgradeGuide/ReadWith.tsx';
import Footer from '@theme-original/DocItem/Footer';

/** An upgrade guide entry's page lists the entries its `related` names above the footer. */
export default function FooterWrapper(): ReactNode {
  const { metadata, frontMatter } = useDoc();
  const { related } = frontMatter as { related?: string[] };
  return (
    <>
      {isUpgradeGuideDir(metadata.sourceDirName) && related !== undefined && (
        <EntryReadWith
          version={metadata.sourceDirName.split('/')[1]}
          permalink={metadata.permalink}
          related={related}
        />
      )}
      <Footer />
    </>
  );
}
