import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ANY_OF_KEY,
  ONE_OF_KEY,
  RJSF_REF_CYCLE_KEY,
  UI_DEFINITIONS_KEY,
} from '../constants.ts';
import ErrorSchemaBuilder from '../ErrorSchemaBuilder.ts';
import { fieldPathFromList } from '../fieldPath.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getItemUiSchemaForItem from '../getItemUiSchemaForItem.ts';
import getOptionUiSchema from '../getOptionUiSchema.ts';
import getSchemaType from '../getSchemaType.ts';
import getUiOptions from '../getUiOptions.ts';
import isFixedItems from '../isFixedItems.ts';
import isFormDataAvailable from '../isFormDataAvailable.ts';
import isObject from '../isObject.ts';
import mergeSchemas from '../mergeSchemas.ts';
import { getByPath } from '../pathUtils.ts';
import resolveUiSchema from '../resolveUiSchema.ts';
import { getSchemaTypesForXxxOf } from '../shouldRenderOptionalField.ts';
import type {
  CustomMergeAllOf,
  ErrorSchema,
  FieldPath,
  FormContextType,
  GenericObjectType,
  GlobalUISchemaOptions,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  UiSchemaDefinitions,
  ValidatorType,
} from '../types.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import { AdditionalItemsHandling, getInnerSchemaForArrayItem } from './getDefaultFormState.ts';
import retrieveSchema from './retrieveSchema.ts';

/** The schema and uiSchema of the `anyOf`/`oneOf` branch that applies to a node. */
interface SelectedBranch<T, S extends StrictRJSFSchema, F extends FormContextType> {
  schema: S;
  uiSchema: UiSchema<T, S, F>;
}

/** Resolves the `anyOf`/`oneOf` branch that currently applies to `formData`, the same way `computeDefaults()` picks
 * the option it uses, so the walk descends into the branch's schema. Also resolves the uiSchema that
 * `MultiSchemaField` would pass down to that branch's children: `uiSchema[ONE_OF_KEY][index]` /
 * `uiSchema[ANY_OF_KEY][index]` when the matching keyword's uiSchema is an array reaching that index, falling back to
 * `uiSchema` itself otherwise (`AnyOfField`'s own `optionsUiSchema`/`optionUiSchema`) — a plain per-key entry on
 * `uiSchema` (e.g. `uiSchema.thing.b`) is never consulted for a branch's own fields, matching what actually renders.
 */
function resolveSelectedBranch<T, S extends StrictRJSFSchema, F extends FormContextType>(
  validator: ValidatorType<S, F>,
  rootSchema: S,
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  formData: unknown,
  customMergeAllOf?: CustomMergeAllOf<S>,
): SelectedBranch<T, S, F> {
  let keyword: typeof ONE_OF_KEY | typeof ANY_OF_KEY;
  if (ONE_OF_KEY in schema) {
    keyword = ONE_OF_KEY;
  } else if (ANY_OF_KEY in schema) {
    keyword = ANY_OF_KEY;
  } else {
    return { schema, uiSchema };
  }
  const { [keyword]: options, ...remaining } = schema;
  if (!Array.isArray(options) || options.length === 0) {
    return { schema, uiSchema };
  }
  const index = getClosestMatchingOption<T, S, F>(
    validator,
    rootSchema,
    formData as T,
    options as S[],
    0,
    getDiscriminatorFieldFromSchema<S>(schema),
    customMergeAllOf,
  );
  return {
    schema: mergeSchemas(remaining as S, options[index] as S) as S,
    uiSchema: getOptionUiSchema<T, S, F>(uiSchema, keyword, index) ?? {},
  };
}

/** Determines whether `schema` (resolved, but with `anyOf`/`oneOf` left intact, matching what `SchemaField` itself
 * checks against) is configured as an Optional Data Control — the same check `shouldRenderOptionalField()` makes,
 * minus the `isRootSchema` guard, which the walk's callers never need since a root is never checked this way.
 */
function isOptionalDataControlType<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  globalUiOptions?: GlobalUISchemaOptions,
): boolean {
  let schemaType: ReturnType<typeof getSchemaType<S>> | string[];
  if (ANY_OF_KEY in schema && Array.isArray(schema[ANY_OF_KEY])) {
    schemaType = getSchemaTypesForXxxOf<S>(schema[ANY_OF_KEY] as S[]);
  } else if (ONE_OF_KEY in schema && Array.isArray(schema[ONE_OF_KEY])) {
    schemaType = getSchemaTypesForXxxOf<S>(schema[ONE_OF_KEY] as S[]);
  } else {
    schemaType = getSchemaType<S>(schema);
  }
  const { enableOptionalDataFieldForType = [] } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  return (
    !!schemaType && !Array.isArray(schemaType) && !!enableOptionalDataFieldForType.find((val) => val === schemaType)
  );
}

