import type {
  CustomValidator,
  ErrorTransformer,
  FormContextType,
  RawValidationResult,
  RJSFSchema,
  RJSFValidationError,
  SchemaContext,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  ALL_OF_KEY,
  ANY_OF_KEY,
  applyValidatorErrorTitles,
  createErrorHandler,
  ELSE_KEY,
  getByPath,
  getDefaultFormState,
  getKeywordParentSchema,
  getUiOptions,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  THEN_KEY,
  toErrorSchema,
  toPath,
  unwrapErrorHandler,
  validationDataMerge,
} from '@rjsf/utils';

import type { CFWorkerValidationError, SuppressDuplicateFilteringType } from './types.ts';

/** Returns the key a token of a pointer the engine reports names. The engine writes each key as a JSON Pointer token in
 * a URI fragment (`a/b` as `a~1b`, `a#b` as `a%23b`), where the form keys its data and uiSchema plainly
 *
 * @param token - The token of the instance or keyword location
 * @returns - The key it names
 */
function decodePointerToken(token: string): string {
  return decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~');
}

const BRANCH_LIST_KEYS = new Set([ALL_OF_KEY, ANY_OF_KEY, ONE_OF_KEY]);
const BRANCH_MAP_KEYS = new Set(['dependentSchemas', 'dependencies']);
const NAME_MAP_KEYS = new Set([PROPERTIES_KEY, PATTERN_PROPERTIES_KEY]);

/** Returns a keyword location with the branches it ends in removed, so that it names the keyword on the schema holding
 * them: a branch's own title names that branch, not the field it applies to. A branch is an `allOf`/`anyOf`/`oneOf`
 * entry, a `then`/`else` or a `dependentSchemas`/`dependencies` schema, each with the `$ref`s after it. The path is
 * walked from the root so that a property or dependency named like a keyword is read as the name it is
 *
 * @param keywordLocation - The keyword location emitted by `@cfworker/json-schema`
 * @returns - The location of the keyword on the schema holding the branches, or `keywordLocation` when it ends in none
 */
function branchHolderLocation(keywordLocation: string): string {
  const segments = keywordLocation.split('/');
  const last = segments.length - 1;
  let branchStart: number | undefined;
  for (let index = 1; index < last; index++) {
    const segment = segments[index];
    const isBranch =
      BRANCH_LIST_KEYS.has(segment) || BRANCH_MAP_KEYS.has(segment) || segment === THEN_KEY || segment === ELSE_KEY;
    branchStart = isBranch || (segment === REF_KEY && branchStart !== undefined) ? (branchStart ?? index) : undefined;
    // The next segment is an index or a name, never a keyword
    if (BRANCH_LIST_KEYS.has(segment) || BRANCH_MAP_KEYS.has(segment) || NAME_MAP_KEYS.has(segment)) {
      index += 1;
    }
  }
  return branchStart === undefined ? keywordLocation : [...segments.slice(0, branchStart), segments[last]].join('/');
}

/** Converts a cfworker instance location into RJSF's dot-separated property path.
 *
 * @param instanceLocation - The instance location emitted by `@cfworker/json-schema`
 * @returns - The corresponding RJSF property path
 */
