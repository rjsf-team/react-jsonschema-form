import {
  createSchemaUtils,
  ErrorSchemaBuilder,
  RJSFSchema,
  toErrorList,
  ValidationData,
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  ID_KEY,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import getDefaultRegistry from '../src/getDefaultRegistry';
import {
  buildRegistry,
  formReducer,
  getGlobalFormOptions,
  getStateFromProps,
  mergeErrors,
  performLiveValidate,
  propsAreEqual,
  runValidation,
  stableRetrievedSchema,
  toIChangeEvent,
} from '../src/components/formUtils';

import type { FormProps, FormState } from '../src/components/Form';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SIMPLE_SCHEMA: RJSFSchema = { type: 'string' };
const STRING_MIN_SCHEMA: RJSFSchema = { type: 'string', minLength: 3 };
const OBJECT_SCHEMA: RJSFSchema = {
  type: 'object',
  properties: { name: { type: 'string' }, age: { type: 'number' } },
};

function makeProps(overrides: Partial<FormProps> = {}): FormProps {
  return { schema: SIMPLE_SCHEMA, validator, ...overrides };
}

function makeSchemaUtils(schema: RJSFSchema = SIMPLE_SCHEMA) {
  return createSchemaUtils(validator, schema);
}

// ─── stableRetrievedSchema ────────────────────────────────────────────────────

describe('stableRetrievedSchema', () => {
  it('returns the current reference when content is deeply equal', () => {
    const current = { type: 'string' } as RJSFSchema;
    const next = { type: 'string' } as RJSFSchema;
    const result = stableRetrievedSchema(next, current);
    expect(result).toBe(current);
  });

  it('returns next when content differs', () => {
    const current = { type: 'string' } as RJSFSchema;
    const next = { type: 'number' } as RJSFSchema;
    const result = stableRetrievedSchema(next, current);
    expect(result).toBe(next);
  });

  it('returns next when current is undefined', () => {
    const next = { type: 'string' } as RJSFSchema;
    const result = stableRetrievedSchema(next, undefined);
    expect(result).toBe(next);
  });
});

// ─── toIChangeEvent ───────────────────────────────────────────────────────────

describe('toIChangeEvent', () => {
  const schemaUtils = makeSchemaUtils();
  const baseState: FormState = {
    schema: SIMPLE_SCHEMA,
    uiSchema: {},
    fieldPathId: { [ID_KEY]: 'root', path: ['root'] },
    schemaUtils,
    formData: 'hello',
    edit: true,
    errors: [],
    errorSchema: {},
    schemaValidationErrors: [],
    schemaValidationErrorSchema: {},
    retrievedSchema: SIMPLE_SCHEMA,
    initialDefaultsGenerated: true,
    registry: { ...getDefaultRegistry(), schemaUtils },
  };

  it('picks only the public IChangeEvent fields', () => {
    const event = toIChangeEvent(baseState);
    expect(event).toHaveProperty('schema', SIMPLE_SCHEMA);
    expect(event).toHaveProperty('uiSchema', {});
    expect(event).toHaveProperty('formData', 'hello');
    expect(event).toHaveProperty('edit', true);
    expect(event).toHaveProperty('errors', []);
    expect(event).toHaveProperty('errorSchema', {});
    // Private fields should NOT be present
    expect(event).not.toHaveProperty('schemaValidationErrors');
    expect(event).not.toHaveProperty('schemaValidationErrorSchema');
    expect(event).not.toHaveProperty('retrievedSchema');
    expect(event).not.toHaveProperty('initialDefaultsGenerated');
    expect(event).not.toHaveProperty('registry');
    expect(event).not.toHaveProperty('_prevExtraErrors');
  });

  it('omits status when not provided', () => {
    const event = toIChangeEvent(baseState);
    expect(event).not.toHaveProperty('status');
  });

  it('includes status when provided', () => {
    const event = toIChangeEvent(baseState, 'submitted');
    expect(event).toHaveProperty('status', 'submitted');
  });
});

// ─── getGlobalFormOptions ─────────────────────────────────────────────────────

describe('getGlobalFormOptions', () => {
  it('returns defaults when no relevant props are set', () => {
    const opts = getGlobalFormOptions(makeProps());
    expect(opts.idPrefix).toBe(DEFAULT_ID_PREFIX);
    expect(opts.idSeparator).toBe(DEFAULT_ID_SEPARATOR);
    expect(opts.useFallbackUiForUnsupportedType).toBe(false);
    expect(opts.experimental_componentUpdateStrategy).toBeUndefined();
    expect(opts.nameGenerator).toBeUndefined();
  });

  it('uses ui:rootFieldId as idPrefix over idPrefix prop', () => {
    const opts = getGlobalFormOptions(
      makeProps({ uiSchema: { 'ui:rootFieldId': 'myRoot' }, idPrefix: 'should-be-ignored' }),
    );
    expect(opts.idPrefix).toBe('myRoot');
  });

  it('uses idPrefix prop when no ui:rootFieldId', () => {
    const opts = getGlobalFormOptions(makeProps({ idPrefix: 'myPrefix' }));
    expect(opts.idPrefix).toBe('myPrefix');
  });

  it('uses custom idSeparator', () => {
    const opts = getGlobalFormOptions(makeProps({ idSeparator: '.' }));
    expect(opts.idSeparator).toBe('.');
  });

  it('includes experimental_componentUpdateStrategy when set', () => {
    const opts = getGlobalFormOptions(makeProps({ experimental_componentUpdateStrategy: 'shallow' }));
    expect(opts.experimental_componentUpdateStrategy).toBe('shallow');
  });

  it('includes nameGenerator when provided', () => {
    const ng = jest.fn();
    const opts = getGlobalFormOptions(makeProps({ nameGenerator: ng }));
    expect(opts.nameGenerator).toBe(ng);
  });

  it('sets useFallbackUiForUnsupportedType correctly', () => {
    const opts = getGlobalFormOptions(makeProps({ useFallbackUiForUnsupportedType: true }));
    expect(opts.useFallbackUiForUnsupportedType).toBe(true);
  });
});

// ─── buildRegistry ────────────────────────────────────────────────────────────

describe('buildRegistry', () => {
  const schemaUtils = makeSchemaUtils();

  it('builds a registry with default fields/widgets/templates', () => {
    const registry = buildRegistry(makeProps(), SIMPLE_SCHEMA, schemaUtils);
    const defaults = getDefaultRegistry();
    expect(Object.keys(registry.fields)).toEqual(expect.arrayContaining(Object.keys(defaults.fields)));
    expect(Object.keys(registry.widgets)).toEqual(expect.arrayContaining(Object.keys(defaults.widgets)));
    expect(registry.rootSchema).toBe(SIMPLE_SCHEMA);
    expect(registry.schemaUtils).toBe(schemaUtils);
  });

  it('merges custom fields over defaults', () => {
    const CustomField = jest.fn();
    const registry = buildRegistry(makeProps({ fields: { CustomField } }), SIMPLE_SCHEMA, schemaUtils);
    expect(registry.fields.CustomField).toBe(CustomField);
  });

  it('merges custom widgets over defaults', () => {
    const MyWidget = jest.fn();
    const registry = buildRegistry(makeProps({ widgets: { MyWidget } }), SIMPLE_SCHEMA, schemaUtils);
    expect(registry.widgets.MyWidget).toBe(MyWidget);
  });

  it('merges ButtonTemplates deeply', () => {
    const MySubmitButton = jest.fn();
    const registry = buildRegistry(
      makeProps({ templates: { ButtonTemplates: { SubmitButton: MySubmitButton } } }),
      SIMPLE_SCHEMA,
      schemaUtils,
    );
    expect(registry.templates.ButtonTemplates.SubmitButton).toBe(MySubmitButton);
    // Other ButtonTemplates from defaults should still be present
    expect(registry.templates.ButtonTemplates.AddButton).toBeDefined();
  });

  it('uses custom translateString when provided', () => {
    const customTranslate = jest.fn();
    const registry = buildRegistry(makeProps({ translateString: customTranslate }), SIMPLE_SCHEMA, schemaUtils);
    expect(registry.translateString).toBe(customTranslate);
  });

  it('falls back to default translateString when not provided', () => {
    const registry = buildRegistry(makeProps(), SIMPLE_SCHEMA, schemaUtils);
    expect(registry.translateString).toBeDefined();
    expect(registry.translateString).toBe(getDefaultRegistry().translateString);
  });

  it('uses custom formContext', () => {
    const formContext = { myKey: 'myValue' };
    const registry = buildRegistry(makeProps({ formContext }), SIMPLE_SCHEMA, schemaUtils);
    expect(registry.formContext).toBe(formContext);
  });
});

// ─── mergeErrors ─────────────────────────────────────────────────────────────

describe('mergeErrors', () => {
  const baseValidation: ValidationData<any> = {
    errors: [{ name: 'type', property: '.name', message: 'wrong type', stack: '.name wrong type', params: {} }],
    errorSchema: new ErrorSchemaBuilder().addErrors(['wrong type'], 'name').ErrorSchema,
  };

  it('returns unchanged when no extraErrors or customErrors', () => {
    const result = mergeErrors(baseValidation);
    expect(result.errors).toEqual(baseValidation.errors);
    expect(result.errorSchema).toEqual(baseValidation.errorSchema);
  });

  it('merges extraErrors into the result', () => {
    const extraErrors = new ErrorSchemaBuilder().addErrors(['extra error'], 'name').ErrorSchema;
    const result = mergeErrors(baseValidation, extraErrors);
    expect(result.errors.length).toBeGreaterThan(baseValidation.errors.length);
    expect(result.errorSchema.name?.__errors).toContain('extra error');
  });

  it('merges customErrors (ErrorSchemaBuilder) into the result', () => {
    const customErrors = new ErrorSchemaBuilder().addErrors(['custom error'], 'age');
    const result = mergeErrors({ errors: [], errorSchema: {} }, undefined, customErrors);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errorSchema.age?.__errors).toContain('custom error');
  });

  it('merges both extraErrors and customErrors', () => {
    const extraErrors = new ErrorSchemaBuilder().addErrors(['extra'], 'name').ErrorSchema;
    const customErrors = new ErrorSchemaBuilder().addErrors(['custom'], 'age');
    const result = mergeErrors({ errors: [], errorSchema: {} }, extraErrors, customErrors);
    expect(result.errorSchema.name?.__errors).toContain('extra');
    expect(result.errorSchema.age?.__errors).toContain('custom');
  });
});

