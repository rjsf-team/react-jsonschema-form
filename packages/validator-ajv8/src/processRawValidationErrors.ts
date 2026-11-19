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
import type { ErrorObject } from 'ajv';

import type { SuppressDuplicateFilteringType } from './types.ts';

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
  return errorList.reduce<RJSFValidationError[]>((acc: RJSFValidationError[], err: RJSFValidationError) => {
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
  }, []);
}

/** Transforming the error output from ajv to format used by @rjsf/utils.
 * At some point, components should be updated to support ajv.
 *
 * @param errors - The list of AJV errors to convert to `RJSFValidationErrors`
 * @param [uiSchema] - An optional uiSchema that is passed to `transformErrors` and `customValidate`
 * @param [suppressDuplicateFiltering] - Controls which duplicate filtering is suppressed; see `filterDuplicateErrors`
 * @param [schema] - The schema for the validation
 */
export function transformRJSFValidationErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  errors: ErrorObject[] = [],
  uiSchema?: UiSchema<T, S, F>,
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType,
  schema?: S,
): RJSFValidationError[] {
  const errorList = errors.map((e: ErrorObject) => {
    const { instancePath, keyword, params, schemaPath, parentSchema, ...rest } = e;
    let { message = '' } = rest;
    let property = instancePath.replace(/\//g, '.');
    let stack = `${property} ${message}`.trim();
    let uiTitle = '';
    const rawPropertyNames: string[] = [
      ...(typeof params.deps === 'string' ? params.deps.split(', ') : []),
      params.missingProperty,
      params.property,
    ].filter((item) => item);

    const propParts = property.replace(/^\./, '').split('.').filter(Boolean);
    const findTitle = (currentProperty: string): string | undefined => {
      const path = property ? `${property}.${currentProperty}` : currentProperty;
      let uiSchemaTitle = getUiOptions(getByPath<UiSchema<T, S, F> | undefined>(uiSchema, toPath(path))).title;
      if (uiSchemaTitle === undefined) {
        // To retrieve a title from UI schema, construct a path to UI schema from `schemaPath` and `currentProperty`.
        // For example, when `#/properties/A/properties/B/required` and `C` are given, they are converted into `['A', 'B', 'C']`.
        const uiSchemaPath = schemaPath
          .replace(/\/properties\//g, '/')
          .split('/')
          .slice(1, -1)
          .concat([currentProperty]);
        uiSchemaTitle = getUiOptions(getByPath<UiSchema<T, S, F> | undefined>(uiSchema, uiSchemaPath)).title;
      }
      // schemaPath may include non-property segments (e.g. allOf/if/then) that do
      // not exist in the uiSchema; fall back to the instance path, the same way the
      // root-schema title fallback does below.
      uiSchemaTitle ??= getByPath<string | undefined>(uiSchema, [...propParts, currentProperty, 'title']);
      if (uiSchemaTitle) {
        return uiSchemaTitle;
      }
      const parentSchemaTitle = getByPath<string | undefined>(parentSchema, [PROPERTIES_KEY, currentProperty, 'title']);
      // parentSchema may be an allOf/anyOf/oneOf entry that lacks `properties`;
      // fall back to looking up the title from the root schema.
      return (
        parentSchemaTitle ||
        (schema
          ? getByPath<string | undefined>(schema, [
              ...propParts.flatMap((part) => [PROPERTIES_KEY, part]),
              PROPERTIES_KEY,
              currentProperty,
              'title',
            ])
          : undefined)
      );
    };

    if (rawPropertyNames.length > 0) {
      const titles = new Map<string, string>();
      rawPropertyNames.forEach((currentProperty) => {
        const title = findTitle(currentProperty);
        if (title) {
          titles.set(currentProperty, title);
          // The error is placed on its missing property, so that is the one its `title` names
          if (params.missingProperty === undefined || currentProperty === params.missingProperty) {
            uiTitle = title;
          }
        }
      });
      if (titles.size > 0) {
        // Every quoted name is titled in one pass, so a title that matches another property's key isn't titled again
        const quotedNames = [...titles.keys()].map((name) => `'${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`);
        message = message.replace(
          new RegExp(quotedNames.join('|'), 'g'),
          (quoted) => `'${titles.get(quoted.slice(1, -1))}'`,
        );
      }

      if (typeof params.property === 'string' && typeof params.deps === 'string') {
        const { property: presentProperty, deps, depsCount } = params;
        // Ajv's own message for a property dependency, from `ajv/lib/vocabularies/applicator/dependencies.ts`, leaves the
        // names bare where its other messages quote them, so it is rebuilt with each titled name quoted. A localized
        // message already quotes them, so it doesn't match and is titled above like any other
        const ajvMessage = (names: string[], present: string) =>
          `must have ${depsCount === 1 ? 'property' : 'properties'} ${names.join(', ')} when property ${present} is present`;
        if (rest.message === ajvMessage([deps], presentProperty)) {
          // `deps` joins the names with `, `, which a name may contain, so the schema's own list is used when Ajv's
          // `verbose` option hands over the `parentSchema`
          const depsList = getByPath(parentSchema, [keyword, presentProperty]);
          const names = Array.isArray(depsList) ? (depsList as string[]) : deps.split(', ');
          const named = (name: string) => {
            const title = findTitle(name);
            return title ? `'${title}'` : name;
          };
          message = ajvMessage(names.map(named), named(presentProperty));
        }
      }

      stack = message;
    } else {
      const uiSchemaTitle = getUiOptions<T, S, F>(
        getByPath<UiSchema<T, S, F> | undefined>(uiSchema, toPath(property)),
      ).title;

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

    const { missingProperty } = params;
    if (typeof missingProperty === 'string') {
      property = property ? `${property}.${missingProperty}` : missingProperty;
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
 * @param context - The `SchemaContext` of the form, used when computing the defaults handed to `customValidate`
 * @param rawErrors - The list of raw `ErrorObject`s to process
 * @param formData - The form data to validate
 * @param schema - The schema against which to validate the form data
 * @param [customValidate] - An optional function that is used to perform custom validation
 * @param [transformErrors] - An optional function that is used to transform errors after AJV validation
 * @param [uiSchema] - An optional uiSchema that is passed to `transformErrors` and `customValidate`
 * @param [suppressDuplicateFiltering] - Controls which duplicate filtering is suppressed; see `filterDuplicateErrors`
 * @param [getCustomValidateFormData] - Returns the `formData` to hand `customValidate`, with the form's defaults
 *        already applied. `Form` supplies it so those defaults honor its `customMergeAllOf` and
 *        `defaultFormStateBehavior`; without it they are computed here with the default `allOf` merge
 */
export default function processRawValidationErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rawErrors: RawValidationResult<ErrorObject>,
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

  // Include form data with undefined values, which is required for custom validation. `uiSchema` is threaded through
  // so `ui:initialValue`/`ui:emptyValue` defaults match what the form itself computed and rendered.
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