function instanceLocationToProperty(instanceLocation: string): string {
  if (!instanceLocation || instanceLocation === '#') {
    return '';
  }
  return instanceLocation.replace(/^#?/, '').split('/').map(decodePointerToken).join('.');
}

/** Extracts the property names a cfworker `required`, `dependentRequired` or `dependencies` error names.
 *
 * @param error - The cfworker validation error to inspect
 * @returns - The missing property name when the error describes one, and for a dependency the property that is present
 */
function extractPropertyNames(error: CFWorkerValidationError): [missingProperty?: string, presentProperty?: string] {
  if (error.keyword === 'required') {
    return [error.error.match(/^Instance does not have required property "(.+)"\.$/s)?.[1]];
  }
  if (error.keyword === 'dependentRequired' || error.keyword === 'dependencies') {
    const [, presentProperty, missingProperty] =
      error.error.match(/^Instance has "(.+)" but does not have "(.+)"\.$/s) ?? [];
    return [missingProperty, presentProperty];
  }
  return [];
}

/** Filters duplicate errors from `anyOf`/`oneOf` schema paths according to the `suppressDuplicateFiltering` flag.
 *
 * @param errorList - The list of RJSF validation errors to filter
 * @param [suppressDuplicateFiltering='none'] - Controls which duplicate filtering is suppressed
 * @returns - The filtered list of validation errors
 */
export function filterDuplicateErrors(
  errorList: RJSFValidationError[],
  suppressDuplicateFiltering: SuppressDuplicateFilteringType = 'none',
): RJSFValidationError[] {
  if (suppressDuplicateFiltering === 'all') {
    return errorList;
  }
  return errorList.reduce<RJSFValidationError[]>((acc, error) => {
    const { message, schemaPath } = error;
    const anyOfIndex = suppressDuplicateFiltering !== 'anyOf' ? schemaPath?.indexOf(`/${ANY_OF_KEY}/`) : undefined;
    const oneOfIndex = suppressDuplicateFiltering !== 'oneOf' ? schemaPath?.indexOf(`/${ONE_OF_KEY}/`) : undefined;
    let schemaPrefix: string | undefined;
    if (anyOfIndex && anyOfIndex >= 0) {
      schemaPrefix = schemaPath?.substring(0, anyOfIndex);
    } else if (oneOfIndex && oneOfIndex >= 0) {
      schemaPrefix = schemaPath?.substring(0, oneOfIndex);
    }
    const duplicate = schemaPrefix
      ? acc.find((candidate) => candidate.message === message && candidate.schemaPath?.startsWith(schemaPrefix))
      : undefined;
    if (!duplicate) {
      acc.push(error);
    }
    return acc;
  }, []);
}

/** Converts `@cfworker/json-schema` output units into RJSF validation errors.
 *
 * @param errors - The cfworker errors to convert
 * @param [uiSchema] - The uiSchema used to resolve field titles
 * @param [suppressDuplicateFiltering] - Controls which duplicate filtering is suppressed
 * @param [schema] - The schema used to resolve field titles
 * @returns - The converted RJSF validation errors
 */
export function transformRJSFValidationErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  errors: CFWorkerValidationError[] = [],
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
  schema?: S,
): RJSFValidationError[] {
  const errorList = errors.map((error) => {
    const { instanceLocation, keyword, keywordLocation } = error;
    let { error: message } = error;
    message ||= `Validation failed for keyword "${keyword}"`;
    let property = instanceLocationToProperty(instanceLocation);
    let stack = `${property} ${message}`.trim();
    let uiTitle = '';
    const [missingProperty, presentProperty] = extractPropertyNames(error);
    // cfworker reports a `false` schema at the location of the instance it rejects, which names no schema
    const parentSchema =
      schema && keyword !== 'false'
        ? getKeywordParentSchema<S>(schema, keywordLocation, decodePointerToken)
        : undefined;

    if (missingProperty) {
      const applied = applyValidatorErrorTitles<T, S, F>({
        message,
        names: presentProperty ? [missingProperty, presentProperty] : [missingProperty],
        quote: '"',
        property,
        schemaPath: keywordLocation,
        decodeSchemaPathKey: decodePointerToken,
        uiSchema,
        parentSchema,
        schema,
      });
      message = applied.message;
      uiTitle = applied.titles.get(missingProperty) ?? '';
      property = property ? `${property}.${missingProperty}` : missingProperty;
      stack = message;
    } else {
      const propertyPath = property.replace(/^\./, '');
      const uiSchemaTitle = getUiOptions<T, S, F>(
        getByPath<UiSchema<T, S, F> | undefined>(uiSchema, toPath(propertyPath)),
      ).title;
      const schemaTitle = schema
        ? getByPath<string | undefined>(
            schema,
            propertyPath
              .split('.')
              .filter(Boolean)
              .flatMap((part) => [PROPERTIES_KEY, part])
              .concat(['title']),
          )
        : undefined;
      // A `false` schema's location is its instance's, whose keys name no branch
      const fieldLocation = keyword === 'false' ? keywordLocation : branchHolderLocation(keywordLocation);
      const parentTitle = (
        schema && fieldLocation !== keywordLocation
          ? getKeywordParentSchema<S>(schema, fieldLocation, decodePointerToken)
          : parentSchema
      )?.title;
      const title = uiSchemaTitle ?? (schemaTitle || (typeof parentTitle === 'string' ? parentTitle : undefined));
      if (title) {
        stack = `'${title}' ${message}`.trim();
        uiTitle = title;
      }
    }

    return {
      name: keyword,
      property,
      message,
      params: missingProperty ? { missingProperty } : {},
      stack,
      schemaPath: keywordLocation,
      title: uiTitle,
    };
  });
  return filterDuplicateErrors(errorList, suppressDuplicateFiltering);
}