// ─── runValidation ────────────────────────────────────────────────────────────

describe('runValidation', () => {
  it('returns no errors for valid data', () => {
    const schemaUtils = makeSchemaUtils(STRING_MIN_SCHEMA);
    const result = runValidation('hello world', STRING_MIN_SCHEMA, schemaUtils);
    expect(result.errors).toHaveLength(0);
    expect(result.errorSchema).toEqual({});
  });

  it('returns errors for invalid data', () => {
    const schemaUtils = makeSchemaUtils(STRING_MIN_SCHEMA);
    const result = runValidation('hi', STRING_MIN_SCHEMA, schemaUtils);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('3');
  });

  it('uses provided retrievedSchema instead of recomputing', () => {
    const schemaUtils = makeSchemaUtils(STRING_MIN_SCHEMA);
    const retrieveSpy = jest.spyOn(schemaUtils, 'retrieveSchema');
    const retrieved = schemaUtils.retrieveSchema(STRING_MIN_SCHEMA, 'hi');
    retrieveSpy.mockClear();

    runValidation('hi', STRING_MIN_SCHEMA, schemaUtils, undefined, undefined, undefined, retrieved);
    expect(retrieveSpy).not.toHaveBeenCalled();
  });

  it('calls retrieveSchema when no retrievedSchema is provided', () => {
    const schemaUtils = makeSchemaUtils(STRING_MIN_SCHEMA);
    const retrieveSpy = jest.spyOn(schemaUtils, 'retrieveSchema');

    runValidation('hi', STRING_MIN_SCHEMA, schemaUtils);
    expect(retrieveSpy).toHaveBeenCalledTimes(1);
  });

  it('applies a customValidate function', () => {
    const schemaUtils = makeSchemaUtils(SIMPLE_SCHEMA);
    const customValidate = jest.fn((formData: string | undefined, errors: any) => {
      if (formData === 'bad') {
        errors.addError('custom error');
      }
      return errors;
    });
    const result = runValidation('bad', SIMPLE_SCHEMA, schemaUtils, customValidate);
    expect(result.errors.some((e) => e.message === 'custom error')).toBe(true);
  });
});

