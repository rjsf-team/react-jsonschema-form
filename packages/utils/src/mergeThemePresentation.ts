import type {
  MergedThemePresentation,
  PartOwner,
  PresentationDeclaration,
  ThemePresentation,
  WidgetPresentationDeclaration,
} from './types.ts';

/** Gets the value the last of `declarations` that declares `part` gives it
 *
 * @param declarations - The declarations, from the bottom
 * @param part - The part to read
 * @returns - The value of the topmost declaration of `part`, or `undefined` when none declares it
 */
function topmost<Owner extends PartOwner, Part extends keyof PresentationDeclaration<Owner>>(
  declarations: readonly (PresentationDeclaration<Owner> | undefined)[],
  part: Part,
): PresentationDeclaration<Owner>[Part] | undefined {
  let value: PresentationDeclaration<Owner>[Part] | undefined;
  for (const declaration of declarations) {
    value = declaration?.[part] ?? value;
  }
  return value;
}

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
  const layered: PresentationDeclaration<Owner> = {};
  const layer = <Part extends keyof PresentationDeclaration<Owner>>(part: Part) => {
    const value = topmost(declarations, part);
    if (value !== undefined) {
      layered[part] = value;
    }
  };
  layer('label');
  layer('description');
  layer('errors');
  layer('help');
  layer('labelledBy');
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

/** Layers the declarations of each key in `layers` over one another
 *
 * @param layers - The records to merge, from the bottom; `undefined` entries are skipped
 * @returns - The merged record
 */
function layerRecords<Owner extends PartOwner>(
  layers: readonly (Readonly<Record<string, PresentationDeclaration<Owner>>> | undefined)[],
): Record<string, PresentationDeclaration<Owner>> {
  const keys = new Set(layers.flatMap((layer) => Object.keys(layer ?? {})));
  return Object.fromEntries(
    [...keys].map((key) => [key, layerDeclarations(...layers.map((layer) => getOwnDeclaration(layer, key)))]),
  );
}

/** Gets the widget declarations of one layer, with its `standardWidgets` expanded into an entry for each of
 * `standardWidgetKeys` beneath the layer's own entry for that key
 *
 * @param layer - The layer, if any
 * @param standardWidgetKeys - The keys `@rjsf/core` registers its widgets under
 * @returns - The layer's widget declarations by key
 */
function expandStandardWidgets(
  layer: ThemePresentation | undefined,
  standardWidgetKeys: readonly string[],
): Readonly<Record<string, WidgetPresentationDeclaration>> | undefined {
  if (!layer?.standardWidgets) {
    return layer?.widgets;
  }
  const { standardWidgets, widgets } = layer;
  return {
    ...widgets,
    ...Object.fromEntries(
      standardWidgetKeys.map((key) => [key, layerDeclarations(standardWidgets, getOwnDeclaration(widgets, key))]),
    ),
  };
}

/** Merges the `ThemePresentation`s of a form's layers, the way `@rjsf/core` merges its own components with a theme's
 * and a theme's with the `Form`'s props. Declarations are merged part by part rather than replaced whole, so a theme
 * declaring that its `CheckboxWidget` draws its errors keeps `@rjsf/core`'s declaration that it draws its label. A
 * layer's `standardWidgets` is expanded into an entry for every one of `standardWidgetKeys` at that layer, beneath the
 * layer's own entry for the key, so it overrides the parts it declares in the layers beneath it, even under a key one
 * of them declares
 *
 * @param standardWidgetKeys - The keys `@rjsf/core` registers its widgets under, which `standardWidgets` applies to
 * @param layers - The presentations to merge, from the bottom; `undefined` entries are skipped
 * @returns - The merged presentation, with no `standardWidgets` left to apply
 */
export default function mergeThemePresentation(
  standardWidgetKeys: readonly string[],
  ...layers: readonly (ThemePresentation | undefined)[]
): MergedThemePresentation {
  return {
    widgets: layerRecords(layers.map((layer) => expandStandardWidgets(layer, standardWidgetKeys))),
    fields: layerRecords(layers.map((layer) => layer?.fields)),
  };
}