/** Resolves the uiSchema for the array item at `idx`, matching `ArrayField`'s own resolution. A fixed (tuple) schema's
 * row past its own positions is checked first, exactly as `ArrayField`'s fixed-items render checks
 * `index >= schemaItems.length` before anything else: that row always uses `uiSchema.additionalItems`, never the
 * function form of `uiSchema.items` (`ArrayField` never even resolves the dynamic/static form for it). Only a genuine
 * tuple position or a non-fixed array reaches `getItemUiSchemaForItem()`, which — unlike `getItemUiSchemaForIndex()`,
 * used for defaults, where an item's data isn't available yet — has `item` to pass to the function form.
 */
function resolveArrayItemUiSchema<T, S extends StrictRJSFSchema, F extends FormContextType>(
  retrieved: S,
  uiSchema: UiSchema<T, S, F>,
  item: unknown,
  idx: number,
  formContext: F | undefined,
  arrayFieldPath: FieldPath | undefined,
): UiSchema<T, S, F> | undefined {
  if (isFixedItems<S>(retrieved) && idx >= (retrieved.items as S[]).length) {
    return uiSchema.additionalItems as UiSchema<T, S, F> | undefined;
  }
  return getItemUiSchemaForItem<T, S, F>(uiSchema, item as never, idx, formContext, arrayFieldPath);
}

interface WalkContext<T, S extends StrictRJSFSchema, F extends FormContextType> {
  validator: ValidatorType<S, F>;
  rootSchema: S;
  uiSchemaDefinitions?: UiSchemaDefinitions<T, S, F>;
  customMergeAllOf?: CustomMergeAllOf<S>;
  globalUiOptions?: GlobalUISchemaOptions;
  formContext?: F;
  builder: ErrorSchemaBuilder<T>;
}

