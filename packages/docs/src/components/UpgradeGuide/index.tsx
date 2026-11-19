import { memo, useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import MDXContent from '@theme/MDXContent';

import { andList } from '../../../plugins/upgrade-guide/markdown.js';
import { DEPRECATIONS, byHeading } from '../../../plugins/upgrade-guide/vocabulary.js';
import {
  NO_FILTERS,
  badgeOf,
  customizations,
  decodeHash,
  describeFilters,
  errorMessage,
  fetchMarkdown,
  hashTarget,
  isAnswered,
  matcher,
  moreUses,
  opensMore,
  readFilters,
  toggleNothing,
  toggleUse,
  writeFilters,
  type Choice,
  type Entry,
  type Filters,
  type Guide,
  type Package,
} from './filters.ts';
import { ReadWith } from './ReadWith.tsx';
import styles from './styles.module.css';

type HeadingProps = { children?: ReactNode };
type Body = ComponentType<{ components?: Record<string, ComponentType<HeadingProps>> }>;

/**
 * An entry's sections are `##` headings on its own page. Inside a row they sit under the row's `h3`, and they take no
 * id, which would repeat in every open row and turn each into a page anchor.
 */
const ROW_HEADINGS = {
  h2: ({ children }: HeadingProps) => <h4 className={styles.section}>{children}</h4>,
  h3: ({ children }: HeadingProps) => <h5>{children}</h5>,
  h4: ({ children }: HeadingProps) => <h6>{children}</h6>,
  h5: ({ children }: HeadingProps) => <h6>{children}</h6>,
  h6: ({ children }: HeadingProps) => <h6>{children}</h6>,
};

/** `load` once per key; a load that fails is forgotten, so the next call tries again. */
function memoized<T>(load: (key: string) => Promise<T>): (key: string) => Promise<T> {
  const cache = new Map<string, Promise<T>>();
  return (key) => {
    let value = cache.get(key);
    if (!value) {
      value = load(key);
      value.catch(() => cache.delete(key));
      cache.set(key, value);
    }
    return value;
  };
}

/**
 * The version's entries and vocabulary, which the plugin writes to its generated data directory. A lazy import makes
 * the file a chunk of its own, loaded only by this page.
 */
const loadGuide = memoized((version) =>
  import(
    /* webpackInclude: /[\\/]v\d+\.json$/ */
    `@generated/rjsf-upgrade-guide/default/${version}.json`
  ).then((module: { default: Guide }) => module.default),
);

/** The bodies that have loaded, so a row that remounts (a filter hid it, then showed it) renders its body at once. */
const loadedBodies = new Map<string, Body>();

/**
 * The compiled page of the entry `<version>/<id>`, the same module its own route renders. Webpack makes the template a
 * lazy context over the entry files, so each entry is an async chunk that loads on the first call, and the filtered
 * page ships none. The chunk is left unnamed so webpack can merge it with the route's chunk for the same module.
 */
const loadBody = memoized((key) =>
  import(
    /* webpackInclude: /[\\/]v\d+[\\/][a-z0-9-]+\.md$/ */
    `@site/docs/migration-guides/${key}.md`
  ).then((module: { default: Body }) => {
    loadedBodies.set(key, module.default);
    return module.default;
  }),
);

/** A vocabulary text as a `title` attribute, which would show its inline code's backticks. */
function plainText(text: string) {
  return text.replaceAll('`', '');
}

/** Renders a frontmatter `description` or a vocabulary text, whose only Markdown is inline code. */
function InlineMarkdown({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(`[^`]+`)/)
        .map((part, index) => (index % 2 === 1 ? <code key={index}>{part.slice(1, -1)}</code> : part))}
    </>
  );
}

function Checkboxes({
  legend,
  choices,
  ticked,
  onChange,
}: {
  legend: string;
  choices: Choice[];
  ticked: string[];
  onChange: (ticked: string[]) => void;
}) {
  return (
    <fieldset className={styles.group}>
      <legend>{legend}</legend>
      {choices.map((choice) => (
        <label key={choice.id} className={styles.check} title={plainText(choice.detect)}>
          <input
            type='checkbox'
            checked={ticked.includes(choice.id)}
            onChange={(event) =>
              onChange(event.target.checked ? [...ticked, choice.id] : ticked.filter((id) => id !== choice.id))
            }
          />
          {choice.label}
        </label>
      ))}
    </fieldset>
  );
}

function Meanings({ legend, choices }: { legend: string; choices: Choice[] }) {
  return (
    <>
      <p className={styles.meaningsHeading}>{legend}</p>
      <dl className={styles.meaningsList}>
        {choices.map((choice) => (
          <div key={choice.id}>
            <dt>{choice.label}</dt>
            <dd>
              <InlineMarkdown text={choice.detect} />
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function EntryBody({ entry, body, related }: { entry: Entry; body: Body | Error | undefined; related: Entry[] }) {
  const Content = body instanceof Error ? undefined : body;
  return (
    <div id={`${entry.id}-body`} className={styles.body}>
      {body === undefined && <p className={styles.hint}>Loading…</p>}
      {body instanceof Error && <p>This entry didn&apos;t load. Open it as a page instead.</p>}
      {Content && (
        <MDXContent>
          <Content components={ROW_HEADINGS} />
        </MDXContent>
      )}
      <ReadWith entries={related} />
      <p className={styles.pageLink}>
        <Link to={entry.permalink}>Open as page</Link>
      </p>
    </div>
  );
}

/** One entry. It owns its body, so a body loading re-renders its row alone. */
const Row = memo(function Row({
  version,
  entry,
  byId,
  badge,
  isOpen,
  onToggle,
}: {
  version: string;
  entry: Entry;
  /** Every entry by id, for the ones `related` names. */
  byId: ReadonlyMap<string, Entry>;
  /** The one theme or validator the entry is for, if that is all it lists. */
  badge: Package | undefined;
  isOpen: boolean;
  onToggle: (id: string) => void;
}) {
  const key = `${version}/${entry.id}`;
  const [body, setBody] = useState<Body | Error | undefined>(() => loadedBodies.get(key));

  useEffect(() => {
    if (!isOpen || (body !== undefined && !(body instanceof Error))) {
      return undefined;
    }
    // A body that failed to load tries again when its row next opens, however it opens.
    setBody(undefined);
    let current = true;
    loadBody(key).then(
      (loaded) => current && setBody(() => loaded),
      (error: unknown) => current && setBody(error instanceof Error ? error : new Error(String(error))),
    );
    return () => {
      current = false;
    };
    // Only opening the row starts a load; the body it sets mustn't start another.
  }, [isOpen, key]);

  return (
    <li id={entry.id} className={styles.entry}>
      <div className={styles.header}>
        <h3 className={styles.entryHeading}>
          <button
            type='button'
            className={styles.toggle}
            aria-expanded={isOpen}
            aria-controls={isOpen ? `${entry.id}-body` : undefined}
            onClick={() => onToggle(entry.id)}
          >
            <span className={styles.marker} aria-hidden='true'>
              {isOpen ? '▾' : '▸'}
            </span>
            {entry.title}
          </button>
        </h3>
        {badge && (
          <span className='badge badge--secondary' title={badge.id}>
            {badge.short}
          </span>
        )}
      </div>
      <p className={styles.description}>
        <InlineMarkdown text={entry.description} />
      </p>
      {isOpen && (
        <EntryBody
          entry={entry}
          body={body}
          related={entry.related.flatMap((id) => {
            const related = byId.get(id);
            return related ? [related] : [];
          })}
        />
      )}
    </li>
  );
});

export default function UpgradeGuide({ version }: { version: string }): ReactNode {
  const [guide, setGuide] = useState<Guide | Error>();

  useEffect(() => {
    loadGuide(version).then(setGuide, (error: unknown) =>
      setGuide(new Error(`The upgrade guide plugin wrote no data for ${version}: ${errorMessage(error)}`)),
    );
  }, [version]);

  if (guide instanceof Error) {
    throw guide;
  }
  return guide ? (
    <FilteredGuide version={version} guide={guide} />
  ) : (
    <p className={styles.guide} role='status'>
      Loading the {version} entries…
    </p>
  );
}

function FilteredGuide({ version, guide }: { version: string; guide: Guide }): ReactNode {
  const location = useLocation();
  const history = useHistory();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [copyStatus, setCopyStatus] = useState('');

  // The guide mounts only once its data has loaded, after hydration, so it reads the query and hash at once.
  const filters = readFilters(location.search, guide);
  const hash = decodeHash(location.hash);
  const byId = useMemo(() => new Map(guide.entries.map((entry) => [entry.id, entry])), [guide]);
  const packagesById = useMemo(() => new Map(guide.packages.map((pkg) => [pkg.id, pkg])), [guide]);
  const target = hashTarget(guide, hash);
  const hashEntry = target?.kind === 'entry' ? target.entry : undefined;

  const rows = guide.entries.filter(matcher(guide, filters));
  const groups = byHeading(rows);
  const themes = guide.packages.filter((pkg) => pkg.group === 'theme');
  const validators = guide.packages.filter((pkg) => pkg.group === 'validator');
  const others = guide.packages.filter((pkg) => pkg.group === 'other');
  const chips = customizations(guide);
  const more = moreUses(guide);
  const allOpen = rows.length > 0 && rows.every((entry) => open.has(entry.id));
  const hashEntryShown = hashEntry !== undefined && rows.includes(hashEntry);
  const [moreOpen, setMoreOpen] = useState(() => opensMore(guide, filters));

  // Only a new hash can name another old anchor or entry; a filter change mustn't scroll back to the hash's entry.
  useEffect(() => {
    if (target?.kind === 'moved') {
      history.replace({ pathname: location.pathname, search: location.search, hash: `#${target.id}` });
    } else if (target?.kind === 'page') {
      history.replace(target.url);
    } else if (hashEntry && hashEntryShown) {
      setOpen((previous) => new Set(previous).add(hashEntry.id));
      document.getElementById(hashEntry.id)?.scrollIntoView();
    }
  }, [hash]);

  const update = (next: Filters) =>
    history.replace({
      pathname: location.pathname,
      search: writeFilters(next),
      hash: location.hash,
    });

  // Stable, so a row that neither opens nor closes skips the render.
  const toggle = useCallback(
    (id: string) =>
      setOpen((previous) => {
        const next = new Set(previous);
        if (!next.delete(id)) {
          next.add(id);
        }
        return next;
      }),
    [],
  );

  const toggleAll = () =>
    setOpen((previous) => {
      const next = new Set(previous);
      for (const entry of rows) {
        if (allOpen) {
          next.delete(entry.id);
        } else {
          next.add(entry.id);
        }
      }
      return next;
    });

  const copyMarkdown = () => {
    if (process.env.NODE_ENV !== 'production') {
      setCopyStatus(
        'The .md copies of the entries are written by the production build, so this works on the published site or under pnpm run build and pnpm run serve, not in the dev server.',
      );
      return;
    }
    setCopyStatus('Copying…');
    const { origin } = window.location;
    // The document cites the page from what the reader answered, not the address as typed, which could carry any text.
    const url = `${origin}${location.pathname}${writeFilters(filters)}`;
    const markdown = fetchMarkdown(rows, version, { url, origin }, (file) => fetch(file));
    // Safari writes to the clipboard only from within the click's handler, and Firefox only for a few seconds after
    // it, so the write starts here, taking the text as a promise the fetches settle later. A browser without
    // ClipboardItem writes the text once it is ready.
    const written =
      typeof ClipboardItem === 'undefined'
        ? markdown.then((text) => navigator.clipboard.writeText(text))
        : navigator.clipboard.write([
            new ClipboardItem({ 'text/plain': markdown.then((text) => new Blob([text], { type: 'text/plain' })) }),
          ]);
    Promise.all([markdown, written]).then(
      () => setCopyStatus(`Copied ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'} as Markdown.`),
      (error: unknown) => setCopyStatus(`Copying failed: ${errorMessage(error)}.`),
    );
  };

  return (
    <div className={styles.guide}>
      {target?.kind === 'entries' && (
        <div className='alert alert--info' role='status'>
          <p>
            The old guide&apos;s section <code>#{hash}</code> is now these entries:
          </p>
          <ul>
            {target.entries.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    history.push({ pathname: location.pathname, search: location.search, hash: `#${entry.id}` });
                  }}
                >
                  {entry.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hashEntry && !hashEntryShown && (
        <div className='alert alert--info' role='status'>
          <p>
            Your answers hide <Link to={hashEntry.permalink}>{hashEntry.title}</Link>.
          </p>
        </div>
      )}

      <form className={styles.filters} onSubmit={(event) => event.preventDefault()}>
        <div className={styles.bar} role='group' aria-label='Narrow the list (optional)'>
          <select
            className={styles.select}
            aria-label='Theme'
            value={filters.theme}
            onChange={(event) => update({ ...filters, theme: event.target.value })}
          >
            <option value=''>All themes</option>
            {themes.map((pkg) => (
              <option key={pkg.id} value={pkg.short}>
                {`Theme: ${pkg.removed ? `${pkg.short} (removed)` : pkg.short}`}
              </option>
            ))}
          </select>
          <span className={styles.barLabel}>Customized:</span>
          <button
            type='button'
            className={styles.chip}
            aria-pressed={filters.nothing}
            title={`Your code passes no custom ${andList(
              chips.map((use) => use.chip.toLowerCase()),
              'or',
            )}.`}
            onClick={() => update(toggleNothing(guide, filters))}
          >
            Nothing
          </button>
          {chips.map((use) => (
            <button
              key={use.id}
              type='button'
              className={styles.chip}
              aria-pressed={filters.uses.includes(use.id)}
              title={plainText(use.detect)}
              onClick={() => update(toggleUse(guide, filters, use.id))}
            >
              {use.chip}
            </button>
          ))}
          <span className={styles.barEnd}>
            <button
              type='button'
              className={styles.linkButton}
              aria-expanded={moreOpen}
              aria-controls='upgrade-guide-more'
              onClick={() => setMoreOpen(!moreOpen)}
            >
              More about your app
            </button>
            {isAnswered(filters) && (
              <button type='button' className={styles.linkButton} onClick={() => update(NO_FILTERS)}>
                Clear
              </button>
            )}
          </span>
        </div>
        <p className={styles.barHint} role='status'>
          <InlineMarkdown text={describeFilters(filters, guide)} />
        </p>
        {moreOpen && (
          <div id='upgrade-guide-more' className={styles.more}>
            <label className={styles.picker}>
              Validator
              <select
                value={filters.validator}
                onChange={(event) => update({ ...filters, validator: event.target.value })}
              >
                <option value=''>All validators</option>
                {validators.map((pkg) => (
                  <option key={pkg.id} value={pkg.short}>
                    {pkg.removed ? `${pkg.id} (removed in ${version})` : pkg.id}
                  </option>
                ))}
              </select>
            </label>
            <Checkboxes
              legend='Your code'
              choices={more}
              ticked={filters.uses}
              onChange={(uses) => update({ ...filters, uses })}
            />
            <Checkboxes
              legend='Your schemas'
              choices={guide.schema}
              ticked={filters.schema}
              onChange={(schema) => update({ ...filters, schema })}
            />
            {others.length > 0 && (
              <Checkboxes
                legend='Theme authors'
                choices={others.map((pkg) => ({
                  id: pkg.short,
                  label: pkg.id,
                  detect: 'For authors of themes outside this repository.',
                }))}
                ticked={filters.other}
                onChange={(other) => update({ ...filters, other })}
              />
            )}
            <details className={styles.meanings}>
              <summary>What do these mean?</summary>
              <Meanings legend='Customized' choices={chips} />
              <Meanings legend='Your code' choices={more} />
              <Meanings legend='Your schemas' choices={guide.schema} />
            </details>
          </div>
        )}
        <input
          type='search'
          className={styles.search}
          aria-label='Search the changes'
          placeholder='Search titles, descriptions and ids'
          value={filters.search}
          onChange={(event) => update({ ...filters, search: event.target.value })}
        />
      </form>

      <div className={styles.tools}>
        <span>
          For agents: <a href={guide.llmsTxt}>llms.txt</a>
          {[filters.theme, filters.validator]
            .filter((short) => short !== '' && guide.combined[short])
            .map((short) => (
              <span key={short}>
                {' · '}
                <a href={guide.combined[short]}>{short}.md</a>
              </span>
            ))}
          {' · '}
          <a href={guide.combined.all}>all.md</a>
        </span>
        <span className={styles.actions}>
          <button type='button' className={styles.linkButton} onClick={toggleAll} disabled={rows.length === 0}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
          <button type='button' className={styles.linkButton} onClick={copyMarkdown} disabled={rows.length === 0}>
            Copy as Markdown
          </button>
        </span>
      </div>
      {copyStatus && (
        <p className={styles.hint} role='status'>
          {copyStatus}
        </p>
      )}
      {rows.length === 0 && <p className={styles.hint}>No change matches your answers and search.</p>}

      {groups.map(({ heading, entries }, index) => (
        <section key={heading.id}>
          {heading.id === DEPRECATIONS.id ? (
            <h2 id={`heading-${heading.id}`} className={styles.deprecations}>
              {heading.heading}
            </h2>
          ) : (
            <h2 id={`heading-${heading.id}`}>
              {index + 1}. {heading.heading}
            </h2>
          )}
          <p className={styles.headingLine}>{heading.line}</p>
          <ul className={styles.entries}>
            {entries.map((entry) => (
              <Row
                key={entry.id}
                version={version}
                entry={entry}
                byId={byId}
                badge={badgeOf(entry, packagesById)}
                isOpen={open.has(entry.id)}
                onToggle={toggle}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
