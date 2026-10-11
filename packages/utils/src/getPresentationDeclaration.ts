import { getWidgetKey, isStandardWidgetKey } from './getWidget.tsx';
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
} from './types.ts';

/** The parts of the registry a declaration is looked up in. A `Registry` carrying its theme's `presentation` is one */
export type PresentationSource<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<Registry<T, S, F>, 'widgets'> & {
  /** The declarations the form's theme registered */
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
  /** The key the field component is registered under, when a key named it */
  fieldKey?: string;
  /** Whether the field component was named by a `ui:field` or a `$id`, rather than chosen for the schema's type */
  isNamedField?: boolean;
  /** The single widget the field renders its value with, as an alias, a registry key or a component. Left out for a
   * field that renders no single widget, such as an object's or an array's
   */
  widget?: Widget<T, S, F> | string;
}

/** A field named by a `ui:field` or a `$id` was written for its schema, so it is trusted to draw its own label and
 * description, unless it or the theme declares otherwise
 */
const NAMED_FIELD: PresentationDeclaration = { label: 'self', description: 'self' };

/** A field chosen for a schema's type that renders a single widget leaves every part to whoever that widget says
 * draws it
 */
const WIDGET_FIELD: PresentationDeclaration = {
  label: 'widget',
  description: 'widget',
  errors: 'widget',
  help: 'widget',
};

const NO_DECLARATION: PresentationDeclaration = {};

/** Gets who draws `part`: the field, or the widget when the field leaves the part to it, settled on the template
 * unless that one draws it itself
 */
function ownerOf(
  part: PresentationPart,
  fieldDeclaration: PresentationDeclaration,
  widgetDeclaration: PresentationDeclaration,
) {
  const owner = fieldDeclaration[part];
  return (owner === 'widget' ? widgetDeclaration[part] : owner) === 'self' ? 'self' : 'template';
}

/** Gets the declaration of the widget a field renders: its key's `standardWidgets` and `widgets` declarations, under
 * the component's own. An alias is looked up by the key it stands for, and a component given directly by its own
 * declaration alone. A name that is neither registered nor an alias declares nothing, so the template draws every part
 */
function getWidgetDeclaration<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  widget: Widget<T, S, F> | string,
  { widgets, presentation = {} }: PresentationSource<T, S, F>,
): PresentationDeclaration {
  if (typeof widget !== 'string') {
    return layerDeclarations(widget.presentation);
  }
  const key = getWidgetKey<S>(schema, widget, widgets);
  if (key === undefined) {
    return NO_DECLARATION;
  }
  return layerDeclarations(
    isStandardWidgetKey(key) ? presentation.standardWidgets : undefined,
    getOwnDeclaration(presentation.widgets, key),
    Object.hasOwn(widgets, key) ? widgets[key].presentation : undefined,
  );
}

/** Gets which parts of a field its template draws and which the components rendering it draw themselves, from the
 * declarations the theme registered and the components carry. Read from the components `SchemaField` already resolved,
 * never by predicting one, and never throwing where `getWidget()` would.
 *
 * A field component's declaration layers its own `presentation` over the theme's under its key, and that over the
 * default for how it was chosen: a field named by a `ui:field` or a `$id` draws its label and description, and one
 * chosen for the schema's type that renders a single widget leaves every part to that widget. A widget's declaration
 * layers its own `presentation` over the theme's under its key, and that over `standardWidgets` for a key
 * `@rjsf/core` registers. A part a field leaves to its widget, with no widget given, and a part nothing declares, are
 * drawn by the template.
 *
 * @param source - The registry's widgets and the theme's `presentation`
 * @param subject - The field's schema and the components that render it
 * @returns - The owner of each part, and how a label the template draws reaches the control
 */
export default function getPresentationDeclaration<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  source: PresentationSource<T, S, F>,
  { schema, field, fieldKey, isNamedField = false, widget }: PresentationSubject<T, S, F>,
): ResolvedPresentationDeclaration {
  const fields = source.presentation?.fields;
  let base: PresentationDeclaration | undefined;
  if (isNamedField) {
    base = NAMED_FIELD;
  } else if (widget !== undefined) {
    base = WIDGET_FIELD;
  }
  const fieldDeclaration = layerDeclarations(base, getOwnDeclaration(fields, fieldKey), field.presentation);
  const widgetDeclaration =
    widget === undefined ? NO_DECLARATION : getWidgetDeclaration<T, S, F>(schema, widget, source);
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
