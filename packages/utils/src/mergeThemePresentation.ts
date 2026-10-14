import type {
  MergedThemePresentation,
  PartOwner,
  PresentationDeclaration,
  ThemePresentation,
  WidgetPresentationDeclaration,
} from './types.ts';

/** Everything a declaration declares, each layered on its own */
const DECLARED = ['label', 'description', 'errors', 'help', 'labelledBy', 'uncheckedIsFalse'] as const;

/** Layers `declarations` over one another, each later one replacing a part an earlier one declares. A part declared
 * `undefined` is left to the layers beneath it, so spreading an options object can't erase one, and a part none of
 * them declares is left out, so spreading the result can't erase one either
 *
 * @param declarations - The declarations to layer, from the bottom; `undefined` entries are skipped
 * @returns - The layered declaration
 */
export function layerDeclarations<Owner extends PartOwner>(
  ...declarations: readonly (PresentationDeclaration<Owner> | undefined)[]
): PresentationDeclaration<Owner> {
  const layered: Record<string, unknown> = {};
  for (const part of DECLARED) {
    let value: unknown;
    for (const declaration of declarations) {
      value = declaration?.[part] ?? value;
    }
    if (value !== undefined) {
      layered[part] = value;
    }
  }
  return layered;
}

/** Layers blanket declarations, a `ThemePresentation`'s `default`s or `fieldDefault`s, leaving out `uncheckedIsFalse`:
 * it describes one control, and a blanket would also mark the `select` or `radio` a boolean can render. Their type
 * already leaves it out, but a theme written in JavaScript, or a declaration typed wider and passed through a variable,
 * can still carry it
 *
 * @param declarations - The blankets to layer, from the bottom; `undefined` entries are skipped
 * @returns - The layered blanket
 */
export function layerBlankets(
  ...declarations: readonly (WidgetPresentationDeclaration | undefined)[]
): Omit<WidgetPresentationDeclaration, 'uncheckedIsFalse'> {
  const layered = layerDeclarations(...declarations);
  delete layered.uncheckedIsFalse;
  return layered;
}

/** Gets the declaration `record` holds under `key` as an own property, so a key such as `constructor` doesn't read
 * `Object.prototype`
 *
 * @param record - The declarations by key, if any
 * @param key - The key to look up, if any
 * @returns - The declaration under `key`, or `undefined` when `record` has none of its own
 */
export function getOwnDeclaration<Declaration extends PresentationDeclaration>(
  record: Readonly<Record<string, Declaration>> | undefined,
  key: string | undefined,
): Declaration | undefined {
  return record && key !== undefined && Object.hasOwn(record, key) ? record[key] : undefined;
}

/** Layers the declarations of each key in `records` over one another, each record's default beneath its own entry
 *
 * @param records - The records to merge, from the bottom; `undefined` entries are skipped
 * @param [defaults=[]] - The declaration each record gives a key it has no entry for, by the record's index
 * @returns - The merged record, with an entry for every key any of `records` has
 */
function layerRecords<Owner extends PartOwner>(
  records: readonly (Readonly<Record<string, PresentationDeclaration<Owner>>> | undefined)[],
  defaults: readonly (PresentationDeclaration<Owner> | undefined)[] = [],
): Record<string, PresentationDeclaration<Owner>> {
  const keys = new Set(records.flatMap((record) => Object.keys(record ?? {})));
  return Object.fromEntries(
    [...keys].map((key) => [
      key,
      layerDeclarations(...records.flatMap((record, index) => [defaults[index], getOwnDeclaration(record, key)])),
    ]),
  );
}

/** Merges the `ThemePresentation`s of a form's layers, the way `@rjsf/core` merges its own components with a theme's
 * and a theme's with the `Form`'s props. Declarations are merged part by part rather than replaced whole, so a theme
 * declaring that its `CheckboxWidget` draws its errors keeps `@rjsf/core`'s declaration that it draws its label. A
 * layer's `default` is layered beneath that layer's own entry for every widget key any layer declares, so it overrides
 * the parts it declares in the layers beneath it, even under a key one of them declares, and the layered `default`s
 * are what a widget no layer declares draws. The `fieldDefault`s are layered over one another only, since they sit
 * beneath the merged field entries
 *
 * @param layers - The presentations to merge, from the bottom; `undefined` entries are skipped
 * @returns - The merged presentation
 */
export default function mergeThemePresentation(
  ...layers: readonly (ThemePresentation | undefined)[]
): MergedThemePresentation {
  const defaults = layers.map((layer) => layerBlankets(layer?.default));
  return {
    default: layerDeclarations<Exclude<PartOwner, 'widget'>>(...defaults),
    widgets: layerRecords(
      layers.map((layer) => layer?.widgets),
      defaults,
    ),
    fields: layerRecords(layers.map((layer) => layer?.fields)),
    fieldDefault: layerBlankets(...layers.map((layer) => layer?.fieldDefault)),
  };
}
