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
  getDefaultFormState,
  getUiOptions,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  toErrorSchema,
  unwrapErrorHandler,
  validationDataMerge,
} from '@rjsf/utils';
import get from 'lodash/get';

import type { CFWorkerValidationError, SuppressDuplicateFilteringType } from './types';

export interface RawValidationErrorsType<Result = any> {
  errors?: Result[];
  validationError?: Error;
}

function instanceLocationToProperty(instanceLocation: string): string {
  if (!instanceLocation || instanceLocation === '#') {
    return '';
  }
  return instanceLocation.replace(/^#?/, '').replace(/\//g, '.');
}

function extractMissingProperty(error: CFWorkerValidationError): string | undefined {
  if (error.keyword !== 'required') {
    return undefined;
  }
  return error.error.match(/required property ["']([^"']+)["']/)?.[1];
}

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

/** Converts `@cfworker/json-schema` output units into RJSF validation errors. */
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
      const { title: directTitle } = getUiOptions(get(uiSchema, path.replace(/^\./, '')));
      let title = directTitle;
      if (title === undefined) {
        const uiSchemaPath = keywordLocation
          .replace(/\/properties\//g, '/')
          .split('/')
          .slice(1, -1)
          .concat([missingProperty]);
        title = getUiOptions(get(uiSchema, uiSchemaPath)).title;
      }
      if (title === undefined && schema) {
        const propertyParts = property.replace(/^\./, '').split('.').filter(Boolean);
        const schemaPath: (string | number)[] = [];
        for (const part of propertyParts) {
          schemaPath.push(PROPERTIES_KEY, part);
        }
        schemaPath.push(PROPERTIES_KEY, missingProperty, 'title');
        title = get(schema, schemaPath) as string | undefined;
      }
      if (title) {
        message = message.replace(`"${missingProperty}"`, `'${title}'`);
        uiTitle = title;
      }
      property = property ? `${property}.${missingProperty}` : `.${missingProperty}`;
      stack = message;
    } else {
      const propertyPath = property.replace(/^\./, '');
      const uiSchemaTitle = getUiOptions<T, S, F>(get(uiSchema, propertyPath)).title;
      const schemaTitle = schema
        ? (get(
            schema,
            propertyPath
              .split('.')
              .filter(Boolean)
              .flatMap((part) => [PROPERTIES_KEY, part])
              .concat(['title']),
          ) as string | undefined)
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
