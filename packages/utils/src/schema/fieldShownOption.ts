import { TranslatableString } from '../enums.ts';
import { fieldPathFromList } from '../fieldPath.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getUiOptions from '../getUiOptions.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import type { XxxOfOptions } from '../getXxxOfOptions.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import type {
  FieldPathList,
  FormContextType,
  FormFieldState,
  RJSFSchema,
  SchemaContext,
  Registry,
  StrictRJSFSchema,
  UiSchema,
} from '../types.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import { isHandedOut } from './graph/handedOut.ts';
import { emptySchema, sourcesOfOption } from './graph/mergePlan.ts';
import nodeOfSchema from './graph/nodeOfSchema.ts';
import parseSchemaGraph from './graph/parseSchemaGraph.ts';
import type { NodeId, SchemaGraph } from './graph/parseSchemaGraph.ts';
import { readProvenance } from './graph/provenance.ts';
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
 * `sourcesOfOption()`, each read the same way, as a `then` list merged over one an `allOf` rebuilt builds from rebuilt
 * options, or else the schema itself
 */
function sourcesOf(schema: unknown): readonly unknown[] {
  const sources = isObject(schema) ? sourcesOfOption(schema) : undefined;
  return sources ? sources.flatMap(sourcesOf) : [schema];
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

/** Returns the list `keyword` holds where the node `id` declares a field, following a `$ref` that holds no list of its
 * own, or undefined where none of them holds one, as a field whose lists sit only in `allOf` entries
 *
 * @param graph - The graph holding the field
 * @param id - The node of the field's declaration
 * @param keyword - The `anyOf` or `oneOf` keyword
 * @returns - The list as written, or undefined
 * @testSeam Exported for utils' own tests
 */
export function writtenListOf<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  keyword: string,
): readonly unknown[] | undefined {
  const seen = new Set<NodeId>();
  for (let at: NodeId | undefined = id; at !== undefined && !seen.has(at);) {
    seen.add(at);
    const declared = graph.node(at);
    if (declared.kind !== 'schema') {
      return undefined;
    }
    const list: unknown = Reflect.get(declared.raw, keyword);
    if (Array.isArray(list)) {
      return list as readonly unknown[];
    }
    at = declared.ref;
  }
  return undefined;
}

/** Returns the list `keyword` holds where the field the seeds `seeds` of `graph` declare is declared, see
 * `writtenListOf()`, read from the first declaring one. Every seed is read, since a field declared in two places is
 * seeded by each
 *
 * @param graph - The graph holding the field
 * @param seeds - The field's seeds
 * @param keyword - The `anyOf` or `oneOf` keyword
 * @returns - The list as written, or undefined
 */
export function seedsWrittenList<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  seeds: readonly { readonly node: NodeId }[],
  keyword: string,
): readonly unknown[] | undefined {
  return seeds.map(({ node }) => writtenListOf<S>(graph, node, keyword)).find((list) => list !== undefined);
}

/** The options a field `retrieveSchema()` handed out offers, what each was built from, see `builtFrom()`, and the
 * field's list as written with the index in it of the option each stands for, where they trace to it
 */
interface WrittenTrace {
  readonly listed: XxxOfOptions;
  readonly built: readonly (readonly unknown[])[];
  readonly written: readonly unknown[] | undefined;
  readonly indices: number[] | undefined;
}

/** Returns the options `view`, a field's schema `retrieveSchema()` handed out, offers traced to its list as written,
 * see `WrittenTrace`, or undefined where it offers none
 */
function writtenTrace<S extends StrictRJSFSchema>(view: S, rootSchema: S): WrittenTrace | undefined {
  const listed = getXxxOfOptions<S>(view);
  if (!listed) {
    return undefined;
  }
  const built = listed.options.map((option) => builtFrom<S>(option, rootSchema));
  const stamped = isHandedOut(view) ? readProvenance<S>(view, parseSchemaGraph<S>(rootSchema)) : undefined;
  const written = stamped && seedsWrittenList<S>(stamped.graph, stamped.seeds, listed.key);
  return { listed, built, written, indices: written && writtenIndices(built, written) };
}

/** Returns the index in `written`, a field's list as written, of the option each of `options` stands for, as
 * `writtenIndices()` traces it, or undefined where an option can't be traced to one of them
 *
 * @param options - The options the field renders, or a list a plan merged them into
 * @param written - The field's list as written
 * @param rootSchema - The root schema
 * @returns - The index of each option in `written`, or undefined
 */
export function writtenOptionIndices<S extends StrictRJSFSchema>(
  options: readonly unknown[],
  written: readonly unknown[],
  rootSchema: S,
): number[] | undefined {
  return writtenIndices(
    options.map((option) => builtFrom<S>(option, rootSchema)),
    written,
  );
}

