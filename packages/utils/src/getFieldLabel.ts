import { ADDITIONAL_PROPERTY_FLAG } from './constants.ts';
import { TranslatableString } from './enums.ts';
import getDeprecatedHandling from './getDeprecatedHandling.ts';
import hasSchemaMarker from './hasSchemaMarker.ts';
import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UIOptionsType } from './types.ts';

/** Where a field's label can come from besides its schema and `uiSchema` */
export interface FieldLabelSources<S extends StrictRJSFSchema = RJSFSchema> {
  /** The property name or key the field renders under */
  name?: string;
  /** The title the parent field hands down as `FieldProps.title` */
  title?: string;
  /** The schema as the parent wrote it, before `retrieveSchema()` resolved it, whose `title` sits beside a `$ref` */
  unresolvedSchema?: S;
}

/** Computes the label of a field: the label its `FieldTemplate` shows, and the one its field component hands its
 * widget, so the two can't disagree. An empty `title` falls through to the next source, ending at the property name.
 * An `additionalProperties` entry is labelled by its key, since its schema's `title` describes every entry alike. A
 * deprecated field's label is decorated with the `DeprecatedLabel` marker, but only a label there is: a field with no
 * title and no name, such as the root or an item of an array that has no name or title of its own, stays unlabelled
 * rather than reading `(deprecated)` alone.
 *
 * @param schema - The resolved schema of the field
 * @param uiOptions - The resolved UI options of the field, read for `title` and `deprecatedHandling`
 * @param translateString - The registry's `translateString`, which decorates a deprecated field's label
 * @param [sources={}] - The other sources the label can come from
 * @returns - The label, or `''` when the field has none
 */
export default function getFieldLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiOptions: UIOptionsType<T, S, F>,
  translateString: Registry<T, S, F>['translateString'],
  { name = '', title, unresolvedSchema }: FieldLabelSources<S> = {},
): string {
  const label = hasSchemaMarker(schema, ADDITIONAL_PROPERTY_FLAG)
    ? name
    : uiOptions.title || unresolvedSchema?.title || schema.title || title || name;
  return label && getDeprecatedHandling<T, S, F>(schema, uiOptions) === 'label'
    ? translateString(TranslatableString.DeprecatedLabel, [label])
    : label;
}
