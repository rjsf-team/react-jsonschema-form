import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import MDXContent from '@theme/MDXContent';

import styles from './styles.module.css';

// The shape of the `v<N>.json` plugins/upgrade-guide/index.js writes.
interface Package {
  id: string;
  short: string;
  group: 'always' | 'theme' | 'validator' | 'other';
  removed: boolean;
}

interface Choice {
  id: string;
  label: string;
  detect: string;
}

interface Kind {
  id: string;
  label: string;
  description: string;
}

interface Noticed {
  id: string;
  label: string;
  short: string;
  hint: string;
}

interface Entry {
  id: string;
  title: string;
  description: string;
  packages: string[];
  uses: string[];
  schema: string[];
  kind: string;
  noticed: string;
  permalink: string;
}

interface Guide {
  uses: Choice[];
  schema: Choice[];
  kinds: Kind[];
  noticed: Noticed[];
  packages: Package[];
  entries: Entry[];
  anchors: Record<string, string[]>;
  llmsTxt: string;
  combined: Record<string, string>;
}

interface Filters {
  theme: string;
  validator: string;
  uses: string[];
  schema: string[];
  other: string[];
  noticed: string;
}

type HeadingProps = { children?: ReactNode };
type Body = ComponentType<{ components?: Record<string, ComponentType<HeadingProps>> }>;

/** Every user has these, so their entries always show. `*` is every package. */
const ALWAYS = ['*', '@rjsf/core', '@rjsf/utils'];
/** Every user renders a form, so a `form` entry shows whatever else is ticked; it has no checkbox. */
const EVERY_USER = 'form';
const NOTICED_BADGE: Record<string, string> = {
  build: 'badge--warning',
  'type-error': 'badge--danger',
  'runtime-error': 'badge--primary',
  test: 'badge--info',
  review: 'badge--secondary',
};
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

const guides = new Map<string, Promise<Guide>>();
const bodies = new Map<string, Promise<Body>>();

/**
 * The version's entries and vocabulary, which the plugin writes to its generated data directory. A lazy import makes
 * the file a chunk of its own, loaded by this page alone.
 */
function loadGuide(version: string): Promise<Guide> {
  let guide = guides.get(version);
  if (!guide) {
    guide = import(
      /* webpackInclude: /[\\/]v\d+\.json$/ */
      `@generated/rjsf-upgrade-guide/default/${version}.json`
    ).then((module: { default: Guide }) => module.default);
    guide.catch(() => guides.delete(version));
    guides.set(version, guide);
  }
  return guide;
}

/**
 * The entry's compiled page, the same module its own route renders. Webpack makes the template a lazy context over the
 * entry files, so each entry is an async chunk that loads on the first call, and the filtered page ships none. The
 * chunk is left unnamed so webpack can merge it with the route's chunk for the same module.
 */
function loadBody(version: string, id: string): Promise<Body> {
  const key = `${version}/${id}`;
  let body = bodies.get(key);
  if (!body) {
    body = import(
      /* webpackInclude: /[\\/]v\d+[\\/][a-z0-9-]+\.md$/ */
      `@site/docs/migration-guides/${version}/${id}.md`
    ).then((module: { default: Body }) => module.default);
    body.catch(() => bodies.delete(key));
    bodies.set(key, body);
  }
  return body;
}

function shortNames(packages: Package[], group: Package['group']) {
  return packages.filter((pkg) => pkg.group === group).map((pkg) => pkg.short);
}

function readFilters(search: string, guide: Guide): Filters {
  const { packages } = guide;
  const params = new URLSearchParams(search);
  const one = (key: string, allowed: string[]) => {
    const value = params.get(key) ?? '';
    return allowed.includes(value) ? value : '';
  };
  const many = (key: string, allowed: string[]) =>
    (params.get(key) ?? '').split(',').filter((value) => allowed.includes(value));
  return {
    theme: one('theme', shortNames(packages, 'theme')),
    validator: one('validator', shortNames(packages, 'validator')),
    uses: many(
      'uses',
      guide.uses.map((use) => use.id),
    ),
    schema: many(
      'schema',
      guide.schema.map((feature) => feature.id),
    ),
    other: many('other', shortNames(packages, 'other')),
    noticed: one(
      'noticed',
      guide.noticed.map((noticed) => noticed.id),
    ),
  };
}

