import { ErrorObject } from 'ajv';
import get from 'lodash/get';
import {
  ANY_OF_KEY,
  createErrorHandler,
  CustomValidator,
  ErrorTransformer,
  FormContextType,
  getDefaultFormState,
  getUiOptions,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  RJSFSchema,
  RJSFValidationError,
  StrictRJSFSchema,
  toErrorSchema,
  UiSchema,
  unwrapErrorHandler,
  validationDataMerge,
  ValidatorType,
} from '@rjsf/utils';

import { SuppressDuplicateFilteringType } from './types';

export type RawValidationErrorsType<Result = any> = {
  errors?: Result[];
  validationError?: Error;
};

/** Filters duplicate errors from `anyOf`/`oneOf` schema paths according to the `suppressDuplicateFiltering` flag.
 *
 * @param errorList - The list of `RJSFValidationError`s to filter
 * @param [suppressDuplicateFiltering='none'] - Controls which duplicate filtering is suppressed:
 *   - `'none'` (default): filters duplicates for both `anyOf` and `oneOf`
 *   - `'all'`: returns `errorList` unmodified
 *   - `'anyOf'`: suppresses filtering for `anyOf` errors; `oneOf` duplicates are still filtered
 *   - `'oneOf'`: suppresses filtering for `oneOf` errors; `anyOf` duplicates are still filtered
 */
export function filterDuplicateErrors(
  errorList: RJSFValidationError[],
  suppressDuplicateFiltering: SuppressDuplicateFilteringType = 'none',
): RJSFValidationError[] {
  if (suppressDuplicateFiltering === 'all') {
    return errorList;
  }
  return errorList.reduce((acc: RJSFValidationError[], err: RJSFValidationError) => {
    const { message, schemaPath } = err;
    // Compute the index only when filtering for that keyword is not suppressed.
    // 'all' is already handled above; within the reduce, only 'none', 'anyOf', and 'oneOf' are possible.
    const anyOfIndex = suppressDuplicateFiltering !== 'anyOf' ? schemaPath?.indexOf(`/${ANY_OF_KEY}/`) : undefined;
    const oneOfIndex = suppressDuplicateFiltering !== 'oneOf' ? schemaPath?.indexOf(`/${ONE_OF_KEY}/`) : undefined;
    let schemaPrefix: string | undefined;
    if (anyOfIndex && anyOfIndex >= 0) {
      schemaPrefix = schemaPath?.substring(0, anyOfIndex);
    } else if (oneOfIndex && oneOfIndex >= 0) {
      schemaPrefix = schemaPath?.substring(0, oneOfIndex);
    }
    // If there is a schemaPrefix, then search for a duplicate message with the same prefix, otherwise undefined
    const dup = schemaPrefix
      ? acc.find((e: RJSFValidationError) => e.message === message && e.schemaPath?.startsWith(schemaPrefix))
      : undefined;
    if (!dup) {
      acc.push(err);
    }
    return acc;
  }, [] as RJSFValidationError[]);
}

/** Transforming the error output from ajv to format used by @rjsf/utils.
 * At some point, components should be updated to support ajv.
 *
 * @param errors - The list of AJV errors to convert to `RJSFValidationErrors`
 * @param [uiSchema] - An optional uiSchema that is passed to `transformErrors` and `customValidate`
 * @param [suppressDuplicateFiltering] - Controls which duplicate filtering is suppressed; see `filterDuplicateErrors`
 */
