import { fieldPathFromList } from '../fieldPath.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import { isSchemaObject } from '../isObject.ts';
import type {
  FieldPathList,
  FormContextType,
  FormFieldState,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
} from '../types.ts';
import { emptySchema } from './graph/mergePlan.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Whether a field offering `options` renders them as one select rather than as an option field, as an `enum` beside
 * them or a list of constants does. A select stores no option it shows, so there is none to ask about.
 *
 * @param schema - The schema offering the options
 * @param options - Its `anyOf` or `oneOf` list
 * @returns - True when the field renders as a select
 */
export function rendersOptionsAsSelect<S extends StrictRJSFSchema = RJSFSchema>(schema: S, options: unknown): boolean {
  return Array.isArray(schema.enum) || isConstantOptionList<S>(options);
}

/** Returns the index of the option the field at `path` offering `options` shows, as `fieldState` says. The field picks
 * among its options as it renders them, each retrieved for its data, which can match the data where the option as
 * written does not, as an `if`/`then` that declares a key does. A `fieldState` is a caller's to implement, so an index
 * naming none of the options, as a selection kept after the schema dropped an option can, is -1, as none shown is.
 *
 * @param context - The `SchemaContext` the options are retrieved in
 * @param fieldState - The fields the form shows
 * @param path - The path of the field
 * @param schema - The schema offering the options, which names their discriminator
 * @param options - Its `anyOf` or `oneOf` list
 * @param rootSchema - The root schema, to resolve `$ref`s with
 * @param data - The field's data
 * @returns - The index of the option shown, or -1 for none
 */
export default function fieldShownOption<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  fieldState: FormFieldState<S>,
  path: FieldPathList,
  schema: S,
  options: readonly unknown[],
  rootSchema: S,
  data: unknown,
): number {
  const views = options.map((option) =>
    retrieveSchema<unknown, S, F>(context, isSchemaObject<S>(option) ? option : emptySchema<S>(), rootSchema, data),
  );
  const index = fieldState.selectedOption(
    fieldPathFromList(path),
    views,
    data,
    getDiscriminatorFieldFromSchema<S>(schema),
  );
  return index >= 0 && index < options.length ? index : -1;
}
