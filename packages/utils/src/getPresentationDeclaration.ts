import { getWidgetKey } from './getWidget.tsx';
import { getOwnDeclaration, layerDeclarations } from './mergeThemePresentation.ts';
import type {
  Field,
  FormContextType,
  PresentationDeclaration,
  PresentationPart,
  Registry,
  ResolvedPresentationDeclaration,
  RJSFSchema,
  StrictRJSFSchema,
  ThemePresentation,
  Widget,
  WidgetPresentationDeclaration,
} from './types.ts';

/** The parts of the registry a declaration is looked up in. A `Registry` carrying its theme's `presentation` is one */
export type PresentationSource<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<Registry<T, S, F>, 'fields' | 'widgets'> & {
  /** The declarations of the form's layers, as `mergeThemePresentation()` merged them. A single layer that wasn't
   * merged gets the same answer, since a layer's `default` is read beneath its entries here too
   */
  readonly presentation?: ThemePresentation;
};

/** The components that render a field, as `SchemaField` resolved them */
export interface PresentationSubject<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The schema of the field, which maps a widget alias to the key the widget is registered under */
  schema: S;
  /** The field component that renders the field */
  field: Field<T, S, F>;
  /** The key that named the field component, when a key did. When that key declares nothing, the component is found
   * by identity among the registered fields
   */
  fieldKey?: string;
  /** The single widget the field renders its value with, as an alias, a registry key or a component, after the field's
   * own defaulting: a `BooleanField` given no widget or a `null` one renders `'checkbox'`. Left out for a field that
   * renders no single widget, such as an object's or an array's
   */
  widget?: Widget<T, S, F> | string;
}

/** What a field draws when neither its entry nor the theme's `fieldDefault` declares otherwise: its own label and
 * description, as a field written for its schema does, leaving its errors and help to the template
 */
const FIELD_DEFAULT: WidgetPresentationDeclaration = { label: 'self', description: 'self' };

/** The declaration of a field that renders its value with a single widget and leaves every part to whoever that widget
 * says draws it, such as `@rjsf/core`'s `StringField`. A field that renders a single widget only sometimes, such as
 * `ArrayField` for a multi-select, falls back to the field default for every part when it renders none
 */
export const WIDGET_FIELD_PRESENTATION: Readonly<PresentationDeclaration> = Object.freeze({
  label: 'widget',
  description: 'widget',
  errors: 'widget',
  help: 'widget',
});

/** Gets who draws `part`: the field, or the widget when the field leaves the part to it, settled on the template
 * unless that one draws it itself
 */
function ownerOf(
  part: PresentationPart,
  fieldDeclaration: PresentationDeclaration,
  widgetDeclaration: WidgetPresentationDeclaration,
) {
  const owner = fieldDeclaration[part];
  return (owner === 'widget' ? widgetDeclaration[part] : owner) === 'self' ? 'self' : 'template';
}

/** Gets the declaration `declared` holds for `component`: the one under the key that named it, or else the first one
 * under a key it is registered under, so a component registered under several keys, or named by a key that declares
 * nothing, gets the same answer by any route
 *
 * @param declared - The declarations by key, if any
 * @param registered - The registered components by key
 * @param component - The component, if any
 * @param [namingKey] - The key that named the component, if one did
 * @returns - The declaration found, or `undefined` when none of those keys has one
 */
function getComponentDeclaration<Declaration extends PresentationDeclaration>(
  declared: Readonly<Record<string, Declaration>> | undefined,
  registered: Readonly<Record<string, unknown>>,
  component: unknown,
  namingKey?: string,
): Declaration | undefined {
  const registeredKeys = component ? Object.keys(registered).filter((key) => registered[key] === component) : [];
  return [namingKey, ...registeredKeys].map((key) => getOwnDeclaration(declared, key)).find(Boolean);
}

/** Gets the declaration of the widget a field renders: the merged declaration for its key over the merged `default`,
 * which is all a key no layer declares gets. An alias is looked up by the key it stands for, and a component by the
 * keys it is registered under, or by the `default` alone when it isn't registered. A widget `getWidget()` rejects, such
 * as a name that is neither registered nor an alias, gets whatever is declared for it without throwing
 */
function getWidgetDeclaration<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  widget: Widget<T, S, F> | string,
  { widgets, presentation }: PresentationSource<T, S, F>,
): WidgetPresentationDeclaration {
  let key: string | undefined;
  let component: unknown = widget;
  if (typeof widget === 'string') {
    key = getWidgetKey<S>(schema, widget, widgets) ?? widget;
    component = Object.hasOwn(widgets, key) ? widgets[key] : undefined;
  }
  // Merged entries already hold the `default`s beneath them, so this only matters for a single unmerged layer
  return layerDeclarations(
    presentation?.default,
    getComponentDeclaration(presentation?.widgets, widgets, component, key),
  );
}

/** Gets which parts of a field its template draws and which the components rendering it draw themselves, from the
 * declarations the theme registered for the keys of those components. Read from the components `SchemaField` already
 * resolved, never by predicting one, and never throwing where `getWidget()` would.
 *
 * A field component's declaration is the merged declaration for its key over the field default: the theme's
 * `fieldDefault` over drawing its own label and description. So a component gets the same answer however `SchemaField`
 * chose it; one no key named, or named by a key that declares nothing, is read under the first key it is registered
 * under that declares it. A field that renders a single widget declares `WIDGET_FIELD_PRESENTATION` to leave its parts
 * to that widget, whose declaration is the merged one for its key, beneath which `mergeThemePresentation()` layered
 * each layer's `default`, or the merged `default` for a widget no layer declares. A part a field leaves to its widget,
 * with no widget given, falls back to the field default, and a part nothing declares is drawn by the template.
 *
 * @param source - The registry's fields and widgets, and the merged `presentation`
 * @param subject - The field's schema and the components that render it
 * @returns - The owner of each part, and how a label the template draws reaches the control
 */
export default function getPresentationDeclaration<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  source: PresentationSource<T, S, F>,
  { schema, field, fieldKey, widget }: PresentationSubject<T, S, F>,
): ResolvedPresentationDeclaration {
  const fieldDefault = layerDeclarations(FIELD_DEFAULT, source.presentation?.fieldDefault);
  const fieldDeclaration = layerDeclarations(
    fieldDefault,
    getComponentDeclaration(source.presentation?.fields, source.fields, field, fieldKey),
  );
  const widgetDeclaration = widget === undefined ? fieldDefault : getWidgetDeclaration<T, S, F>(schema, widget, source);
  return {
    label: ownerOf('label', fieldDeclaration, widgetDeclaration),
    description: ownerOf('description', fieldDeclaration, widgetDeclaration),
    errors: ownerOf('errors', fieldDeclaration, widgetDeclaration),
    help: ownerOf('help', fieldDeclaration, widgetDeclaration),
    // How the template's label reaches the control, which is the widget's when the field leaves its label to it and
    // the widget says
    labelledBy:
      (fieldDeclaration.label === 'widget' ? widgetDeclaration.labelledBy : undefined) ??
      fieldDeclaration.labelledBy ??
      'for',
  };
}