// ─── performLiveValidate ──────────────────────────────────────────────────────

describe('performLiveValidate', () => {
  const schemaUtils = makeSchemaUtils(STRING_MIN_SCHEMA);

  it('returns validation errors and schema-level errors', () => {
    const result = performLiveValidate(
      STRING_MIN_SCHEMA,
      schemaUtils,
      {},
      'hi',
      undefined,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
    );
    expect(result.schemaValidationErrors.length).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns empty errors for valid data', () => {
    const result = performLiveValidate(
      STRING_MIN_SCHEMA,
      schemaUtils,
      {},
      'hello world',
      undefined,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
    );
    expect(result.errors).toHaveLength(0);
    expect(result.schemaValidationErrors).toHaveLength(0);
  });

  it('merges originalErrorSchema when mergeIntoOriginalErrorSchema is true', () => {
    const originalErrorSchema = new ErrorSchemaBuilder().addErrors(['pre-existing error']).ErrorSchema;
    const result = performLiveValidate(
      STRING_MIN_SCHEMA,
      schemaUtils,
      originalErrorSchema,
      'hi',
      undefined,
      undefined,
      undefined,
      true,
      undefined,
      undefined,
      undefined,
    );
    expect(result.errorSchema.__errors).toContain('pre-existing error');
  });

  it('does NOT merge originalErrorSchema when mergeIntoOriginalErrorSchema is false', () => {
    const originalErrorSchema = new ErrorSchemaBuilder().addErrors(['pre-existing error']).ErrorSchema;
    const result = performLiveValidate(
      STRING_MIN_SCHEMA,
      schemaUtils,
      originalErrorSchema,
      'hi',
      undefined,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
    );
    expect(result.errorSchema.__errors ?? []).not.toContain('pre-existing error');
  });

  it('merges extraErrors into the result', () => {
    const extraErrors = new ErrorSchemaBuilder().addErrors(['extra']).ErrorSchema;
    const result = performLiveValidate(
      STRING_MIN_SCHEMA,
      schemaUtils,
      {},
      'hi',
      extraErrors,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
    );
    expect(result.errorSchema.__errors).toContain('extra');
  });

  it('schemaValidationErrors are independent of extraErrors', () => {
    const extraErrors = new ErrorSchemaBuilder().addErrors(['extra']).ErrorSchema;
    const result = performLiveValidate(
      STRING_MIN_SCHEMA,
      schemaUtils,
      {},
      'hi',
      extraErrors,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
    );
    // schemaValidationErrors should not include extra errors
    expect(result.schemaValidationErrors.every((e) => e.message !== 'extra')).toBe(true);
  });
});

