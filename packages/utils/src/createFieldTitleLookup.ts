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
import type { FieldPath, FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema, UiSchema } from './types.ts';

/** The field the form renders at a data path, as the walk from the root reached it */
interface FieldStep<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The field's schema as its parent declares it, if it declares one */
  field: S | undefined;
  /** The field's uiSchema */
  uiSchema?: UiSchema<T, S, F>;
  /** The field's data */
  data: unknown;
  /** The field's `FieldPath`, which a function-form `items` is called under */
  fieldPath: FieldPath;
  /** The title `ArrayField` hands the field, an item's */
  handedTitle?: string;
  /** Whether the field is an extra key, which the form labels by its key */
  isExtraKey: boolean;
  /** The field of each key below this one walked so far, `null` where the form renders none */
  children: Map<string, FieldStep<T, S, F> | null>;
  /** The field's title, once read */
  title?: { value: string | undefined };
}

/** Used by the validator packages to name the fields of the errors of one validation. Returns a function that returns
 * the title the form labels the field at a data `path` with, as `getFieldTitle()` reads it. Each field is walked to
 * once, so the paths of errors that share an ancestor share its walk, and an `anyOf`/`oneOf` above many errors picks
 * its option once rather than once per error.
 *
 * @param context - The `SchemaContext` of the form
 * @param rootSchema - The form's root schema
 * @param [formData] - The form's data, which picks the branches and options the form renders
 * @param [uiSchema] - The form's uiSchema
 * @returns - A function returning the title of the field at the data `path`, such as `['arr', '0', 'name']`, or
 *          `undefined` when the form labels it with none or renders no field at the path
 */
export default function createFieldTitleLookup<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  formData?: T,
  uiSchema?: UiSchema<T, S, F>,
): (path: string[]) => string | undefined {
  const root: FieldStep<T, S, F> = {
    field: rootSchema,
    uiSchema,
    data: formData,
    fieldPath: ROOT_FIELD_PATH,
    isExtraKey: false,
    children: new Map(),
  };

  const childOf = (parent: FieldStep<T, S, F>, key: string): FieldStep<T, S, F> | null => {
    const known = parent.children.get(key);
    if (known !== undefined) {
      return known;
    }
    let child: FieldStep<T, S, F> | null = null;
    try {
      const { origin, field } = findChildField<unknown, S, F>(context, rootSchema, parent.field, key, parent.data);
      if (origin !== undefined) {
        const index = Number(key);
        const { data, fieldPath, handedTitle } = parent;
        let fieldUiSchema: UiSchema<T, S, F> | undefined;
        if (origin.kind === 'item') {
          const arrayUiSchema: UiSchema<T, S, F> | undefined = origin.option
            ? getOptionUiSchema<T, S, F>(parent.uiSchema, origin.option.xxxOf, origin.option.index)
            : parent.uiSchema;
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
          fieldUiSchema = getByPath(getOptionUiSchema<T, S, F>(parent.uiSchema, origin.xxxOf, origin.index), [key]);
        } else {
          fieldUiSchema = getByPath(parent.uiSchema, [origin.kind === 'additional' ? ADDITIONAL_PROPERTIES_KEY : key]);
        }
        // `ArrayField` hands an item a title after the array's schema title, then the title handed to the array, then
        // the array's key. One after the key labels the item by the key, no title, as the key's own label isn't one
        const arrayTitle = origin.kind === 'item' && (origin.array.title || handedTitle);
        child = {
          field,
          uiSchema: fieldUiSchema,
          data: getByPath(data, [key]),
          fieldPath: toFieldPath(origin.kind === 'item' ? index : key, fieldPath),
          handedTitle: arrayTitle ? `${arrayTitle}-${index + 1}` : undefined,
          isExtraKey: origin.kind === 'additional',
          children: new Map(),
        };
      }
    } catch {
      // A `$ref` `retrieveSchema()` can't resolve, such as one to a schema only the validator was given, names no field
    }
    parent.children.set(key, child);
    return child;
  };

  const titleOf = (step: FieldStep<T, S, F>): string | undefined => {
    if (step.isExtraKey || !isSchemaObject<S>(step.field)) {
      return undefined;
    }
    try {
      const label = getFieldLabel<T, S, F>(
        retrieveSchema<unknown, S, F>(context, step.field, rootSchema, step.data),
        getUiOptions<T, S, F>(step.uiSchema),
        // An error names the field, not its deprecation, so the marker's one parameter, the label, is taken as it is
        (_, params) => String(params),
        { title: step.handedTitle, unresolvedSchema: step.field },
      );
      return label || undefined;
    } catch {
      // As above, a field behind a `$ref` `retrieveSchema()` can't resolve has no title
      return undefined;
    }
  };

  return (path) => {
    let step: FieldStep<T, S, F> | null = root;
    for (const key of path) {
      step = childOf(step, key);
      if (step === null) {
        return undefined;
      }
    }
    if (step === root) {
      return undefined;
    }
    step.title ??= { value: titleOf(step) };
    return step.title.value;
  };
}
