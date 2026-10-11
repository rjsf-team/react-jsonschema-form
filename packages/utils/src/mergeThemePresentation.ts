import type { PresentationDeclaration, ThemePresentation } from './types.ts';

/** Layers `declarations` over one another, each later one replacing a part an earlier one declares. A part declared
 * `undefined` is left to the layers beneath it, so spreading an options object can't erase one
 *
 * @param declarations - The declarations to layer, from the bottom; `undefined` entries are skipped
 * @returns - The layered declaration
 */
export function layerDeclarations(
  ...declarations: readonly (PresentationDeclaration | undefined)[]
): PresentationDeclaration {
  const layered: PresentationDeclaration = {};
  for (const declaration of declarations) {
    for (const [part, owner] of Object.entries(declaration ?? {})) {
      if (owner !== undefined) {
        Object.assign(layered, { [part]: owner });
      }
    }
  }
  return layered;
}

/** Gets the declaration `record` holds under `key` as an own property, so a key such as `constructor` doesn't read
 * `Object.prototype`
 *
 * @param record - The declarations by key, if any
 * @param key - The key to look up
 * @returns - The declaration under `key`, or `undefined` when `record` has none of its own
 */
export function getOwnDeclaration(
  record: Readonly<Record<string, PresentationDeclaration>> | undefined,
  key: string,
): PresentationDeclaration | undefined {
  return record && Object.hasOwn(record, key) ? record[key] : undefined;
}

/** Layers the declarations of each key in `layers` over one another
 *
 * @param layers - The records to merge, from the bottom; `undefined` entries are skipped
 * @returns - The merged record
 */
function layerRecords(
  layers: readonly (Readonly<Record<string, PresentationDeclaration>> | undefined)[],
): Record<string, PresentationDeclaration> {
  const keys = new Set(layers.flatMap((layer) => Object.keys(layer ?? {})));
  return Object.fromEntries(
    [...keys].map((key) => [key, layerDeclarations(...layers.map((layer) => getOwnDeclaration(layer, key)))]),
  );
}

/** Merges the `ThemePresentation`s of a form's layers, the way `@rjsf/core` merges its own components with a theme's
 * and a theme's with the `Form`'s props. Declarations are merged part by part rather than replaced whole, so a theme
 * declaring that its `CheckboxWidget` draws its errors keeps `@rjsf/core`'s declaration that it draws its label
 *
 * @param layers - The presentations to merge, from the bottom; `undefined` entries are skipped
 * @returns - The merged presentation
 */
export default function mergeThemePresentation(
  ...layers: readonly (ThemePresentation | undefined)[]
): Required<ThemePresentation> {
  return {
    standardWidgets: layerDeclarations(...layers.map((layer) => layer?.standardWidgets)),
    widgets: layerRecords(layers.map((layer) => layer?.widgets)),
    fields: layerRecords(layers.map((layer) => layer?.fields)),
  };
}
