import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';

import type { Entry } from './filters.ts';

/** Links to the entries an entry's `related` names, which a reader of the entry also needs. */
export function ReadWith({ entries }: { entries: Pick<Entry, 'id' | 'title' | 'permalink'>[] }): ReactNode {
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
