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
import getClosestMatchingOption from './getClosestMatchingOption.ts';
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
function sourcesOf(schema: unknown): readonly unknown[] {
  return (isObject(schema) && sourcesOfOption(schema)) || [schema];
}

/** Returns the options `entry`, an option `retrieveSchema()` handed out, was built from, one from each list a merge of
 * lists rebuilt it from, in the order they were merged, or else `entry` itself
 */
function builtFrom<S extends StrictRJSFSchema>(entry: unknown, rootSchema: S): readonly unknown[] {
  if (!isSchemaObject<S>(entry)) {
    return sourcesOf(entry);
  }
  const { graph, node } = nodeOfSchema<S>(entry, rootSchema);
  const declared = graph.node(node);
  /* v8 ignore next -- an object the root holds, or adopts beside it, is an object node, as is a field handed out */
  return declared.kind === 'schema' ? sourcesOf(declared.raw) : [];
}

/** Returns the index in `options` of the option each option `retrieveSchema()` handed out stands for, given the
 * options each was `built` from: the option, or the one of `options` a merge of lists built it from, read at the same
 * position of each entry's sources, the position of the list `options` is. The position is what tells the field's own
 * list apart, since an option object can sit in more than one of the lists merged. A `false` entry, as a pair merged
 * to `false` is, records nothing it was built from, so it stands for none of them, -1, rather than leaving the whole
 * list untraced. Undefined where no position traces every other entry to an option
 */
function writtenIndices(built: readonly (readonly unknown[])[], options: readonly unknown[]): number[] | undefined {
  const positions = Math.max(1, ...built.map((sources) => sources.length));
  for (let at = 0; at < positions; at += 1) {
    const indices = built.map((sources) =>
      options.findIndex((option) => sourcesOf(option).every((source, i) => sources[at + i] === source)),
    );
    if (indices.every((index, entry) => index >= 0 || built[entry][0] === false)) {
      return indices;
    }
  }
  return undefined;
}

/** The options a field offering `options` renders, each retrieved for its data once asked for, since a pick over a
 * list no merge rebuilt needs none of them; where they are those `schema` retrieved for the data hands out, the index
 * in `options` of the option each stands for; and whether a merge of lists rebuilt them
 */
interface RenderedOptions<S extends StrictRJSFSchema> {
  readonly views: () => S[];
  readonly written: number[] | undefined;
  readonly rebuilt: boolean;
}

/** Returns the options a field offering `options` renders: those the field retrieved for `data` hands out,
 * `retrieved`, where each stands for one of `options`, see `writtenIndices()`, and else `options` as written. `rebuilt`
 * says a merge of lists built them. shortcut: a `customMergeAllOf`'s rebuilt options keep no record of what they were
 * built from, so its lists are read as written; upgrade if such a merge's fields need the form's pick
 */
function renderedOptions<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  retrieved: readonly unknown[] | undefined,
  options: readonly unknown[],
  rootSchema: S,
  data: unknown,
): RenderedOptions<S> {
  const built = retrieved?.map((entry) => builtFrom<S>(entry, rootSchema));
  const written = built && writtenIndices(built, options);
  const offered = written && retrieved ? retrieved : options;
  return {
    views: () =>
      offered.map((option) =>
        retrieveSchema<unknown, S, F>(context, isSchemaObject<S>(option) ? option : emptySchema<S>(), rootSchema, data),
      ),
    written,
    rebuilt: built?.some((sources) => sources.length > 1) === true && written !== undefined,
  };
}

/** Returns the index in `options` of the option at `index` of the options `rendered` the field renders, or -1 for an
 * index naming none of them
 */
function writtenIndex<S extends StrictRJSFSchema>(
  { written }: RenderedOptions<S>,
  options: readonly unknown[],
  index: number,
): number {
  const shown = written ? (written[index] ?? -1) : index;
  return shown >= 0 && shown < options.length ? shown : -1;
}

/** Returns the index of the option a field offering `options` picks for `data` with no option stored, where a merge
 * of lists rebuilt the options it renders, `retrieved`, as an `allOf` holding options of its own does: the field scores
 * the rebuilt options, as core's `SchemaField` does, and the pick names the option of `options` it was built from.
 * Undefined where the field renders `options` as written, or as retrieval hands each out alone, which scoring
 * `options` reads alike
 *
 * @param context - The `SchemaContext` the options are retrieved in
 * @param retrieved - The list the field retrieved for its data offers in place of `options`
 * @param options - The field's `anyOf` or `oneOf` list
 * @param rootSchema - The root schema, to resolve `$ref`s with
 * @param data - The field's data, or the value it is matched by
 * @param [discriminatorField] - The property the options are told apart by, if any
 * @returns - The index of the option picked, -1 for none, or undefined where no merge rebuilt the options
 */
export function rebuiltOptionPick<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  retrieved: readonly unknown[] | undefined,
  options: readonly unknown[],
  rootSchema: S,
  data: unknown,
  discriminatorField?: string,
): number | undefined {
  const rendered = renderedOptions<S, F>(context, retrieved, options, rootSchema, data);
  if (!rendered.rebuilt) {
    return undefined;
  }
  const index = getClosestMatchingOption<unknown, S, F>(
    context,
    rootSchema,
    data,
    rendered.views(),
    -1,
    discriminatorField,
  );
  return writtenIndex<S>(rendered, options, index);
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
  const rendered = renderedOptions<S, F>(context, retrieved, options, rootSchema, data);
  const index = fieldState.selectedOption(
    fieldPathFromList(path),
    rendered.views(),
    data,
    getDiscriminatorFieldFromSchema<S>(schema),
  );
  return writtenIndex<S>(rendered, options, index);
}
