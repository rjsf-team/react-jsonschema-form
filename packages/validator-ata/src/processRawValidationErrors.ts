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
  ANY_OF_KEY,
  applyValidatorErrorTitles,
  createErrorHandler,
  getByPath,
  getDefaultFormState,
  getKeywordParentSchema,
  getUiOptions,
  ONE_OF_KEY,
  toErrorSchema,
  toPath,
  unwrapErrorHandler,
  validationDataMerge,
} from '@rjsf/utils';
import type { ValidationError } from 'ata-validator';

import type { SuppressDuplicateFilteringType } from './types.ts';

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

/** Returns the key a token of ata's `instancePath` or `schemaPath` names. ata writes it as a JSON Pointer token
 * (`a/b` as `a~1b`) but, unlike Ajv, doesn't percent-encode it
 *
 * @param token - The token of the path
 * @returns - The key it names
 */
function unescapePointerToken(token: string): string {
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
}

/** Transforms ata-validator errors into the RJSF-internal `RJSFValidationError`
 * shape. ata's error objects already use the same field names AJV does
 * (`instancePath`, `keyword`, `params`, `schemaPath`, `parentSchema`,
 * `message`), so the conversion is structural only.
 */
export function transformRJSFValidationErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  errors: ValidationError[] = [],
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
  schema?: S,
): RJSFValidationError[] {
  const errorList = errors.map((e: ValidationError) => {
    const { instancePath, keyword, params, schemaPath } = e;
    // ata hands over a `$ref`'s own schema, unresolved, for a keyword under it, or no schema at all in a chain of them.
    // A `null` lookup is a path that can index either a `$ref` schema's branch or its target's, whose title is unknown
    const found = schema && getKeywordParentSchema<S>(schema, schemaPath, unescapePointerToken, true);
    const parentSchema = found === null ? undefined : (found ?? e.parentSchema);
    // oxlint-disable-next-line typescript/no-useless-default-assignment -- ata's types say `message` is always set, but it can be missing at runtime
    let { message = '' } = e;
    let property = instancePath.split('/').map(unescapePointerToken).join('.');
    let stack = `${property} ${message}`.trim();
    let uiTitle = '';

    const rawPropertyNames = [
      ...(typeof params?.deps === 'string' ? params.deps.split(', ') : []),
      params?.missingProperty,
      params?.property,
    ].filter((item): item is string => typeof item === 'string' && item !== '');

    if (rawPropertyNames.length > 0) {
      const applied = applyValidatorErrorTitles<T, S, F>({
        message,
        names: rawPropertyNames,
        quote: "'",
        property,
        schemaPath,
        decodeSchemaPathKey: unescapePointerToken,
        uiSchema,
        parentSchema,
        schema,
      });
      message = applied.message;
      uiTitle = [...applied.titles.values()].at(-1) ?? '';

      stack = message;
    } else {
      const uiSchemaTitle = getUiOptions<T, S, F>(
        getByPath<UiSchema<T, S, F> | undefined>(uiSchema, toPath(property)),
      ).title;

      if (uiSchemaTitle) {
        stack = `'${uiSchemaTitle}' ${message}`.trim();
        uiTitle = uiSchemaTitle;
      } else {
        // A `false` property's error comes with the `properties` holding it, where `title` can name a property
        const parentSchemaTitle = getByPath(parentSchema, 'title');

        if (typeof parentSchemaTitle === 'string' && parentSchemaTitle) {
          stack = `'${parentSchemaTitle}' ${message}`.trim();
          uiTitle = parentSchemaTitle;
        }
      }
    }

    const missingProperty = params?.missingProperty;
    if (typeof missingProperty === 'string') {
      property = property ? `${property}.${missingProperty}` : missingProperty;
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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rawErrors: RawValidationResult<ValidationError>,
  formData: T | undefined,
  schema: S,
  customValidate?: CustomValidator<T, S, F>,
  transformErrors?: ErrorTransformer<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
  getCustomValidateFormData?: () => T,
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
