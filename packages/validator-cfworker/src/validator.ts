import type { OutputUnit, Schema, Validator } from '@cfworker/json-schema';
import type {
  CustomValidator,
  ErrorTransformer,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  ValidationData,
  ValidatorType,
} from '@rjsf/utils';
import { deepEquals, hashForSchema, ID_KEY, ROOT_SCHEMA_PREFIX, withIdRefPrefix } from '@rjsf/utils';

import createCfworkerInstance from './createCfworkerInstance';
import type { RawValidationErrorsType } from './processRawValidationErrors';
import processRawValidationErrors from './processRawValidationErrors';
import type { CFWorkerValidationError, CustomValidatorOptionsType } from './types';

interface CachedValidator {
  validator: Validator;
  schema: object;
  rootSchema?: object;
}

/** Converts JavaScript `undefined` values into JSON-compatible input.
 * Object members with undefined values are omitted so a `required` keyword
 * sees them as missing; array entries and a top-level undefined become null.
 */
export function normalizeFormDataForValidation<D>(data: D): D {
  if (data === undefined) {
    return null as D;
  }
  if (Array.isArray(data)) {
    return data.map((value) => normalizeFormDataForValidation(value)) as D;
  }
  if (data !== null && typeof data === 'object') {
    const normalized = Object.fromEntries(
      Object.entries(data).flatMap(([key, value]) =>
        value === undefined ? [] : [[key, normalizeFormDataForValidation(value)]],
      ),
    );
    return normalized as D;
  }
  return data;
}

/** `ValidatorType` implementation backed by `@cfworker/json-schema`. */
export default class CFWorkerValidator<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> implements ValidatorType<T, S, F> {
  readonly options: CustomValidatorOptionsType;

  private readonly validators = new Map<string, CachedValidator>();

  private cachedRootSchema?: object;

  private lastSeenRootSchema?: S;

  private hasRegisteredRootSchema = false;

  constructor(options: CustomValidatorOptionsType = {}) {
    this.options = { draft: '2020-12', shortCircuit: false, ...options };
  }

  reset(): void {
    this.validators.clear();
    this.cachedRootSchema = undefined;
    this.lastSeenRootSchema = undefined;
    this.hasRegisteredRootSchema = false;
  }

  private getOrBuild(id: string, schema: object): Validator {
    const rootSchema =
      this.cachedRootSchema && !deepEquals(this.cachedRootSchema, schema) ? this.cachedRootSchema : undefined;
    const cached = this.validators.get(id);
    if (
      cached &&
      deepEquals(cached.schema, schema) &&
      ((cached.rootSchema === undefined && rootSchema === undefined) || deepEquals(cached.rootSchema, rootSchema))
    ) {
      return cached.validator;
    }

    const validator = createCfworkerInstance(schema as Schema, this.options, rootSchema as Schema | undefined);
    this.validators.set(id, { validator, schema, rootSchema });
    return validator;
  }

  rawValidation<Result = any>(schema: S, formData?: T): RawValidationErrorsType<Result> {
    let validationError: Error | undefined;
    let errors: OutputUnit[] | undefined;
    try {
      const id = schema[ID_KEY] ?? hashForSchema(schema);
      const validator = this.getOrBuild(id, schema);
      const result = validator.validate(normalizeFormDataForValidation(formData));
      errors = result.valid ? undefined : result.errors;
    } catch (error) {
      validationError = error as Error;
    }
    return { errors: errors as Result[] | undefined, validationError };
  }

  validateFormData(
    formData: T | undefined,
    schema: S,
    customValidate?: CustomValidator<T, S, F>,
    transformErrors?: ErrorTransformer<T, S, F>,
    uiSchema?: UiSchema<T, S, F>,
  ): ValidationData<T> {
    const rawErrors = this.rawValidation<CFWorkerValidationError>(schema, formData);
    return processRawValidationErrors(
      this,
      rawErrors,
      formData,
      schema,
      customValidate,
      transformErrors,
      uiSchema,
      this.options.suppressDuplicateFiltering,
    );
  }

  handleSchemaUpdate(rootSchema: S): void {
    if (this.lastSeenRootSchema === rootSchema && this.hasRegisteredRootSchema) {
      return;
    }
    // `withIdRefPrefix()` rewrites local refs to ROOT_SCHEMA_PREFIX, so the
    // root must be registered under that alias even when it has its own $id.
    const rootSchemaId = ROOT_SCHEMA_PREFIX;
    const rootWithId =
      rootSchema[ID_KEY] === rootSchemaId
        ? (rootSchema as object)
        : { ...(rootSchema as object), [ID_KEY]: rootSchemaId };

    if (this.cachedRootSchema && !deepEquals(this.cachedRootSchema, rootWithId)) {
      this.validators.clear();
    }
    this.cachedRootSchema = rootWithId;
    this.getOrBuild(rootSchemaId, rootWithId);
    this.lastSeenRootSchema = rootSchema;
    this.hasRegisteredRootSchema = true;
  }

  isValid(schema: S, formData: T | undefined, rootSchema: S): boolean {
    try {
      this.handleSchemaUpdate(rootSchema);
      const schemaWithIdRefPrefix = withIdRefPrefix<S>(schema) as S;
      const id = schemaWithIdRefPrefix[ID_KEY] ?? hashForSchema(schemaWithIdRefPrefix);
      const validator = this.getOrBuild(id, schemaWithIdRefPrefix);
      return validator.validate(normalizeFormDataForValidation(formData)).valid;
    } catch (error) {
      // oxlint-disable-next-line no-console
      console.warn('Error encountered validating schema:', error);
      return false;
    }
  }
}