/** Processes raw validation errors and applies optional error transforms and custom validation.
 *
 * @param context - The `SchemaContext` of the form, used when computing the defaults handed to `customValidate`
 * @param rawErrors - The raw cfworker errors and any engine exception
 * @param formData - The form data being validated
 * @param schema - The schema against which the form data is validated
 * @param [customValidate] - A function that adds application-specific validation errors
 * @param [transformErrors] - A function that transforms errors before custom validation
 * @param [uiSchema] - The uiSchema passed to error transformation and custom validation
 * @param [suppressDuplicateFiltering] - Controls which duplicate filtering is suppressed
 * @param [getCustomValidateFormData] - Returns the `formData` to hand `customValidate`, with the form's defaults
 *        already applied. `Form` supplies it so those defaults honor its `customMergeAllOf` and
 *        `defaultFormStateBehavior`; without it they are computed here with the default `allOf` merge
 * @returns - The processed validation errors and error schema
 */
export default function processRawValidationErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rawErrors: RawValidationResult<CFWorkerValidationError>,
  formData: T | undefined,
  schema: S,
  customValidate?: CustomValidator<T, S, F>,
  transformErrors?: ErrorTransformer<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
  getCustomValidateFormData?: () => T,
) {
  const { validationError } = rawErrors;
  let errors = transformRJSFValidationErrors<T, S, F>(rawErrors.errors, uiSchema, suppressDuplicateFiltering, schema);
  if (validationError) {
    errors = [...errors, { stack: validationError.message }];
  }
  if (typeof transformErrors === 'function') {
    errors = transformErrors(errors, uiSchema);
  }

  let errorSchema = toErrorSchema<T>(errors);
  if (validationError) {
    errorSchema = { ...errorSchema, $schema: { __errors: [validationError.message] } };
  }
  if (typeof customValidate !== 'function') {
    return { errors, errorSchema };
  }

  // `uiSchema` is threaded through so `ui:initialValue`/`ui:emptyValue` defaults match what the form itself computed
  // and rendered.
  // Called rather than read, so defaults that come out `undefined` are not mistaken for "not supplied"
  const newFormData = getCustomValidateFormData
    ? getCustomValidateFormData()
    : (getDefaultFormState<T, S, F>(context, {
        schema,
        formData,
        rootSchema: schema,
        includeUndefinedValues: true,
        uiSchema,
      }) as T);
  const errorHandler = customValidate(newFormData, createErrorHandler<T>(newFormData), uiSchema, errorSchema);
  const userErrorSchema = unwrapErrorHandler<T>(errorHandler);
  return validationDataMerge<T>({ errors, errorSchema }, userErrorSchema);
}