// ─── getStateFromProps ────────────────────────────────────────────────────────

describe('getStateFromProps', () => {
  it('computes initial state with no formData', () => {
    const state = getStateFromProps(makeProps(), {});
    expect(state.formData).toBeUndefined();
    expect(state.edit).toBe(false);
    expect(state.errors).toEqual([]);
    expect(state.schema).toEqual(SIMPLE_SCHEMA);
    expect(state.initialDefaultsGenerated).toBe(true);
  });

  it('sets edit=true when formData is provided', () => {
    const state = getStateFromProps(makeProps({ formData: 'hello' }), {}, 'hello');
    expect(state.edit).toBe(true);
    expect(state.formData).toBe('hello');
  });

  it('uses existing schemaUtils when validator and schema are unchanged', () => {
    const schemaUtils = makeSchemaUtils(SIMPLE_SCHEMA);
    const state = getStateFromProps(makeProps(), { schemaUtils }, 'hello');
    expect(state.schemaUtils).toBe(schemaUtils);
  });

  it('creates new schemaUtils when schema changes', () => {
    const oldSchemaUtils = makeSchemaUtils(SIMPLE_SCHEMA);
    const state = getStateFromProps(makeProps({ schema: STRING_MIN_SCHEMA }), { schemaUtils: oldSchemaUtils }, 'hi');
    expect(state.schemaUtils).not.toBe(oldSchemaUtils);
  });

  it('clears errors when isSchemaChanged=true and noValidate is set', () => {
    const currentState: Partial<FormState> = {
      errors: [{ name: 'type', property: '.', message: 'old error', stack: '. old error', params: {} }],
      errorSchema: new ErrorSchemaBuilder().addErrors(['old error']).ErrorSchema,
    };
    const state = getStateFromProps(makeProps({ noValidate: true }), currentState, undefined, undefined, true);
    expect(state.errors).toEqual([]);
    expect(state.errorSchema).toEqual({});
  });

  it('runs live validation when liveValidate=true and edit=true', () => {
    const state = getStateFromProps(
      makeProps({ schema: STRING_MIN_SCHEMA, liveValidate: true }),
      {},
      'hi', // violates minLength: 3
    );
    expect(state.errors.length).toBeGreaterThan(0);
  });

  it('skips live validation when skipLiveValidate=true', () => {
    const state = getStateFromProps(
      makeProps({ schema: STRING_MIN_SCHEMA, liveValidate: true }),
      {},
      'hi',
      undefined,
      false,
      [],
      true, // skipLiveValidate
    );
    expect(state.errors).toEqual([]);
  });

  it('applies schema defaults to formData', () => {
    const schemaWithDefault: RJSFSchema = {
      type: 'object',
      properties: { name: { type: 'string', default: 'Alice' } },
    };
    const state = getStateFromProps(makeProps({ schema: schemaWithDefault }), {}, {});
    expect(state.formData?.name).toBe('Alice');
  });

  it('clears changed field errors when formDataChangedFields is provided', () => {
    const nameRequiredSchema = new ErrorSchemaBuilder().addErrors(['required'], 'name').ErrorSchema;
    const currentState: Partial<FormState> = {
      schemaValidationErrors: [],
      schemaValidationErrorSchema: nameRequiredSchema,
      errors: toErrorList(nameRequiredSchema),
      errorSchema: nameRequiredSchema,
    };
    const state = getStateFromProps(
      makeProps({ schema: OBJECT_SCHEMA }),
      currentState,
      { name: 'Alice' },
      undefined,
      false,
      ['name'],
    );
    expect(state.errorSchema.name?.__errors).toBeUndefined();
  });

  it('reuses the retrieved schema reference when content is unchanged', () => {
    const su = makeSchemaUtils(SIMPLE_SCHEMA);
    const existingRetrievedSchema = su.retrieveSchema(SIMPLE_SCHEMA, undefined);
    const currentState: Partial<FormState> = { schemaUtils: su, retrievedSchema: existingRetrievedSchema };
    const state = getStateFromProps(makeProps(), currentState, undefined, existingRetrievedSchema);
    expect(state.retrievedSchema).toBe(existingRetrievedSchema);
  });
});

