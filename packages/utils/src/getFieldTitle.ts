import createFieldTitleLookup from './createFieldTitleLookup.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the title the form labels the field at the data `path` with: its `ui:title`, then the `title` of its schema
 * as its parent declares it, then the `title` of that schema retrieved for its data, as `getFieldLabel()` reads them,
 * without a deprecated field's marker. The schema and uiSchema are walked as the form renders the data, each level
 * retrieved for its data, so a `$ref`, an `allOf` and the `if`/`then` the data meets are merged in, an `anyOf`/`oneOf`
 * field's keys are read from the option shown for its data, under its `uiSchema.anyOf`/`oneOf` entry, and an array
 * item's from `items`, under the option's entry when an option renders the array, a function-form `items` called with
 * the item's data and index. An item with no title of its own takes the one `ArrayField` hands it, the array's schema
 * `title` and the item's position, as `Tags-1`. An extra key the form renders through `additionalProperties` or
 * `patternProperties` is labelled by its key, so it has no title, nor has an item of an array labelled by its key
 * alone, nor the root, whose title titles the form, nor a field behind a `$ref` `retrieveSchema()` can't resolve. A
 * validator calls it with a `context` of its own, so the title can differ from the label in the cases the form knows of
 * and the validator doesn't: a form's `customMergeAllOf`, where the title is read from the default `allOf` merge; the
 * `anyOf`/`oneOf` option the user picked, since the option is found from the data alone, so data that matches two
 * options equally, as data failing both can, is read under the first; a form's `additionalPropertiesWhenAbsent`, which
 * option matching reads, so under `'allow'` data holding a key no option declares can be read under another option than
 * the form shows; and the `formContext`, which a function-form `items` is called without. The validator packages name
 * the fields of one validation's errors with `createFieldTitleLookup()`, which reads them as this does.
 *
 * @param context - The `SchemaContext` of the form
 * @param rootSchema - The form's root schema
 * @param path - The data path of the field, such as `['arr', '0', 'name']`
 * @param [formData] - The form's data, which picks the branches and options the form renders
 * @param [uiSchema] - The form's uiSchema
 * @returns - The field's title, or `undefined` when the form labels it with none or renders no field at the path
 */
export default function getFieldTitle<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  path: string[],
  formData?: T,
  uiSchema?: UiSchema<T, S, F>,
): string | undefined {
  return createFieldTitleLookup<T, S, F>(context, rootSchema, formData, uiSchema)(path);
}
