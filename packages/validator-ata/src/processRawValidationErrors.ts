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
import type { ValidationError } from 'ata-validator';
import get from 'lodash/get';

import type { SuppressDuplicateFilteringType } from './types';

export interface RawValidationErrorsType<Result = any> {
  errors?: Result[];
  validationError?: Error;
}

/** Filters duplicate errors from `anyOf`/`oneOf` schema paths according to
 * the `suppressDuplicateFiltering` flag. Mirrors the `@rjsf/validator-ajv8`
 * implementation: under any non-`'all'` setting, duplicate messages that
 * share a common prefix before the `/anyOf/` or `/oneOf/` segment are
 * collapsed into a single entry.
 */
export function filterDuplicateErrors(
  errorList: RJSFValidationError[],
  suppressDuplicateFiltering: SuppressDuplicateFilteringType = 'none',
): RJSFValidationError[] {
  if (suppressDuplicateFiltering === 'all') {
    return errorList;
  }
  return errorList.reduce<RJSFValidationError[]>((acc: RJSFValidationError[], err: RJSFValidationError) => {
    const { message, schemaPath } = err;
    const anyOfIndex = suppressDuplicateFiltering !== 'anyOf' ? schemaPath?.indexOf(`/${ANY_OF_KEY}/`) : undefined;
    const oneOfIndex = suppressDuplicateFiltering !== 'oneOf' ? schemaPath?.indexOf(`/${ONE_OF_KEY}/`) : undefined;
    let schemaPrefix: string | undefined;
    if (anyOfIndex && anyOfIndex >= 0) {
      schemaPrefix = schemaPath?.substring(0, anyOfIndex);
    } else if (oneOfIndex && oneOfIndex >= 0) {
      schemaPrefix = schemaPath?.substring(0, oneOfIndex);
    }
    const dup = schemaPrefix
      ? acc.find((e: RJSFValidationError) => e.message === message && e.schemaPath?.startsWith(schemaPrefix))
      : undefined;
    if (!dup) {
      acc.push(err);
    }
    return acc;
  }, []);
}

/** Transforms ata-validator errors into the RJSF-internal `RJSFValidationError`
 * shape. ata's error objects already use the same field names AJV does
 * (`instancePath`, `keyword`, `params`, `schemaPath`, `parentSchema`,
 * `message`), so the conversion is structural only.
 */