// ─── propsAreEqual ────────────────────────────────────────────────────────────

describe('propsAreEqual', () => {
  const base = makeProps({ formData: 'hello' });

  it("returns false for 'always' strategy regardless of changes", () => {
    const same = makeProps({ formData: 'hello', experimental_componentUpdateStrategy: 'always' });
    expect(propsAreEqual(same, same)).toBe(false);
  });

  it("returns true for 'customDeep' when props are deeply equal", () => {
    const a = makeProps({ formData: 'hello' });
    const b = makeProps({ formData: 'hello' });
    expect(propsAreEqual(a, b)).toBe(true);
  });

  it("returns false for 'customDeep' when props differ", () => {
    const a = makeProps({ formData: 'hello' });
    const b = makeProps({ formData: 'world' });
    expect(propsAreEqual(a, b)).toBe(false);
  });

  it("treats different function references as equal under 'customDeep'", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const a = makeProps({ onChange: () => {} });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const b = makeProps({ onChange: () => {} });
    expect(propsAreEqual(a, b)).toBe(true);
  });

  it("returns true for 'shallow' when all values are reference-equal", () => {
    const onChange = jest.fn();
    const a = makeProps({ onChange });
    const b = makeProps({ onChange });
    expect(
      propsAreEqual(
        { ...a, experimental_componentUpdateStrategy: 'shallow' },
        { ...b, experimental_componentUpdateStrategy: 'shallow' },
      ),
    ).toBe(true);
  });

  it("returns false for 'shallow' when a function reference differs", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const a = makeProps({ onChange: () => {}, experimental_componentUpdateStrategy: 'shallow' });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const b = makeProps({ onChange: () => {}, experimental_componentUpdateStrategy: 'shallow' });
    expect(propsAreEqual(a, b)).toBe(false);
  });

  it("returns false for 'shallow' when a primitive value differs", () => {
    const a = makeProps({ formData: 'a', experimental_componentUpdateStrategy: 'shallow' });
    const b = makeProps({ formData: 'b', experimental_componentUpdateStrategy: 'shallow' });
    expect(propsAreEqual(a, b)).toBe(false);
  });

  it("defaults to 'customDeep' when no strategy is set", () => {
    expect(propsAreEqual(base, { ...base })).toBe(true);
  });
});

