import type { Guide } from './filters.ts';

const guides = new Map<string, Promise<Guide>>();

/**
 * The version's entries and vocabulary, which the plugin writes to its generated data directory. A lazy import makes
 * the file a chunk of its own, loaded only by the filtered page and the entry pages that link related entries.
 */
export function loadGuide(version: string): Promise<Guide> {
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
