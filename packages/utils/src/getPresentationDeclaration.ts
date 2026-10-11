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
  MergedThemePresentation,
  Widget,
  WidgetPresentationDeclaration,
} from './types.ts';

/** The parts of the registry a declaration is looked up in. A `Registry` carrying its theme's `presentation` is one */
export type PresentationSource<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<Registry<T, S, F>, 'widgets'> & {
  /** The declarations of the form's layers, as `mergeThemePresentation()` merged them */
  readonly presentation?: Partial<MergedThemePresentation>;
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
  /** The key the field component is registered under, when a key named it */
  fieldKey?: string;
  /** The single widget the field renders its value with, as an alias, a registry key or a component. Left out for a
   * field that renders no single widget, such as an object's or an array's
   */
  widget?: Widget<T, S, F> | string;
}

/** What a field draws when nothing declares otherwise: its own label and description, as a field written for its
 * schema does, leaving its errors and help to the template. It is also what a part the field leaves to its widget
 * falls back to when it renders no single widget
 */
const FIELD_DEFAULT: WidgetPresentationDeclaration = { label: 'self', description: 'self' };

/** The declaration of a field that renders its value with a single widget and leaves every part to whoever that widget
 * says draws it, such as `@rjsf/core`'s `StringField`. A field that renders a single widget only sometimes, such as
 * `ArrayField` for a multi-select, falls back to `FIELD_DEFAULT` for every part when it renders none
 */
export const WIDGET_FIELD_PRESENTATION: Readonly<PresentationDeclaration> = Object.freeze({
  label: 'widget',
  description: 'widget',
  errors: 'widget',
  help: 'widget',
});

const NO_DECLARATION: WidgetPresentationDeclaration = {};

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

/** Gets the declaration of the widget a field renders: the theme's declaration for its key, under the component's own.
 * An alias is looked up by the key it stands for, and a component given directly by its own declaration alone. A name
 * that is neither registered nor an alias, or a key registered as nothing, declares nothing, so the template draws
 * every part
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
  // A `null` from a JSON `uiSchema`, or a key registered as nothing, is left to throw in `getWidget()`, whose error
  // names the schema
  if (typeof widget !== 'string') {
    return layerDeclarations(widget?.presentation);
  }
  const key = getWidgetKey<S>(schema, widget, widgets);
  const registered = key !== undefined && Object.hasOwn(widgets, key);
  if (key === undefined || (registered && !widgets[key])) {
    return NO_DECLARATION;
  }
  return layerDeclarations(
    getOwnDeclaration(presentation?.widgets, key),
    registered ? widgets[key].presentation : undefined,
  );
}

/** Gets which parts of a field its template draws and which the components rendering it draw themselves, from the
 * declarations the theme registered and the components carry. Read from the components `SchemaField` already resolved,
 * never by predicting one, and never throwing where `getWidget()` would.
 *
 * A field component's declaration layers its own `presentation` over the merged declaration for its key, and that over
 * the default, which draws its own label and description, so a component gets the same answer however `SchemaField`
 * chose it. A field that renders a single widget declares `WIDGET_FIELD_PRESENTATION` to leave its parts to that
 * widget, whose declaration layers its own `presentation` over the merged declaration for its key, which is where
 * `mergeThemePresentation()` put any `standardWidgets` that reach it. A part a field leaves to its widget, with no
 * widget given, falls back to the default, and a part nothing declares is drawn by the template.
 *
 * @param source - The registry's widgets and the merged `presentation`
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
  const fieldDeclaration = layerDeclarations(
    FIELD_DEFAULT,
    getOwnDeclaration(source.presentation?.fields, fieldKey),
    field.presentation,
  );
  const widgetDeclaration =
    widget === undefined ? FIELD_DEFAULT : getWidgetDeclaration<T, S, F>(schema, widget, source);
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
