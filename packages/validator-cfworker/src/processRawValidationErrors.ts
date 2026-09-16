import type {
  CustomValidator,
  ErrorTransformer,
  FormContextType,
  RJSFSchema,
  RJSFValidationError,
  StrictRJSFSchema,
  UiSchema,
  ValidatorType,
} from '@rjsf/utils';
import {
  ANY_OF_KEY,
  createErrorHandler,
  getByPath,
  getDefaultFormState,
  getUiOptions,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  toErrorSchema,
  toPath,
  unwrapErrorHandler,
  validationDataMerge,
} from '@rjsf/utils';

import type { CFWorkerValidationError, SuppressDuplicateFilteringType } from './types.ts';

/** The raw validation results produced by the underlying engine, before conversion into RJSF's error formats. */
export interface RawValidationErrorsType<Result = any> {
  /** The raw errors returned by the engine's validation run, when any. */
  errors?: Result[];

  /** The error thrown when the engine could not run validation, such as on an invalid schema. */
  validationError?: Error;
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
  return instanceLocation.replace(/^#?/, '').replace(/\//g, '.');
}

/** Extracts the missing property name from a cfworker `required` error.
 *
 * @param error - The cfworker validation error to inspect
 * @returns - The missing property name when the error describes one
 */
function extractMissingProperty(error: CFWorkerValidationError): string | undefined {
  if (error.keyword !== 'required') {
    return undefined;
  }
  return error.error.match(/required property ["']([^"']+)["']/)?.[1];
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
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
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
    const missingProperty = extractMissingProperty(error);

    if (missingProperty) {
      const path = property ? `${property}.${missingProperty}` : missingProperty;
      const { title: directTitle } = getUiOptions(getByPath<UiSchema<T, S, F> | undefined>(uiSchema, toPath(path)));
      let title = directTitle;
      if (title === undefined) {
        const uiSchemaPath = keywordLocation
          .replace(/\/properties\//g, '/')
          .split('/')
          .slice(1, -1)
          .concat([missingProperty]);
        title = getUiOptions(getByPath<UiSchema<T, S, F> | undefined>(uiSchema, uiSchemaPath)).title;
      }
      if (title === undefined && schema) {
        const propertyParts = property.replace(/^\./, '').split('.').filter(Boolean);
        const schemaPath: (string | number)[] = [];
        for (const part of propertyParts) {
          schemaPath.push(PROPERTIES_KEY, part);
        }
        schemaPath.push(PROPERTIES_KEY, missingProperty, 'title');
        title = getByPath<string | undefined>(schema, schemaPath);
      }
      if (title) {
        message = message.replace(`"${missingProperty}"`, `'${title}'`);
        uiTitle = title;
      }
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
      const title = uiSchemaTitle ?? schemaTitle;
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
 * @param validator - The validator used to derive default form state for custom validation
 * @param rawErrors - The raw cfworker errors and any engine exception
 * @param formData - The form data being validated
 * @param schema - The schema against which the form data is validated
 * @param [customValidate] - A function that adds application-specific validation errors
 * @param [transformErrors] - A function that transforms errors before custom validation
 * @param [uiSchema] - The uiSchema passed to error transformation and custom validation
 * @param [suppressDuplicateFiltering] - Controls which duplicate filtering is suppressed
 * @returns - The processed validation errors and error schema
 */
export default function processRawValidationErrors<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  rawErrors: RawValidationErrorsType<CFWorkerValidationError>,
  formData: T | undefined,
  schema: S,
  customValidate?: CustomValidator<T, S, F>,
  transformErrors?: ErrorTransformer<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
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

  const newFormData = getDefaultFormState<T, S, F>(validator, schema, formData, schema, true) as T;
  const errorHandler = customValidate(newFormData, createErrorHandler<T>(newFormData), uiSchema, errorSchema);
  const userErrorSchema = unwrapErrorHandler<T>(errorHandler);
  return validationDataMerge<T>({ errors, errorSchema }, userErrorSchema);
}