export function transformRJSFValidationErrors<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  errors: ErrorObject[] = [],
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
): RJSFValidationError[] {
  const errorList = errors.map((e: ErrorObject) => {
    const { instancePath, keyword, params, schemaPath, parentSchema, ...rest } = e;
    let { message = '' } = rest;
    let property = instancePath.replace(/\//g, '.');
    let stack = `${property} ${message}`.trim();
    let uiTitle = '';
    const rawPropertyNames: string[] = [
      ...(params.deps?.split(', ') || []),
      params.missingProperty,
      params.property,
    ].filter((item) => item);

    if (rawPropertyNames.length > 0) {
      rawPropertyNames.forEach((currentProperty) => {
        const path = property ? `${property}.${currentProperty}` : currentProperty;
        let uiSchemaTitle = getUiOptions(get(uiSchema, `${path.replace(/^\./, '')}`)).title;
        if (uiSchemaTitle === undefined) {
          // To retrieve a title from UI schema, construct a path to UI schema from `schemaPath` and `currentProperty`.
          // For example, when `#/properties/A/properties/B/required` and `C` are given, they are converted into `['A', 'B', 'C']`.
          const uiSchemaPath = schemaPath
            .replace(/\/properties\//g, '/')
            .split('/')
            .slice(1, -1)
            .concat([currentProperty]);
          uiSchemaTitle = getUiOptions(get(uiSchema, uiSchemaPath)).title;
        }
        if (uiSchemaTitle) {
          message = message.replace(`'${currentProperty}'`, `'${uiSchemaTitle}'`);
          uiTitle = uiSchemaTitle;
        } else {
          const parentSchemaTitle = get(parentSchema, [PROPERTIES_KEY, currentProperty, 'title']);
          if (parentSchemaTitle) {
            message = message.replace(`'${currentProperty}'`, `'${parentSchemaTitle}'`);
            uiTitle = parentSchemaTitle;
          }
        }
      });

      stack = message;
    } else {
      const uiSchemaTitle = getUiOptions<T, S, F>(get(uiSchema, `${property.replace(/^\./, '')}`)).title;

      if (uiSchemaTitle) {
        stack = `'${uiSchemaTitle}' ${message}`.trim();
        uiTitle = uiSchemaTitle;
      } else {
        const parentSchemaTitle = parentSchema?.title;

        if (parentSchemaTitle) {
          stack = `'${parentSchemaTitle}' ${message}`.trim();
          uiTitle = parentSchemaTitle;
        }
      }
    }

    // If params.missingProperty is undefined, it is removed from rawPropertyNames by filter((item) => item).
    if ('missingProperty' in params) {
      property = property ? `${property}.${params.missingProperty}` : params.missingProperty;
    }

    // put data in expected format
    return {
      name: keyword,
      property,
      message,
      params, // specific to ajv
      stack,
      schemaPath,
      title: uiTitle,
    };
  });
  return filterDuplicateErrors(errorList, suppressDuplicateFiltering);
}

/** This function processes the `formData` with an optional user contributed `customValidate` function, which receives
 * the form data and a `errorHandler` function that will be used to add custom validation errors for each field. Also
 * supports a `transformErrors` function that will take the raw AJV validation errors, prior to custom validation and
 * transform them in what ever way it chooses.
 *
 * @param validator - The `ValidatorType` implementation used for the `getDefaultFormState()` call
 * @param rawErrors - The list of raw `ErrorObject`s to process
 * @param formData - The form data to validate
 * @param schema - The schema against which to validate the form data
 * @param [customValidate] - An optional function that is used to perform custom validation
 * @param [transformErrors] - An optional function that is used to transform errors after AJV validation
 * @param [uiSchema] - An optional uiSchema that is passed to `transformErrors` and `customValidate`
 * @param [suppressDuplicateFiltering] - Controls which duplicate filtering is suppressed; see `filterDuplicateErrors`
 */
export default function processRawValidationErrors<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  rawErrors: RawValidationErrorsType<ErrorObject>,
  formData: T | undefined,
  schema: S,
  customValidate?: CustomValidator<T, S, F>,
  transformErrors?: ErrorTransformer<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
) {
  const { validationError: invalidSchemaError } = rawErrors;
  let errors = transformRJSFValidationErrors<T, S, F>(rawErrors.errors, uiSchema, suppressDuplicateFiltering);

  if (invalidSchemaError) {
    errors = [...errors, { stack: invalidSchemaError!.message }];
  }
  if (typeof transformErrors === 'function') {
    errors = transformErrors(errors, uiSchema);
  }

  let errorSchema = toErrorSchema<T>(errors);

  if (invalidSchemaError) {
    errorSchema = {
      ...errorSchema,
      $schema: {
        __errors: [invalidSchemaError!.message],
      },
    };
  }

  if (typeof customValidate !== 'function') {
    return { errors, errorSchema };
  }

  // Include form data with undefined values, which is required for custom validation.
  const newFormData = getDefaultFormState<T, S, F>(validator, schema, formData, schema, true) as T;

  const errorHandler = customValidate(newFormData, createErrorHandler<T>(newFormData), uiSchema, errorSchema);
  const userErrorSchema = unwrapErrorHandler<T>(errorHandler);
  return validationDataMerge<T>({ errors, errorSchema }, userErrorSchema);
}
