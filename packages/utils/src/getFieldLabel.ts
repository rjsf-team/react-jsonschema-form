import getUiOptions from './getUiOptions.ts';
import type { FormContextType, GlobalUISchemaOptions, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** The parameters accepted by `getFieldLabel()` */
export interface GetFieldLabelOptions<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> {
  /** The schema of the field, from which the `title` is read */
  schema: S;
  /** The optional uiSchema of the field, from which the `ui:title` is read */
  uiSchema?: UiSchema<T, S, F>;
  /** The optional `title` passed down to the field by its parent (i.e. the generated title for array items) */
  title?: string;
  /** The name of the field, used as the final fallback */
  name: string;
  /** The optional global UI options, passed through to `getUiOptions()` */
  globalUiOptions?: GlobalUISchemaOptions;
}

/** Computes the label text for a field, using the first defined value in the following precedence order:
 * 1. `ui:title` from the `uiSchema` (or global UI options)
 * 2. `title` from the `schema`
 * 3. `title` passed to the field by its parent (i.e. the generated `${arrayTitle}-${index + 1}` title for array items)
 * 4. `name` of the field
 *
 * Nullish coalescing (`??`) is used, so an explicitly empty string title (i.e. `'ui:title': ''`) is respected rather
 * than falling through to the next value, which allows a label to be intentionally blanked out.
 *
 * @param options - The `GetFieldLabelOptions` used to compute the label
 * @returns - The label text for the field
 */
export default function getFieldLabel<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ schema, uiSchema, title, name, globalUiOptions }: GetFieldLabelOptions<T, S, F>): string {
  const { title: uiTitle } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  return uiTitle ?? schema.title ?? title ?? name;
}
