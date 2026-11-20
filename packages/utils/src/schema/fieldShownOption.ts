import { fieldPathFromList } from '../fieldPath.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import type {
  FieldPathList,
  FormContextType,
  FormFieldState,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
} from '../types.ts';
import { emptySchema, sourcesOfOption } from './graph/mergePlan.ts';
import nodeOfSchema from './graph/nodeOfSchema.ts';
import retrieveSchema, { OPTION_KEYWORDS } from './retrieveSchema.ts';

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

/** Returns the options a schema is read as built from: those a plan's merge of lists rebuilt it from, see
 * `sourcesOfOption()`, or else the schema itself
 */
function sourcesOf(schema: object): readonly unknown[] {
  return sourcesOfOption(schema) ?? [schema];
}

/** Whether `entry`, an option `retrieveSchema()` handed out, stands for `option`: it is the option, or one a merge of
 * lists built from it, or from all the options `option` was built from where a merge rebuilt `option` too
 */
function standsFor<S extends StrictRJSFSchema>(entry: unknown, option: unknown, rootSchema: S): boolean {
  if (!isSchemaObject<S>(entry)) {
    return entry === option;
  }
  const { graph, node } = nodeOfSchema<S>(entry, rootSchema);
  const declared = graph.node(node);
  if (declared.kind !== 'schema' || !isObject(option)) {
    return false;
  }
  const built = sourcesOf(declared.raw);
  return sourcesOf(option).every((source) => built.includes(source));
}

/** Returns the index of the option the field at `path` offering `options` shows, as `fieldState` says. The field picks
 * among its options as it renders them: those `schema` retrieved for its data hands out, each retrieved for that data,
 * which can match the data where the option as written does not, as an `if`/`then` that declares a key does. An option
 * handed out beside an object rendering its own field leaves the data's extra keys to that field. A list the retrieval
 * rebuilt, as an `allOf` holding options of its own does, offers each option merged with others, which the option the
 * field shows names the option of `options` it was built from. A list `schema` does not hold, or whose options can't
 * be traced to `options`, is retrieved as written. A `fieldState` is a caller's to implement, so an index naming none
 * of the options, as a selection kept after the schema dropped an option can, is -1, as none shown is.
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
  const keyword = OPTION_KEYWORDS.find((key) => schema[key] === options);
  const retrieved: unknown[] | undefined =
    keyword && retrieveSchema<unknown, S, F>(context, schema, rootSchema, data)[keyword];
  // The index names one of `options`, so the retrieved list stands in only where each of its options stands for one of
  // them. shortcut: a `customMergeAllOf`'s rebuilt options keep no record of what they were built from, so its lists
  // are read as written; upgrade if such a merge's fields need the form's pick
  const written = (retrieved ?? []).map((entry) =>
    options.findIndex((option) => standsFor<S>(entry, option, rootSchema)),
  );
  const traced = retrieved !== undefined && written.every((index) => index >= 0);
  const offered: readonly unknown[] = traced ? retrieved : options;
  const views = offered.map((option) =>
    retrieveSchema<unknown, S, F>(context, isSchemaObject<S>(option) ? option : emptySchema<S>(), rootSchema, data),
  );
  const index = fieldState.selectedOption(
    fieldPathFromList(path),
    views,
    data,
    getDiscriminatorFieldFromSchema<S>(schema),
  );
  const shown = traced ? (written[index] ?? -1) : index;
  return shown >= 0 && shown < options.length ? shown : -1;
}
