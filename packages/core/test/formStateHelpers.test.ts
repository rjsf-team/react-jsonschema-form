import { createSchemaUtils, ErrorSchemaBuilder, ID_KEY, RJSFSchema, toFieldPathId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import {
  buildRegistry,
  computeFieldPathId,
  computeGlobalFormOptions,
  createSchemaUtilsIfChanged,
  mergeErrors,
  reuseRetrievedSchemaIfEqual,
  runLiveValidate,
  runValidate,
  toIChangeEvent,
} from '../src/components/formStateHelpers';
import getDefaultRegistry from '../src/getDefaultRegistry';
import type { FormProps, FormState } from '../src/components/Form';

const makeProps = <T = any>(overrides: Partial<FormProps<T>> = {}): FormProps<T> =>
  ({
    schema: { type: 'string' } as RJSFSchema,
    validator,
    ...overrides,
  }) as FormProps<T>;

describe('formStateHelpers', () => {
  describe('toIChangeEvent', () => {
    it('picks only the public fields from state', () => {
      const state = {
        schema: { type: 'string' },
        uiSchema: {},
        fieldPathId: { [ID_KEY]: 'root', path: ['root'] },
        schemaUtils: { fake: true } as any,
        formData: 'hello',
        edit: true,
        errors: [],
        errorSchema: {},
        schemaValidationErrors: [{ stack: 'x' }],
        schemaValidationErrorSchema: { a: 1 },
        retrievedSchema: { type: 'string' },
        initialDefaultsGenerated: true,
        registry: {} as any,
      } as unknown as FormState;
      const event = toIChangeEvent(state);
      expect(event).toEqual({
        schema: state.schema,
        uiSchema: state.uiSchema,
        fieldPathId: state.fieldPathId,
        schemaUtils: state.schemaUtils,
        formData: state.formData,
        edit: state.edit,
        errors: state.errors,
        errorSchema: state.errorSchema,
      });
      expect(event).not.toHaveProperty('schemaValidationErrors');
      expect(event).not.toHaveProperty('retrievedSchema');
    });

    it('adds status when provided', () => {
      const state = {} as unknown as FormState;
      expect(toIChangeEvent(state, 'submitted').status).toBe('submitted');
    });

    it('omits status when undefined', () => {
      const state = {} as unknown as FormState;
      expect(toIChangeEvent(state)).not.toHaveProperty('status');
    });
  });

  describe('computeGlobalFormOptions', () => {
    it('returns defaults when props are empty', () => {
      const options = computeGlobalFormOptions(makeProps());
      expect(options).toEqual({
        idPrefix: 'root',
        idSeparator: '_',
        useFallbackUiForUnsupportedType: false,
      });
    });

    it('honors ui:rootFieldId over idPrefix', () => {
      const options = computeGlobalFormOptions(
        makeProps({ idPrefix: 'ignored', uiSchema: { 'ui:rootFieldId': 'my-root' } }),
      );
      expect(options.idPrefix).toBe('my-root');
    });

    it('includes nameGenerator and experimental_componentUpdateStrategy when set', () => {
      const nameGenerator = jest.fn();
      const options = computeGlobalFormOptions(
        makeProps({ nameGenerator, experimental_componentUpdateStrategy: 'shallow' }),
      );
      expect(options.nameGenerator).toBe(nameGenerator);
      expect(options.experimental_componentUpdateStrategy).toBe('shallow');
    });

    it('omits nameGenerator and experimental_componentUpdateStrategy when not set', () => {
      const options = computeGlobalFormOptions(makeProps());
      expect(options).not.toHaveProperty('nameGenerator');
      expect(options).not.toHaveProperty('experimental_componentUpdateStrategy');
    });
  });

  describe('buildRegistry', () => {
    const schema: RJSFSchema = { type: 'string' };
    const schemaUtils = createSchemaUtils(validator, schema);

    it('layers props.fields/templates/widgets over defaultRegistry', () => {
      const CustomField = () => null;
      const CustomWidget = () => null;
      const registry = buildRegistry(
        makeProps({ fields: { myField: CustomField as any }, widgets: { myWidget: CustomWidget as any } }),
        schema,
        schemaUtils,
        getDefaultRegistry(),
      );
      expect(registry.fields.myField).toBe(CustomField);
      expect(registry.widgets.myWidget).toBe(CustomWidget);
      expect(registry.schemaUtils).toBe(schemaUtils);
      expect(registry.rootSchema).toBe(schema);
    });

    it('uses props.translateString when provided', () => {
      const translateString = jest.fn();
      const registry = buildRegistry(makeProps({ translateString }), schema, schemaUtils, getDefaultRegistry());
      expect(registry.translateString).toBe(translateString);
    });

    it('merges ButtonTemplates deeply', () => {
      const SubmitButton = () => null;
      const registry = buildRegistry(
        makeProps({ templates: { ButtonTemplates: { SubmitButton: SubmitButton as any } } }),
        schema,
        schemaUtils,
        getDefaultRegistry(),
      );
      expect(registry.templates.ButtonTemplates.SubmitButton).toBe(SubmitButton);
      expect(registry.templates.ButtonTemplates.AddButton).toBeDefined();
    });

    it('surfaces globalUiOptions and uiSchemaDefinitions from uiSchema', () => {
      const uiSchema = {
        'ui:globalOptions': { copyable: true },
        'ui:definitions': { foo: { type: 'string' } },
      };
      const registry = buildRegistry(makeProps({ uiSchema }), schema, schemaUtils, getDefaultRegistry());
      expect(registry.globalUiOptions).toEqual({ copyable: true });
      expect(registry.uiSchemaDefinitions).toEqual({ foo: { type: 'string' } });
    });
  });

  describe('createSchemaUtilsIfChanged', () => {
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
    const otherSchema: RJSFSchema = { type: 'object', properties: { b: { type: 'number' } } };

    it('creates a new utils when prev is undefined', () => {
      const utils = createSchemaUtilsIfChanged(undefined, validator, schema);
      expect(utils.getRootSchema()).toEqual(schema);
    });

    it('reuses prev when schema/validator unchanged', () => {
      const prev = createSchemaUtils(validator, schema);
      const next = createSchemaUtilsIfChanged(prev, validator, schema);
      expect(next).toBe(prev);
    });

    it('creates a fresh utils when schema changes', () => {
      const prev = createSchemaUtils(validator, schema);
      const next = createSchemaUtilsIfChanged(prev, validator, otherSchema);
      expect(next).not.toBe(prev);
      expect(next.getRootSchema()).toEqual(otherSchema);
    });
  });

  describe('computeFieldPathId', () => {
    it('returns existing when idPrefix matches', () => {
      const options = { idPrefix: 'root', idSeparator: '_', useFallbackUiForUnsupportedType: false };
      const existing = toFieldPathId('', options);
      expect(computeFieldPathId(existing, options)).toBe(existing);
    });

    it('rebuilds when idPrefix changes', () => {
      const a = toFieldPathId('', { idPrefix: 'one', idSeparator: '_', useFallbackUiForUnsupportedType: false });
      const next = computeFieldPathId(a, {
        idPrefix: 'two',
        idSeparator: '_',
        useFallbackUiForUnsupportedType: false,
      });
      expect(next).not.toBe(a);
      expect(next[ID_KEY]).toBe('two');
    });

    it('builds fresh when existing is undefined', () => {
      const result = computeFieldPathId(undefined, {
        idPrefix: 'root',
        idSeparator: '_',
        useFallbackUiForUnsupportedType: false,
      });
      expect(result[ID_KEY]).toBe('root');
    });
  });

  describe('reuseRetrievedSchemaIfEqual', () => {
    it('returns prev when deep-equal', () => {
      const prev = { type: 'string' } as RJSFSchema;
      const next = { type: 'string' } as RJSFSchema;
      expect(reuseRetrievedSchemaIfEqual(next, prev)).toBe(prev);
    });

    it('returns next when prev is undefined', () => {
      const next = { type: 'string' } as RJSFSchema;
      expect(reuseRetrievedSchemaIfEqual(next, undefined)).toBe(next);
    });

    it('returns next when schemas differ', () => {
      const prev = { type: 'string' } as RJSFSchema;
      const next = { type: 'number' } as RJSFSchema;
      expect(reuseRetrievedSchemaIfEqual(next, prev)).toBe(next);
    });
  });

  describe('mergeErrors', () => {
    it('returns schemaValidation as-is when no extra or custom errors', () => {
      const base = { errors: [{ stack: 'x' } as any], errorSchema: { a: { __errors: ['x'] } } as any };
      const result = mergeErrors(base);
      expect(result.errors).toEqual(base.errors);
      expect(result.errorSchema).toEqual(base.errorSchema);
    });

    it('merges extraErrors into the errors and errorSchema', () => {
      const base = { errors: [], errorSchema: {} as any };
      const extraErrors = { a: { __errors: ['extra'] } };
      const result = mergeErrors(base, extraErrors as any);
      expect(result.errorSchema).toEqual({ a: { __errors: ['extra'] } });
      expect(result.errors).toEqual([expect.objectContaining({ message: 'extra', property: '.a' })]);
    });

    it('merges customErrors via ErrorSchemaBuilder', () => {
      const builder = new ErrorSchemaBuilder();
      builder.addErrors('custom', ['a']);
      const result = mergeErrors({ errors: [], errorSchema: {} }, undefined, builder);
      expect(result.errorSchema).toMatchObject({ a: { __errors: ['custom'] } });
    });

    it('merges both extra and custom errors when present', () => {
      const builder = new ErrorSchemaBuilder();
      builder.addErrors('custom', ['a']);
      const extra = { b: { __errors: ['extra'] } };
      const result = mergeErrors({ errors: [], errorSchema: {} }, extra as any, builder);
      expect(result.errorSchema).toMatchObject({
        a: { __errors: ['custom'] },
        b: { __errors: ['extra'] },
      });
    });
  });

  describe('runValidate', () => {
    it('runs schema validation and returns errors', () => {
      const schema: RJSFSchema = { type: 'object', required: ['name'], properties: { name: { type: 'string' } } };
      const schemaUtils = createSchemaUtils(validator, schema);
      const result = runValidate({}, schema, schemaUtils);
      expect(result.errors.some((e) => e.message?.includes("required property 'name'"))).toBe(true);
    });

    it('uses retrievedSchema when provided, skipping schemaUtils.retrieveSchema', () => {
      const schema: RJSFSchema = { type: 'string' };
      const schemaUtils = createSchemaUtils(validator, schema);
      const retrieveSpy = jest.spyOn(schemaUtils, 'retrieveSchema');
      runValidate('hi', schema, schemaUtils, schema);
      expect(retrieveSpy).not.toHaveBeenCalled();
    });

    it('invokes customValidate when provided', () => {
      const schema: RJSFSchema = { type: 'string' };
      const schemaUtils = createSchemaUtils(validator, schema);
      const customValidate = jest.fn((_formData, errors) => errors);
      runValidate('hi', schema, schemaUtils, undefined, customValidate);
      expect(customValidate).toHaveBeenCalled();
    });
  });

  describe('runLiveValidate', () => {
    it('returns both merged errors and pre-merge schemaValidation errors', () => {
      const schema: RJSFSchema = { type: 'object', required: ['name'], properties: { name: { type: 'string' } } };
      const schemaUtils = createSchemaUtils(validator, schema);
      const extraErrors = { name: { __errors: ['extra'] } } as any;
      const result = runLiveValidate(schema, schemaUtils, {}, {}, extraErrors, undefined);
      expect(result.schemaValidationErrors.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThanOrEqual(result.schemaValidationErrors.length);
      expect(result.errorSchema).toHaveProperty('name');
    });

    it('merges into originalErrorSchema when mergeIntoOriginalErrorSchema is true', () => {
      const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const schemaUtils = createSchemaUtils(validator, schema);
      const original = { otherField: { __errors: ['legacy'] } } as any;
      const result = runLiveValidate(
        schema,
        schemaUtils,
        original,
        { name: 'ok' },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
      );
      expect(result.errorSchema.otherField).toEqual({ __errors: ['legacy'] });
    });

    it('does not merge into originalErrorSchema when mergeIntoOriginalErrorSchema is false', () => {
      const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const schemaUtils = createSchemaUtils(validator, schema);
      const original = { otherField: { __errors: ['legacy'] } } as any;
      const result = runLiveValidate(schema, schemaUtils, original, { name: 'ok' }, undefined, undefined);
      expect(result.errorSchema.otherField).toBeUndefined();
    });
  });
});