/** Returns the `anyOf`/`oneOf` entries of `uiSchema` in the order of the options `view`, a field's schema
 * `retrieveSchema()` handed out, offers, for an option's entry to be looked up by its position among them, as with
 * `selectOptionUiSchema()`. An entry describes the option of the field's list as written at its index, and an option
 * a merge of lists rebuilt, as an `allOf` or a `then` holding a list beside the field's own rebuilds them, stands for
 * the option of the field's own list it was built from, so each option the field renders reads that option's entry.
 * The entries are returned as they stand where the order is the same, where the field declares no list of its own, as
 * one whose lists sit only in `allOf` entries, or where its options can't be traced to that list, as under a
 * `customMergeAllOf`; each option then reads the entry at its own position
 *
 * @param uiSchema - The field's uiSchema
 * @param view - The field's schema as `retrieveSchema()` handed it out
 * @param rootSchema - The root schema
 * @returns - The entries in the order of the options the field renders, or undefined where `uiSchema` lists none
 */
export function renderedOptionsUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F> | undefined, view: S, rootSchema: S): UiSchema<T, S, F>[] | undefined {
  const keyword = getXxxOfOptions<S>(view)?.key;
  const entries: UiSchema<T, S, F>[] | undefined = keyword && uiSchema?.[keyword];
  if (!Array.isArray(entries)) {
    return undefined;
  }
  const indices = writtenTrace<S>(view, rootSchema)?.indices;
  return !indices || indices.every((index, position) => index === position)
    ? entries
    : indices.map((index) => entries[index]);
}

/** Returns the name the option `source` is labelled with: its `title`, or the `title` its uiSchema entry `entry` gives
 * it, `ui:title` or `ui:options.title`, as `MultiSchemaField` reads it. shortcut: an option written as a `$ref` is named
 * by the `title` beside the `$ref` only; upgrade if merged options built from such options need their definitions'
 * titles
 */
function optionName(source: unknown, entry?: unknown): string | undefined {
  const uiTitle: unknown = isObject(entry) ? getUiOptions(entry).title : undefined;
  const title: unknown = isObject(source) ? Reflect.get(source, 'title') : undefined;
  const name = typeof uiTitle === 'string' ? uiTitle : title;
  return typeof name === 'string' && name !== '' ? name : undefined;
}

/** Returns, for each option `view`, a field's schema `retrieveSchema()` handed out, offers, the title of an option a
 * merge of lists built: the names of the options it was built from, each named once, in the order they were merged,
 * joined pairwise by `translateString`'s `TranslatableString.MergedOptionTitle`, where at least two differ. The option
 * of the field's own list it was built from is named by its uiSchema entry's title first, see
 * `renderedOptionsUiSchema()`, and each other option by its `title`. An option built from one, or from options naming
 * no two names, has none, and is labelled as any other option is, as is one whose entry names it where the entries
 * describe the options at their positions, as for a field whose lists sit only in `allOf` entries
 *
 * @param uiSchema - The field's uiSchema
 * @param view - The field's schema as `retrieveSchema()` handed it out
 * @param rootSchema - The root schema
 * @param translateString - The registry's string translator
 * @returns - The title of each option, or undefined where `view` offers none
 */
export function renderedOptionTitles<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  uiSchema: UiSchema<T, S, F> | undefined,
  view: S,
  rootSchema: S,
  translateString: Registry<T, S, F>['translateString'],
): (string | undefined)[] | undefined {
  const trace = writtenTrace<S>(view, rootSchema);
  if (!trace) {
    return undefined;
  }
  const { listed, built, written, indices } = trace;
  if (built.every((sources) => sources.length < 2)) {
    return listed.options.map(() => undefined);
  }
  const given: unknown = uiSchema?.[listed.key];
  const entries = Array.isArray(given) ? given : [];
  return built.map((sources, position) => {
    const writtenAt = indices?.[position];
    if (sources.length < 2 || (writtenAt === undefined && optionName(undefined, entries[position]) !== undefined)) {
      return undefined;
    }
    const writtenOption = writtenAt === undefined ? undefined : written?.[writtenAt];
    const names = [
      ...new Set(
        sources.flatMap((source) => {
          const name =
            writtenAt !== undefined && source === writtenOption
              ? optionName(source, entries[writtenAt])
              : optionName(source);
          return name === undefined ? [] : [name];
        }),
      ),
    ];
    return names.length > 1
      ? names.reduce((joined, next) => translateString(TranslatableString.MergedOptionTitle, [joined, next]))
      : undefined;
  });
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
 * @param [retrieved] - The list the field retrieved for its data renders, where the caller has it, as for a list an
 *        `allOf` entry offers a field holding no list of its own, whose product of the lists `schema` doesn't hold
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
  retrieved?: readonly unknown[],
): number {
  const keyword = OPTION_KEYWORDS.find((key) => schema[key] === options);
  const rendered = renderedOptions<S, F>(
    context,
    retrieved ?? (keyword && retrieveSchema<unknown, S, F>(context, schema, rootSchema, data)[keyword]),
    options,
    rootSchema,
    data,
  );
  const index = fieldState.selectedOption(
    fieldPathFromList(path),
    rendered.views(),
    data,
    getDiscriminatorFieldFromSchema<S>(schema),
  );
  return writtenIndex<S>(rendered, options, index);
}
