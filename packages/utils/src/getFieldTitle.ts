import { ADDITIONAL_PROPERTIES_KEY } from './constants.ts';
import { ROOT_FIELD_PATH, toFieldPath } from './fieldPath.ts';
import getFieldLabel from './getFieldLabel.ts';
import getItemUiSchemaForItem from './getItemUiSchemaForItem.ts';
import getOptionUiSchema from './getOptionUiSchema.ts';
import getUiOptions from './getUiOptions.ts';
import { isSchemaObject } from './isObject.ts';
import { getByPath } from './pathUtils.ts';
import { findChildField } from './schema/findFieldInSchema.ts';
import retrieveSchema from './schema/retrieveSchema.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema, UiSchema } from './types.ts';

/** Used by the validator packages to name an error by the field it is on. Returns the title the form labels the field
 * at the data `path` with: its `ui:title`, then the `title` of its schema as its parent declares it, then the `title`
 * of that schema retrieved for its data, as `getFieldLabel()` reads them, without a deprecated field's marker. The
 * schema and uiSchema are walked as the form renders the data, each level retrieved for its data, so a `$ref`, an
 * `allOf` and the `if`/`then` the data meets are merged in, an `anyOf`/`oneOf` field's keys are read from the option
 * shown for its data, under its `uiSchema.anyOf`/`oneOf` entry, and an array item's from `items`, under the option's
 * entry when an option renders the array, a function-form `items` called with the item's data and index. An item with
 * no title of its own takes the one `ArrayField` hands it, the array's schema `title` and the item's position, as
 * `Tags-1`. An extra key the form renders through `additionalProperties` or `patternProperties` is labelled by its key,
 * so it has no title, nor has an item of an array labelled by its key alone, nor the root, whose title titles the
 * form, nor a field behind a `$ref` `retrieveSchema()` can't resolve. A validator calls it with a `context` of its own,
 * so the title can differ from the label in the cases the form knows of and the validator doesn't: a form's
 * `customMergeAllOf`, where the title is read from the default `allOf` merge; the `anyOf`/`oneOf` option the user
 * picked, since the option is found from the data alone, so data that matches two options equally, as data failing
 * both can, is read under the first; a form's `additionalPropertiesWhenAbsent`, which option matching reads, so under
 * `'allow'` data holding a key no option declares can be read under another option than the form shows; and the
 * `formContext`, which a function-form `items` is called without.
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
  try {
    let field: S | undefined = rootSchema;
    let fieldUiSchema = uiSchema;
    let data: unknown = formData;
    let fieldPath = ROOT_FIELD_PATH;
    let handedTitle: string | undefined;
    let isExtraKey = false;
    for (const key of path) {
      const found: ReturnType<typeof findChildField<unknown, S, F>> = findChildField<unknown, S, F>(
        context,
        rootSchema,
        field,
        key,
        data,
      );
      const { origin } = found;
      if (origin === undefined) {
        return undefined;
      }
      const index = Number(key);
      const childData = getByPath(data, [key]);
      if (origin.kind === 'item') {
        const arrayUiSchema: UiSchema<T, S, F> | undefined = origin.option
          ? getOptionUiSchema<T, S, F>(fieldUiSchema, origin.option.xxxOf, origin.option.index)
          : fieldUiSchema;
        // The function form of `items` is called as `ArrayField` calls it, but with no `formContext`, which only the
        // form has, and under the array's path, so a function that throws is reported once for the form and the error
        fieldUiSchema = getItemUiSchemaForItem<T, S, F>(
          arrayUiSchema,
          getByPath<T>(data, [key]),
          index,
          undefined,
          fieldPath,
          origin.array,
        );
      } else if (origin.kind === 'option') {
        fieldUiSchema = getByPath(getOptionUiSchema<T, S, F>(fieldUiSchema, origin.xxxOf, origin.index), [key]);
      } else {
        fieldUiSchema = getByPath(fieldUiSchema, [origin.kind === 'additional' ? ADDITIONAL_PROPERTIES_KEY : key]);
      }
      // `ArrayField` hands an item a title after the array's schema title, then the title handed to the array, then the
      // array's key. One after the key labels the item by the key, so it is no title, as the key's own label isn't
      const arrayTitle = origin.kind === 'item' && (origin.array.title || handedTitle);
      handedTitle = arrayTitle ? `${arrayTitle}-${index + 1}` : undefined;
      isExtraKey = origin.kind === 'additional';
      fieldPath = toFieldPath(origin.kind === 'item' ? index : key, fieldPath);
      field = found.field;
      data = childData;
    }
    if (path.length === 0 || isExtraKey || !isSchemaObject<S>(field)) {
      return undefined;
    }
    const label = getFieldLabel<T, S, F>(
      retrieveSchema<unknown, S, F>(context, field, rootSchema, data),
      getUiOptions<T, S, F>(fieldUiSchema),
      // An error names the field, not its deprecation, so the marker's one parameter, the label, is taken as it is
      (_, params) => String(params),
      { title: handedTitle, unresolvedSchema: field },
    );
    return label || undefined;
  } catch {
    // A `$ref` `retrieveSchema()` can't resolve, such as one to a schema only the validator was given, names no field
    return undefined;
  }
}
