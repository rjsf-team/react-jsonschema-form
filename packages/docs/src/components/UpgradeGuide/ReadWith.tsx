import { useEffect, useState, type ReactNode } from 'react';
import Link from '@docusaurus/Link';

import type { Entry } from './filters.ts';
import { loadGuide } from './guide.ts';

type Related = Pick<Entry, 'id' | 'title' | 'permalink'>;

/** Links to the entries an entry's `related` names, which a reader of the entry also needs. */
export function ReadWith({ entries }: { entries: Related[] }): ReactNode {
  if (entries.length === 0) {
    return null;
  }
  return (
    <>
      <p>Also read:</p>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link to={entry.permalink}>{entry.title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * ReadWith on an entry's own page, whose frontmatter has only the ids. Every entry's page is its id beside this one's,
 * so the links work as soon as the page renders; they take the entries' titles once the guide's data loads, and keep
 * the ids if it doesn't.
 */
export function EntryReadWith({
  version,
  permalink,
  related,
}: {
  version: string;
  permalink: string;
  related: string[];
}): ReactNode {
  const [titles, setTitles] = useState<ReadonlyMap<string, string>>(new Map());

  useEffect(() => {
    let current = true;
    loadGuide(version).then(
      (guide) => current && setTitles(new Map(guide.entries.map((entry) => [entry.id, entry.title]))),
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [version]);

  const route = permalink.replace(/[^/]+\/?$/, '');
  return <ReadWith entries={related.map((id) => ({ id, title: titles.get(id) ?? id, permalink: `${route}${id}` }))} />;
}