export function transformRJSFValidationErrors<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  errors: ValidationError[] = [],
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
  schema?: S,
): RJSFValidationError[] {
  const errorList = errors.map((e: ValidationError) => {
    const { instancePath, keyword, params, schemaPath, parentSchema } = e;
    let { message = '' } = e;
    let property = instancePath.replace(/\//g, '.');
    let stack = `${property} ${message}`.trim();
    let uiTitle = '';

    const p = params as Record<string, any>;
    const rawPropertyNames: string[] = [
      ...((p?.deps as string | undefined)?.split(', ') || []),
      p?.missingProperty,
      p?.property,
    ].filter((item) => Boolean(item));

    if (rawPropertyNames.length > 0) {
      rawPropertyNames.forEach((currentProperty) => {
        const path = property ? `${property}.${currentProperty}` : currentProperty;
        let uiSchemaTitle = getUiOptions(get(uiSchema, path.replace(/^\./, ''))).title;
        if (uiSchemaTitle === undefined) {
          const uiSchemaPath = schemaPath
            .replace(/\/properties\//g, '/')
            .split('/')
            .slice(1, -1)
            .concat([currentProperty]);
          uiSchemaTitle = getUiOptions(get(uiSchema, uiSchemaPath)).title;
        }
        if (uiSchemaTitle === undefined) {
          // schemaPath may include non-property segments (e.g. allOf/if/then) that do
          // not exist in the uiSchema; fall back to the instance path, the same way the
          // root-schema title fallback does below.
          const propParts = property.replace(/^\./, '').split('.').filter(Boolean);
          uiSchemaTitle = get(uiSchema, [...propParts, currentProperty, 'title']) as string | undefined;
        }
        if (uiSchemaTitle) {
          message = message.replace(`'${currentProperty}'`, `'${uiSchemaTitle}'`);
          uiTitle = uiSchemaTitle;
        } else {
          const parentSchemaTitle = get(parentSchema, [PROPERTIES_KEY, currentProperty, 'title']);
          if (parentSchemaTitle) {
            message = message.replace(`'${currentProperty}'`, `'${parentSchemaTitle}'`);
            uiTitle = parentSchemaTitle;
          } else if (schema) {
            // parentSchema may be an allOf/anyOf/oneOf entry that lacks `properties`;
            // fall back to looking up the title from the root schema.
            const propParts = property.replace(/^\./, '').split('.').filter(Boolean);
            const aSchemaPath: (string | number)[] = [];
            for (const part of propParts) {
              aSchemaPath.push(PROPERTIES_KEY, part);
            }
            aSchemaPath.push(PROPERTIES_KEY, currentProperty, 'title');
            const rootSchemaTitle = get(schema, aSchemaPath) as string | undefined;
            if (rootSchemaTitle) {
              message = message.replace(`'${currentProperty}'`, `'${rootSchemaTitle}'`);
              uiTitle = rootSchemaTitle;
            }
          }
        }
      });

      stack = message;
    } else {
      const uiSchemaTitle = getUiOptions<T, S, F>(get(uiSchema, property.replace(/^\./, ''))).title;

      if (uiSchemaTitle) {
        stack = `'${uiSchemaTitle}' ${message}`.trim();
        uiTitle = uiSchemaTitle;
      } else {
        const parentSchemaTitle = (parentSchema as { title?: string } | undefined)?.title;

        if (parentSchemaTitle) {
          stack = `'${parentSchemaTitle}' ${message}`.trim();
          uiTitle = parentSchemaTitle;
        }
      }
    }

    if (p && 'missingProperty' in p) {
      property = property ? `${property}.${p.missingProperty}` : p.missingProperty;
    }

    return {
      name: keyword,
      property,
      message,
      params,
      stack,
      schemaPath,
      title: uiTitle,
    };
  });
  return filterDuplicateErrors(errorList, suppressDuplicateFiltering);
}

/** Processes raw ata validation errors into the `ValidationData<T>` shape
 * RJSF consumes. Mirrors the AJV-validator's `processRawValidationErrors`,
 * including the optional `customValidate` and `transformErrors` hooks.
 */
export default function processRawValidationErrors<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  rawErrors: RawValidationErrorsType<ValidationError>,
  formData: T | undefined,
  schema: S,
  customValidate?: CustomValidator<T, S, F>,
  transformErrors?: ErrorTransformer<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
) {
  const { validationError: invalidSchemaError } = rawErrors;
  let errors = transformRJSFValidationErrors<T, S, F>(rawErrors.errors, uiSchema, suppressDuplicateFiltering, schema);

  if (invalidSchemaError) {
    errors = [...errors, { stack: invalidSchemaError.message }];
  }
  if (typeof transformErrors === 'function') {
    errors = transformErrors(errors, uiSchema);
  }

  let errorSchema = toErrorSchema<T>(errors);

  if (invalidSchemaError) {
    errorSchema = {
      ...errorSchema,
      $schema: {
        __errors: [invalidSchemaError.message],
      },
    };
  }

  if (typeof customValidate !== 'function') {
    return { errors, errorSchema };
  }

  const newFormData = getDefaultFormState<T, S, F>(validator, schema, formData, schema, true) as T;

  const errorHandler = customValidate(newFormData, createErrorHandler<T>(newFormData), uiSchema, errorSchema);
  const userErrorSchema = unwrapErrorHandler<T>(errorHandler);
  return validationDataMerge<T>({ errors, errorSchema }, userErrorSchema);
}