// ─── formReducer ─────────────────────────────────────────────────────────────

describe('formReducer', () => {
  const schemaUtils = makeSchemaUtils();
  const baseState: FormState = {
    schema: SIMPLE_SCHEMA,
    uiSchema: {},
    fieldPathId: { [ID_KEY]: 'root', path: ['root'] },
    schemaUtils,
    formData: undefined,
    edit: false,
    errors: [],
    errorSchema: {},
    schemaValidationErrors: [],
    schemaValidationErrorSchema: {},
    retrievedSchema: SIMPLE_SCHEMA,
    initialDefaultsGenerated: false,
    registry: { ...getDefaultRegistry(), schemaUtils },
  };

  it('SET_SCHEMA merges schema-related payload', () => {
    const newSchema = { type: 'number' } as RJSFSchema;
    const newSchemaUtils = makeSchemaUtils(newSchema);
    const next = formReducer(baseState, {
      type: 'SET_SCHEMA',
      payload: { schema: newSchema, schemaUtils: newSchemaUtils },
    });
    expect(next.schema).toBe(newSchema);
    expect(next.schemaUtils).toBe(newSchemaUtils);
    // Other state is preserved
    expect(next.formData).toBeUndefined();
    expect(next.errors).toEqual([]);
  });

  it('SET_FORM_DATA merges form-data payload', () => {
    const next = formReducer(baseState, {
      type: 'SET_FORM_DATA',
      payload: { formData: 'new value', edit: true },
    });
    expect(next.formData).toBe('new value');
    expect(next.edit).toBe(true);
    // Other state is preserved
    expect(next.schema).toBe(SIMPLE_SCHEMA);
  });

  it('SET_ERRORS merges error payload', () => {
    const errors = [{ name: 'minLength', property: '.', message: 'too short', stack: '. too short', params: {} }];
    const errorSchema = new ErrorSchemaBuilder().addErrors(['too short']).ErrorSchema;
    const next = formReducer(baseState, {
      type: 'SET_ERRORS',
      payload: { errors, errorSchema },
    });
    expect(next.errors).toBe(errors);
    expect(next.errorSchema).toBe(errorSchema);
    // Other state is preserved
    expect(next.formData).toBeUndefined();
    expect(next.schema).toBe(SIMPLE_SCHEMA);
  });

  it('SET_STATE merges any partial state', () => {
    const next = formReducer(baseState, {
      type: 'SET_STATE',
      payload: { formData: 'test', edit: true, initialDefaultsGenerated: true },
    });
    expect(next.formData).toBe('test');
    expect(next.edit).toBe(true);
    expect(next.initialDefaultsGenerated).toBe(true);
    expect(next.schema).toBe(SIMPLE_SCHEMA);
  });

  it('does not mutate the original state', () => {
    const frozen = Object.freeze({ ...baseState });
    expect(() => formReducer(frozen, { type: 'SET_FORM_DATA', payload: { formData: 'x' } })).not.toThrow();
    expect(frozen.formData).toBeUndefined();
  });
});