function walk<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: WalkContext<T, S, F>,
  schema: S,
  localUiSchema: UiSchema<T, S, F> | undefined,
  formData: unknown,
  path: (string | number)[],
  required: boolean,
  parentPresent: boolean,
) {
  const { validator, rootSchema, uiSchemaDefinitions, customMergeAllOf, globalUiOptions, formContext, builder } = ctx;
  // A repeated $ref is never expanded again for rendering either (see SchemaField/CyclicSchemaField) — without this,
  // a recursive $ref reached through `ui:definitions` (the only thing that disables the prune below) would have
  // `retrieveSchema()` re-resolve the same cycle forever.
  if ((schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]) {
    return;
  }
  const uiSchema = resolveUiSchema<T, S, F>(schema, localUiSchema, { rootSchema, uiSchemaDefinitions });
  const { required: fieldUiRequired } = getUiOptions<T, S, F>(uiSchema);
  if (path.length > 0 && fieldUiRequired === true && formData === undefined && !(required && parentPresent)) {
    // Worded exactly as AJV words its own `required` failures, so a ui:required error is indistinguishable from a
    // schema-required one in the error list and in any `ui:help`/ErrorList rendering built around that text. Skipped
    // only when AJV will raise this exact message itself: the field is in its parent's schema `required` list AND
    // that parent is actually present in formData — AJV never applies a subschema's `required` to a property that
    // isn't there, so `parentPresent` being false means the schema-required error would never fire either.
    builder.addErrors(`must have required property '${path[path.length - 1]}'`, path);
  }
  // Children can only carry ui:required through their own uiSchema entry or a ui:definitions fragment
  if (!uiSchemaDefinitions && Object.keys(uiSchema).length === 0) {
    return;
  }
  // resolveAnyOfOrOneOfRefs expands a oneOf/anyOf option that is itself a raw $ref, matching ObjectField's own
  // retrieveSchema() call for the same schema shape (see ObjectField.tsx) — otherwise resolveSelectedBranch() below
  // merges the unexpanded `{ $ref }` option and the branch's `properties` are never visited. Scoped to schemas that
  // actually carry a oneOf/anyOf, rather than passed unconditionally like ObjectField does: unlike ObjectField, this
  // walk starts a brand new, unmarked `retrieveSchema()` call at every node (no ancestor call has already flagged a
  // cyclic $ref for it), and resolveAnyOfOrOneOfRefs also disables that flagging for plain (non-xxxOf) object
  // properties, so passing it unconditionally would spin forever on an ordinary recursive $ref.
  const resolvedSchema = retrieveSchema<T, S, F>(
    validator,
    schema,
    rootSchema,
    formData as T,
    customMergeAllOf,
    ONE_OF_KEY in schema || ANY_OF_KEY in schema,
  );
  const effectiveRequired = fieldUiRequired !== undefined ? Boolean(fieldUiRequired) : required;
  // Plain object/array Optional Data Controls hide their real fields (rendering only the "Add" control) whenever
  // `!isFormDataAvailable(formData)` — also true for `null` and `{}`, not just `undefined` — matching ObjectField's
  // and ArrayField's own `hasFormData` gate exactly. `anyOf`/`oneOf`-typed nodes are different: MultiSchemaField
  // always renders the selected branch's own fields unconditionally (there's no `hasFormData` gate on
  // `optionsSchemaField`), so `{}` there isn't "hidden" the way it is for a plain object/array — only a genuinely
  // absent (`undefined`) value is.
  const isXxxOf = ONE_OF_KEY in schema || ANY_OF_KEY in schema;
  const optedOut = isXxxOf ? formData === undefined : !isFormDataAvailable(formData);
  if (
    path.length > 0 &&
    optedOut &&
    !effectiveRequired &&
    isOptionalDataControlType<T, S, F>(resolvedSchema, uiSchema, globalUiOptions)
  ) {
    // This node isn't rendered (or its own fields aren't) until the user opts in, so a `ui:required` field beneath it
    // isn't visible for the user to fill in or correct either.
    return;
  }
  const { schema: retrieved, uiSchema: branchUiSchema } = resolveSelectedBranch<T, S, F>(
    validator,
    rootSchema,
    resolvedSchema,
    uiSchema,
    formData,
    customMergeAllOf,
  );
  if (getSchemaType<S>(retrieved) === 'object') {
    // Matches computeDefaults()'s own `isObject(rawFormData)` handling: when the schema resolves to an object here
    // but `formData` still holds a primitive (e.g. a leftover string from a previous oneOf/anyOf branch, or mismatched
    // caller data), indexing the primitive directly (`'abc'['0']` yields `'a'`, not `undefined`) can make a genuinely
    // missing required child look present.
    const data = isObject(formData) ? formData : ({} as GenericObjectType);
    const childParentPresent = formData !== undefined;
    Object.entries(retrieved.properties ?? {}).forEach(([key, propertySchema]) => {
      if (typeof propertySchema === 'boolean') {
        return;
      }
      const childUiSchema = getByPath<UiSchema<T, S, F> | undefined>(
        branchUiSchema,
        (propertySchema as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] ? ADDITIONAL_PROPERTIES_KEY : key,
      );
      const childRequired = Boolean(retrieved.required?.includes(key));
      walk(ctx, propertySchema as S, childUiSchema, data[key], [...path, key], childRequired, childParentPresent);
    });
  } else if (Array.isArray(formData)) {
    // Only names the array in the error a throwing function-form `uiSchema.items` logs, so it isn't worth deriving for
    // the arrays that don't have one — this walks every field of the form on every validation pass
    const arrayFieldPath = typeof branchUiSchema.items === 'function' ? fieldPathFromList(path) : undefined;
    formData.forEach((item, idx) => {
      walk(
        ctx,
        getInnerSchemaForArrayItem<S>(
          retrieved,
          AdditionalItemsHandling.Fallback,
          Array.isArray(retrieved.items) ? idx : -1,
        ),
        resolveArrayItemUiSchema<T, S, F>(retrieved, branchUiSchema, item, idx, formContext, arrayFieldPath),
        item,
        [...path, idx],
        false,
        true,
      );
    });
  }
}

/** Whether `node` (a uiSchema fragment, or a `ui:definitions` entry) declares `ui:required`/`ui:options.required`
 * anywhere within it. Once a `ui:definitions` fragment is present anywhere, the walk's per-node prune (no local
 * uiSchema, no active definitions) can no longer rule a subtree out — every node's schema gets resolved via
 * `retrieveSchema()` just in case a definition attaches a `ui:required` further down. Scanning the (comparatively
 * tiny) uiSchema/definitions tree once up front, instead of the full data-shaped schema on every validation pass, is
 * what makes the "definitions exist, but no `ui:required` anywhere" case cheap again.
 *
 * The function form of `uiSchema.items` can't be inspected statically — it may return a fragment containing
 * `ui:required` for some item — so it's treated as though it might, rather than silently skipping the walk.
 */
