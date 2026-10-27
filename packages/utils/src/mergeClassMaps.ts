import type { FormClassMap } from './types.ts';

/** Layers class maps key by key, the way `@rjsf/core` layers a theme's `classMap` over its own and the `Form`'s over
 * the theme's. An entry that is neither a class nor a function, such as one left `undefined`, `null` from JSON or
 * `false` from a conditional, keeps the class beneath it, and a function entry is called with the class beneath it, or
 * composed with the function beneath it until a class is there to call them with
 *
 * @param layers - The class maps to layer, from the bottom; `undefined` entries are skipped
 * @returns - The layered class map, whose entries are functions only where no layer beneath gives a class
 */
export default function mergeClassMaps(...layers: readonly (FormClassMap | undefined)[]): FormClassMap {
  const merged: Record<string, string | ((themeClass: string) => string)> = {};
  const entries = layers
    .flatMap((layer) => Object.entries(layer ?? {}))
    .filter(([, value]) => typeof value === 'string' || typeof value === 'function');
  for (const [key, value] of entries) {
    const beneath = merged[key];
    if (typeof value === 'string' || beneath === undefined) {
      merged[key] = value;
    } else if (typeof beneath === 'string') {
      merged[key] = value(beneath);
    } else {
      merged[key] = (base) => value(beneath(base));
    }
  }
  return merged;
}