/** Every value is `[a-z0-9-]`, so the query is built by hand to keep the commas readable in a shared link. */
function writeFilters({ theme, validator, uses, schema, other, noticed }: Filters) {
  const params = [
    theme && `theme=${theme}`,
    validator && `validator=${validator}`,
    uses.length > 0 && `uses=${uses.join(',')}`,
    schema.length > 0 && `schema=${schema.join(',')}`,
    other.length > 0 && `other=${other.join(',')}`,
    noticed && `noticed=${noticed}`,
  ].filter(Boolean);
  return params.length > 0 ? `?${params.join('&')}` : '';
}

function matches(entry: Entry, packages: Set<string>, uses: string[], schema: string[]) {
  return (
    entry.packages.some((pkg) => packages.has(pkg)) &&
    (uses.length === 0 || entry.uses.some((use) => use === EVERY_USER || uses.includes(use))) &&
    (schema.length === 0 || entry.schema.length === 0 || entry.schema.some((feature) => schema.includes(feature)))
  );
}

function decodeHash(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return '';
  }
}

/** The `.md` copy postBuild writes beside the entry's page. */
function markdownUrl(entry: Entry) {
  return new URL(`${entry.permalink.replace(/\/$/, '')}.md`, window.location.origin).href;
}

/**
 * One Markdown document of `rows`, in order. Each entry keeps its body's `##` sections, so its title is a `#` heading.
 */
function combine(rows: Entry[], texts: string[], version: string, kinds: Kind[]) {
  const count = `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`;
  const parts = [
    `> react-jsonschema-form ${version} upgrade guide: the ${count} that ${rows.length === 1 ? 'matches' : 'match'} ${window.location.href}, in the order to apply them.`,
  ];
  rows.forEach((entry, index) => {
    const kind = kinds.find(({ id }) => id === entry.kind)?.label ?? entry.kind;
    const facts = [
      `- kind: ${kind}; noticed: \`${entry.noticed}\``,
      `- packages: ${entry.packages.map((pkg) => `\`${pkg}\``).join(', ')}`,
      `- source: ${markdownUrl(entry)}`,
    ];
    const body = texts[index].replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n/, '').trim();
    parts.push(`# ${entry.title}\n\n${facts.join('\n')}\n\n${entry.description}\n\n${body}`);
  });
  return `${parts.join('\n\n')}\n`;
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
        <label key={choice.id} className={styles.check} title={choice.detect.replaceAll('`', '')}>
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

function EntryBody({ entry, body }: { entry: Entry; body: Body | Error | undefined }) {
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
      <p className={styles.pageLink}>
        <Link to={entry.permalink}>Open as page</Link>
      </p>
    </div>
  );
}