function hasUiRequiredOption<T, S extends StrictRJSFSchema, F extends FormContextType>(node: unknown): boolean {
  if (typeof node === 'function') {
    return true;
  }
  if (!isObject(node)) {
    return false;
  }
  if (getUiOptions<T, S, F>(node as UiSchema<T, S, F>).required !== undefined) {
    return true;
  }
  return Object.entries(node).some(([key, value]) => {
    if (key.startsWith('ui:')) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.some((entry) => hasUiRequiredOption<T, S, F>(entry));
    }
    return hasUiRequiredOption<T, S, F>(value);
  });
}

/** Sentinel used as the inner cache key in `mightHaveUiRequiredCache` for an `undefined` `uiSchemaDefinitions`, since
 * a `WeakMap` key must be an object.
 */
const NO_DEFINITIONS = {};

/** Caches the result of scanning a given `uiSchema`/`uiSchemaDefinitions` pair for `ui:required`, keyed by object
 * identity. `getUiRequiredErrorSchema()` runs on every `validate()` call — every keystroke under
 * `liveValidate: 'onChange'` — but `uiSchema` (and the `uiSchemaDefinitions` derived from it) stay the same object
 * across those calls far more often than not, so re-walking the whole tree each time to answer a question whose
 * answer can't have changed is wasted work.
 */
const mightHaveUiRequiredCache = new WeakMap<object, WeakMap<object, boolean>>();

/** Returns whether `uiSchema`/`uiSchemaDefinitions` might declare `ui:required` anywhere, memoized by the object
 * identity of both so repeated calls with the same, unchanged `uiSchema` (the common case across live-validation
 * passes) skip the scan entirely. Falls back to scanning uncached when `uiSchema` isn't an object, since there's no
 * key to cache against and the scan is already O(1) in that case.
 */
function computeMightHaveUiRequired<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F> | undefined,
  uiSchemaDefinitions: UiSchemaDefinitions<T, S, F> | undefined,
): boolean {
  const scan = () =>
    hasUiRequiredOption<T, S, F>(uiSchema) ||
    (uiSchemaDefinitions !== undefined &&
      Object.values(uiSchemaDefinitions).some((fragment) => hasUiRequiredOption<T, S, F>(fragment)));
  if (!isObject(uiSchema)) {
    return scan();
  }
  let byDefinitions = mightHaveUiRequiredCache.get(uiSchema);
  if (!byDefinitions) {
    byDefinitions = new WeakMap();
    mightHaveUiRequiredCache.set(uiSchema, byDefinitions);
  }
  const definitionsKey: object = (uiSchemaDefinitions as object | undefined) ?? NO_DEFINITIONS;
  let cached = byDefinitions.get(definitionsKey);
  if (cached === undefined) {
    cached = scan();
    byDefinitions.set(definitionsKey, cached);
  }
  return cached;
}

/** Walks the `schema` (resolved node by node against `formData`, exactly as `SchemaField` does while rendering) and
 * the `uiSchema` (resolved through `ui:definitions` the same way), returning an `ErrorSchema` holding a required
 * error for every field marked `ui:required: true` whose value is missing. The schema handed to the validator is left
 * untouched, so this works identically on the submit and live-validation paths and with precompiled validators.
 */
export default function getUiRequiredErrorSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  validator: ValidatorType<S, F>,
  rootSchema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  formData: T | undefined,
  customMergeAllOf?: CustomMergeAllOf<S>,
  uiSchemaDefinitions: UiSchemaDefinitions<T, S, F> | undefined = uiSchema?.[UI_DEFINITIONS_KEY],
  globalUiOptions?: GlobalUISchemaOptions,
  formContext?: F,
): ErrorSchema<T> {
  const builder = new ErrorSchemaBuilder<T>();
  const hasDefinitions = uiSchemaDefinitions && Object.keys(uiSchemaDefinitions).length > 0;
  const mightHaveUiRequired = computeMightHaveUiRequired<T, S, F>(uiSchema, uiSchemaDefinitions);
  if (!mightHaveUiRequired) {
    return builder.ErrorSchema;
  }
  walk<T, S, F>(
    {
      validator,
      rootSchema,
      uiSchemaDefinitions: hasDefinitions ? uiSchemaDefinitions : undefined,
      customMergeAllOf,
      globalUiOptions,
      formContext,
      builder,
    },
    rootSchema,
    uiSchema,
    formData,
    [],
    true,
    true,
  );
  return builder.ErrorSchema;
}
