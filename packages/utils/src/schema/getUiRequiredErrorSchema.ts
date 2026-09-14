import { ADDITIONAL_PROPERTY_FLAG, ANY_OF_KEY, ONE_OF_KEY, UI_DEFINITIONS_KEY } from '../constants.ts';
import ErrorSchemaBuilder from '../ErrorSchemaBuilder.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getSchemaType from '../getSchemaType.ts';
import getUiOptions from '../getUiOptions.ts';
import mergeSchemas from '../mergeSchemas.ts';
import resolveUiSchema from '../resolveUiSchema.ts';
import type {
  CustomMergeAllOf,
  ErrorSchema,
  FormContextType,
  GenericObjectType,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  UiSchemaDefinitions,
  ValidatorType,
} from '../types.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import { AdditionalItemsHandling, getInnerSchemaForArrayItem, getItemUiSchemaForIndex } from './getDefaultFormState.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Resolves the `anyOf`/`oneOf` branch that currently applies to `formData`, the same way `computeDefaults()` and
 * `MultiSchemaField` pick the option they render, so the walk descends into the branch the user actually sees.
 */
function resolveSelectedBranch<T, S extends StrictRJSFSchema, F extends FormContextType>(
  validator: ValidatorType<T, S, F>,
  rootSchema: S,
  schema: S,
  formData: unknown,
  customMergeAllOf?: CustomMergeAllOf<S>,
): S {
  let keyword: typeof ONE_OF_KEY | typeof ANY_OF_KEY;
  if (ONE_OF_KEY in schema) {
    keyword = ONE_OF_KEY;
  } else if (ANY_OF_KEY in schema) {
    keyword = ANY_OF_KEY;
  } else {
    return schema;
  }
  const { [keyword]: options, ...remaining } = schema;
  if (!Array.isArray(options) || options.length === 0) {
    return schema;
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
  return mergeSchemas(remaining as S, options[index] as S) as S;
}

interface WalkContext<T, S extends StrictRJSFSchema, F extends FormContextType> {
  validator: ValidatorType<T, S, F>;
  rootSchema: S;
  uiSchemaDefinitions?: UiSchemaDefinitions<T, S, F>;
  customMergeAllOf?: CustomMergeAllOf<S>;
  builder: ErrorSchemaBuilder<T>;
}

function walk<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: WalkContext<T, S, F>,
  schema: S,
  localUiSchema: UiSchema<T, S, F> | undefined,
  formData: unknown,
  path: (string | number)[],
) {
  const { validator, rootSchema, uiSchemaDefinitions, customMergeAllOf, builder } = ctx;
  const uiSchema = resolveUiSchema<T, S, F>(schema, localUiSchema, { rootSchema, uiSchemaDefinitions });
  if (path.length > 0 && getUiOptions<T, S, F>(uiSchema).required === true && formData === undefined) {
    // Worded exactly as AJV words its own `required` failures, so a ui:required error is indistinguishable from a
    // schema-required one in the error list and in any `ui:help`/ErrorList rendering built around that text.
    builder.addErrors(`must have required property '${path[path.length - 1]}'`, path);
  }
  // Children can only carry ui:required through their own uiSchema entry or a ui:definitions fragment
  if (!uiSchemaDefinitions && Object.keys(uiSchema).length === 0) {
    return;
  }
  const retrieved = resolveSelectedBranch<T, S, F>(
    validator,
    rootSchema,
    retrieveSchema<T, S, F>(validator, schema, rootSchema, formData as T, customMergeAllOf),
    formData,
    customMergeAllOf,
  );
  if (getSchemaType<S>(retrieved) === 'object') {
    const data = (formData ?? {}) as GenericObjectType;
    Object.entries(retrieved.properties ?? {}).forEach(([key, propertySchema]) => {
      if (typeof propertySchema === 'boolean') {
        return;
      }
      const childUiSchema = (propertySchema as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG]
        ? uiSchema.additionalProperties
        : uiSchema[key];
      walk(ctx, propertySchema as S, childUiSchema as UiSchema<T, S, F> | undefined, data[key], [...path, key]);
    });
  } else if (Array.isArray(formData)) {
    formData.forEach((item, idx) => {
      walk(
        ctx,
        getInnerSchemaForArrayItem<S>(
          retrieved,
          AdditionalItemsHandling.Fallback,
          Array.isArray(retrieved.items) ? idx : -1,
        ),
        getItemUiSchemaForIndex<T, S, F>(retrieved, uiSchema, idx),
        item,
        [...path, idx],
      );
    });
  }
}

/** Walks the `schema` (resolved node by node against `formData`, exactly as `SchemaField` does while rendering) and
 * the `uiSchema` (resolved through `ui:definitions` the same way), returning an `ErrorSchema` holding a required
 * error for every field marked `ui:required: true` whose value is missing. The schema handed to the validator is left
 * untouched, so this works identically on the submit and live-validation paths and with precompiled validators.
 */
export default function getUiRequiredErrorSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  rootSchema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  formData: T | undefined,
  customMergeAllOf?: CustomMergeAllOf<S>,
  uiSchemaDefinitions: UiSchemaDefinitions<T, S, F> | undefined = uiSchema?.[UI_DEFINITIONS_KEY],
): ErrorSchema<T> {
  const builder = new ErrorSchemaBuilder<T>();
  const hasDefinitions = uiSchemaDefinitions && Object.keys(uiSchemaDefinitions).length > 0;
  walk<T, S, F>(
    {
      validator,
      rootSchema,
      uiSchemaDefinitions: hasDefinitions ? uiSchemaDefinitions : undefined,
      customMergeAllOf,
      builder,
    },
    rootSchema,
    uiSchema,
    formData,
    [],
  );
  return builder.ErrorSchema;
}