export default function UpgradeGuide({ version }: { version: string }): ReactNode {
  const [guide, setGuide] = useState<Guide | Error>();

  useEffect(() => {
    loadGuide(version).then(setGuide, (error: unknown) =>
      setGuide(
        new Error(
          `The upgrade guide plugin wrote no data for ${version}: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ),
    );
  }, [version]);

  if (guide instanceof Error) {
    throw guide;
  }
  return guide ? (
    <Rows version={version} guide={guide} />
  ) : (
    <p className={styles.guide} role='status'>
      Loading the {version} entries…
    </p>
  );
}

function Rows({ version, guide }: { version: string; guide: Guide }): ReactNode {
  const location = useLocation();
  const history = useHistory();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [loaded, setLoaded] = useState<Readonly<Record<string, Body | Error>>>({});
  const [copyStatus, setCopyStatus] = useState('');

  // Rows mount only once the guide's data has loaded, after hydration, so they read the query and hash at once.
  const filters = readFilters(location.search, guide);
  const hash = decodeHash(location.hash);
  const byId = new Map(guide.entries.map((entry) => [entry.id, entry]));
  const hashEntry = byId.get(hash);
  const anchorIds = !hashEntry && Object.hasOwn(guide.anchors, hash) ? guide.anchors[hash] : [];

  const byShort = new Map(guide.packages.map((pkg) => [pkg.short, pkg]));
  const chosen = new Set(
    [...ALWAYS, ...[filters.theme, filters.validator, ...filters.other].map((short) => byShort.get(short)?.id)].filter(
      (id): id is string => id !== undefined,
    ),
  );
  const shown = guide.entries.filter((entry) => matches(entry, chosen, filters.uses, filters.schema));
  const rows = filters.noticed ? shown.filter((entry) => entry.noticed === filters.noticed) : shown;
  const groups = guide.kinds
    .map((kind) => ({ kind, entries: rows.filter((entry) => entry.kind === kind.id) }))
    .filter((group) => group.entries.length > 0);
  const noticedById = new Map(guide.noticed.map((noticed) => [noticed.id, noticed]));
  const themes = guide.packages.filter((pkg) => pkg.group === 'theme');
  const validators = guide.packages.filter((pkg) => pkg.group === 'validator');
  const others = guide.packages.filter((pkg) => pkg.group === 'other');
  const codeChoices = guide.uses.filter((use) => use.id !== EVERY_USER);
  const allOpen = rows.length > 0 && rows.every((entry) => open.has(entry.id));
  const hashEntryShown = hashEntry !== undefined && rows.includes(hashEntry);

  useEffect(() => {
    if (anchorIds.length === 1) {
      history.replace({ pathname: location.pathname, search: location.search, hash: `#${anchorIds[0]}` });
    }
    // Only a new hash can name another old anchor.
  }, [hash]);

  useEffect(() => {
    if (hashEntry && hashEntryShown) {
      setOpen((previous) => new Set(previous).add(hashEntry.id));
      document.getElementById(hashEntry.id)?.scrollIntoView();
    }
  }, [hash, hashEntryShown]);

  useEffect(() => {
    for (const id of open) {
      if (!(id in loaded)) {
        loadBody(version, id).then(
          (body) => setLoaded((previous) => ({ ...previous, [id]: body })),
          (error: unknown) =>
            setLoaded((previous) => ({ ...previous, [id]: error instanceof Error ? error : new Error(String(error)) })),
        );
      }
    }
  }, [open]);

  const update = (next: Partial<Filters>) =>
    history.replace({
      pathname: location.pathname,
      search: writeFilters({ ...filters, ...next }),
      hash: location.hash,
    });

  const toggle = (id: string) => {
    setOpen((previous) => {
      const next = new Set(previous);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
    // A row that failed to load tries again when it next opens.
    if (loaded[id] instanceof Error) {
      setLoaded(({ [id]: _failed, ...rest }) => rest);
    }
  };

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

  const copyMarkdown = async () => {
    if (process.env.NODE_ENV !== 'production') {
      setCopyStatus(
        'The .md copies of the entries are written by the production build, so this works on the published site or under pnpm run build and pnpm run serve, not in the dev server.',
      );
      return;
    }
    setCopyStatus('Copying…');
    try {
      const texts = await Promise.all(
        rows.map(async (entry) => {
          const response = await fetch(markdownUrl(entry));
          if (!response.ok) {
            throw new Error(`${markdownUrl(entry)} answered ${response.status}`);
          }
          return response.text();
        }),
      );
      await navigator.clipboard.writeText(combine(rows, texts, version, guide.kinds));
      setCopyStatus(`Copied ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'} as Markdown.`);
    } catch (error) {
      setCopyStatus(`Copying failed: ${error instanceof Error ? error.message : String(error)}.`);
    }
  };

  return (
    <div className={styles.guide}>
      {anchorIds.length > 1 && (
        <div className='alert alert--info' role='status'>
          <p>
            The old guide&apos;s section <code>#{hash}</code> is now these entries:
          </p>
          <ul>
            {anchorIds.map((id) => {
              const entry = byId.get(id);
              return (
                entry && (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        history.push({ pathname: location.pathname, search: location.search, hash: `#${id}` });
                      }}
                    >
                      {entry.title}
                    </a>
                  </li>
                )
              );
            })}
          </ul>
        </div>
      )}
      {hashEntry && !hashEntryShown && (
        <div className='alert alert--info' role='status'>
          <p>
            Your filters hide <Link to={hashEntry.permalink}>{hashEntry.title}</Link>.
          </p>
        </div>
      )}

      <form className={styles.filters} onSubmit={(event) => event.preventDefault()}>
        <div className={styles.pickers}>
          <label className={styles.picker}>
            Theme
            <select value={filters.theme} onChange={(event) => update({ theme: event.target.value })}>
              <option value=''>None (core only)</option>
              {themes.map((pkg) => (
                <option key={pkg.id} value={pkg.short}>
                  {pkg.removed ? `${pkg.id} (removed in ${version})` : pkg.id}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.picker}>
            Validator
            <select value={filters.validator} onChange={(event) => update({ validator: event.target.value })}>
              <option value=''>None</option>
              {validators.map((pkg) => (
                <option key={pkg.id} value={pkg.short}>
                  {pkg.removed ? `${pkg.id} (removed in ${version})` : pkg.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Checkboxes
          legend='Your code'
          choices={codeChoices}
          ticked={filters.uses}
          onChange={(uses) => update({ uses })}
        />
        <Checkboxes
          legend='Your schemas'
          choices={guide.schema}
          ticked={filters.schema}
          onChange={(schema) => update({ schema })}
        />
        {others.length > 0 && (
          <div className={styles.pickers}>
            {others.map((pkg) => (
              <label key={pkg.id} className={styles.check} title='For authors of themes outside this repository'>
                <input
                  type='checkbox'
                  checked={filters.other.includes(pkg.short)}
                  onChange={(event) =>
                    update({
                      other: event.target.checked
                        ? [...filters.other, pkg.short]
                        : filters.other.filter((short) => short !== pkg.short),
                    })
                  }
                />
                {pkg.id} (theme authors)
              </label>
            ))}
          </div>
        )}
      </form>
      <p className={styles.rule}>
        With nothing ticked, every entry for your packages shows; entries that affect every form or don&apos;t depend on
        the schema always show.
      </p>
      <details className={styles.meanings}>
        <summary>What do these mean?</summary>
        <Meanings legend='Your code' choices={codeChoices} />
        <Meanings legend='Your schemas' choices={guide.schema} />
      </details>

      <div className={styles.summary} role='group' aria-label='How you will notice the changes'>
        <button
          type='button'
          className={styles.tile}
          aria-pressed={filters.noticed === ''}
          onClick={() => update({ noticed: '' })}
        >
          <span className={styles.count}>{shown.length}</span>
          <span className={styles.tileText}>
            {shown.length === 1 ? 'change applies' : 'changes apply'} to you, of {guide.entries.length}
          </span>
        </button>
        {guide.noticed.map((noticed) => (
          <button
            key={noticed.id}
            type='button'
            className={styles.tile}
            aria-pressed={filters.noticed === noticed.id}
            title={noticed.hint}
            onClick={() => update({ noticed: filters.noticed === noticed.id ? '' : noticed.id })}
          >
            <span className={styles.count}>{shown.filter((entry) => entry.noticed === noticed.id).length}</span>
            <span className={`badge ${NOTICED_BADGE[noticed.id] ?? 'badge--secondary'}`}>{noticed.label}</span>
          </button>
        ))}
      </div>

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
          <button type='button' className='button button--link' onClick={toggleAll} disabled={rows.length === 0}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
          <button type='button' className='button button--link' onClick={copyMarkdown} disabled={rows.length === 0}>
            Copy as Markdown
          </button>
        </span>
      </div>
      {copyStatus && (
        <p className={styles.hint} role='status'>
          {copyStatus}
        </p>
      )}

      {groups.map(({ kind, entries }, index) => (
        <section key={kind.id}>
          <h2 id={`kind-${kind.id}`}>
            {index + 1}. {kind.label} ({entries.length})
          </h2>
          <p className={styles.kindDescription}>{kind.description}</p>
          <ul className={styles.entries}>
            {entries.map((entry) => {
              const isOpen = open.has(entry.id);
              const noticed = noticedById.get(entry.noticed);
              return (
                <li key={entry.id} id={entry.id} className={styles.entry}>
                  <div className={styles.header}>
                    <h3 className={styles.entryHeading}>
                      <button
                        type='button'
                        className={styles.toggle}
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? `${entry.id}-body` : undefined}
                        onClick={() => toggle(entry.id)}
                      >
                        <span className={styles.marker} aria-hidden='true'>
                          {isOpen ? '▾' : '▸'}
                        </span>
                        {entry.title}
                      </button>
                    </h3>
                    <span className={styles.badges}>
                      <span
                        className={`badge ${NOTICED_BADGE[entry.noticed] ?? 'badge--secondary'}`}
                        title={noticed?.hint}
                      >
                        {noticed?.short ?? entry.noticed}
                      </span>
                      {entry.packages.map((pkg) => (
                        <span key={pkg} className='badge badge--secondary' title={pkg === '*' ? undefined : pkg}>
                          {pkg === '*' ? 'every package' : pkg.replace(/^@rjsf\//, '')}
                        </span>
                      ))}
                    </span>
                  </div>
                  <p className={styles.description}>
                    <InlineMarkdown text={entry.description} />
                  </p>
                  {isOpen && <EntryBody entry={entry} body={loaded[entry.id]} />}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
