import { Registry, RJSFSchema, resolveUiSchema, TemplatesType, UiSchema, UiSchemaDefinitions } from '../src';

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation();
});
afterEach(() => {
  jest.restoreAllMocks();
});

const baseRegistry: Registry = {
  formContext: {},
  rootSchema: {},
  schemaUtils: {} as Registry['schemaUtils'],
  translateString: () => '',
  fields: {},
  widgets: {},
  templates: {} as TemplatesType,
  globalFormOptions: { idPrefix: 'root', idSeparator: '_', useFallbackUiForUnsupportedType: false },
};

/** Helper to create a registry with specific rootSchema and uiSchemaDefinitions */
function makeRegistry(rootSchema: RJSFSchema, uiSchemaDefinitions: UiSchemaDefinitions = {}): Registry {
  return { ...baseRegistry, rootSchema, uiSchemaDefinitions };
}

describe('resolveUiSchema() - branching keyword runtime resolution', () => {
  it('resolves correct definition for oneOf branch A at runtime', () => {
    const definitions = {
      '#/$defs/optionA': { name: { 'ui:placeholder': 'Name for A' } },
      '#/$defs/optionB': { name: { 'ui:placeholder': 'Name for B' } },
    };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    // When optionA branch is selected, SchemaField receives its $ref
    const result = resolveUiSchema({ $ref: '#/$defs/optionA' }, undefined, reg);
    expect(result.name).toEqual({ 'ui:placeholder': 'Name for A' });
  });

  it('resolves correct definition for oneOf branch B at runtime', () => {
    const definitions = {
      '#/$defs/optionA': { name: { 'ui:placeholder': 'Name for A' } },
      '#/$defs/optionB': { name: { 'ui:placeholder': 'Name for B' } },
    };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    // When optionB branch is selected, SchemaField receives its $ref
    const result = resolveUiSchema({ $ref: '#/$defs/optionB' }, undefined, reg);
    expect(result.name).toEqual({ 'ui:placeholder': 'Name for B' });
  });

  it('each branch gets distinct uiSchema for same property name', () => {
    const definitions = {
      '#/$defs/optionA': { shared: { 'ui:widget': 'textarea', 'ui:help': 'Help for A' } },
      '#/$defs/optionB': { shared: { 'ui:widget': 'select', 'ui:help': 'Help for B' } },
    };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    const resultA = resolveUiSchema({ $ref: '#/$defs/optionA' }, undefined, reg);
    const resultB = resolveUiSchema({ $ref: '#/$defs/optionB' }, undefined, reg);

    expect(resultA.shared).toEqual({ 'ui:widget': 'textarea', 'ui:help': 'Help for A' });
    expect(resultB.shared).toEqual({ 'ui:widget': 'select', 'ui:help': 'Help for B' });
  });
});

describe('resolveUiSchema() - oneOf/anyOf branch walking', () => {
  it('populates uiSchema.oneOf[i] for branches with $ref matching definitions', () => {
    const schema: RJSFSchema = {
      oneOf: [{ $ref: '#/$defs/optionA' }, { $ref: '#/$defs/optionB' }],
    };
    const definitions = {
      '#/$defs/optionA': { 'ui:title': 'Option A' },
      '#/$defs/optionB': { 'ui:title': 'Option B' },
    };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    const result = resolveUiSchema(schema, undefined, reg);
    expect(result.oneOf).toHaveLength(2);
    expect(result.oneOf[0]).toEqual({ 'ui:title': 'Option A' });
    expect(result.oneOf[1]).toEqual({ 'ui:title': 'Option B' });
  });

  it('merges local uiSchema.oneOf overrides on top of definitions', () => {
    const schema: RJSFSchema = { oneOf: [{ $ref: '#/$defs/node' }] };
    const definitions = { '#/$defs/node': { 'ui:title': 'Default', name: { 'ui:placeholder': 'Name' } } };
    const local: UiSchema = { oneOf: [{ 'ui:title': 'Custom' }] };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    const result = resolveUiSchema(schema, local, reg);
    expect(result.oneOf[0]).toEqual({ 'ui:title': 'Custom', name: { 'ui:placeholder': 'Name' } });
  });

  it('walks oneOf on a resolved schema (via RJSF_REF_KEY from #4967)', () => {
    const resolvedSchema = {
      type: 'object',
      oneOf: [{ $ref: '#/$defs/optA' }, { $ref: '#/$defs/optB' }],
      __rjsf_ref: '#/$defs/parent',
    } as unknown as RJSFSchema;
    const definitions = {
      '#/$defs/parent': { 'ui:title': 'Parent' },
      '#/$defs/optA': { 'ui:title': 'A' },
      '#/$defs/optB': { 'ui:title': 'B' },
    };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    const result = resolveUiSchema(resolvedSchema, undefined, reg);
    expect(result['ui:title']).toBe('Parent');
    expect(result.oneOf).toHaveLength(2);
    expect(result.oneOf[0]).toEqual({ 'ui:title': 'A' });
    expect(result.oneOf[1]).toEqual({ 'ui:title': 'B' });
  });

  it('does not populate uiSchema.oneOf when no options have matching definitions', () => {
    const schema: RJSFSchema = {
      oneOf: [{ type: 'string' }, { type: 'number' }],
    };
    const definitions = { '#/$defs/unrelated': { 'ui:title': 'Unrelated' } };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    const result = resolveUiSchema(schema, undefined, reg);
    expect(result.oneOf).toBeUndefined();
  });

  it('skips options whose $ref is not in definitions', () => {
    const schema: RJSFSchema = {
      oneOf: [{ $ref: '#/$defs/known' }, { $ref: '#/$defs/unknown' }],
    };
    const definitions = { '#/$defs/known': { 'ui:title': 'Known' } };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    const result = resolveUiSchema(schema, undefined, reg);
    expect(result.oneOf[0]).toEqual({ 'ui:title': 'Known' });
    expect(result.oneOf[1]).toBeUndefined();
  });

  it('resolves an unresolved $ref to walk its oneOf branches', () => {
    const schema: RJSFSchema = { $ref: '#/$defs/wrapper' };
    const rootSchema: RJSFSchema = {
      $defs: {
        wrapper: { oneOf: [{ $ref: '#/$defs/optA' }] },
        optA: { type: 'object' },
      },
    };
    const definitions = { '#/$defs/wrapper': { 'ui:title': 'W' }, '#/$defs/optA': { 'ui:title': 'A' } };
    const reg = makeRegistry(rootSchema, definitions);

    const result = resolveUiSchema(schema, undefined, reg);
    expect(result['ui:title']).toBe('W');
    expect(result.oneOf?.[0]).toEqual({ 'ui:title': 'A' });
  });
});

describe('resolveUiSchema()', () => {
  it('returns empty object when no definitions and no local uiSchema', () => {
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, undefined, baseRegistry)).toEqual({});
  });

  it('returns local uiSchema as-is when no definitions', () => {
    const local: UiSchema = { 'ui:placeholder': 'test' };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, local, baseRegistry)).toEqual(local);
  });

  it('returns definition when $ref matches and no local uiSchema', () => {
    const definitions = { '#/$defs/node': { name: { 'ui:placeholder': 'Node name' } } };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, undefined, reg)).toEqual(definitions['#/$defs/node']);
  });

  it('returns definition when $ref matches and local uiSchema is empty object', () => {
    const definitions = { '#/$defs/node': { name: { 'ui:placeholder': 'Node name' } } };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, {}, reg)).toEqual(definitions['#/$defs/node']);
  });

  it('returns local uiSchema when schema has no $ref', () => {
    const definitions = { '#/$defs/node': { name: { 'ui:placeholder': 'Node name' } } };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };
    const local: UiSchema = { 'ui:widget': 'textarea' };
    expect(resolveUiSchema({ type: 'string' } as RJSFSchema, local, reg)).toEqual(local);
  });

  it('returns local uiSchema when $ref has no matching definition', () => {
    const definitions = { '#/$defs/other': { 'ui:title': 'Other' } };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };
    const local: UiSchema = { 'ui:placeholder': 'test' };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, local, reg)).toEqual(local);
  });

  it('returns empty object when $ref has no matching definition and no local uiSchema', () => {
    const definitions = { '#/$defs/other': { 'ui:title': 'Other' } };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, undefined, reg)).toEqual({});
  });

  it('merges local override on top of definition', () => {
    const definitions = {
      '#/$defs/node': { name: { 'ui:placeholder': 'Default' }, children: { 'ui:orderable': false } },
    };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };
    const local: UiSchema = { name: { 'ui:placeholder': 'Override', 'ui:autofocus': true } };

    expect(resolveUiSchema({ $ref: '#/$defs/node' }, local, reg)).toEqual({
      name: { 'ui:placeholder': 'Override', 'ui:autofocus': true },
      children: { 'ui:orderable': false },
    });
  });

  it('deep merges nested properties preserving unoverridden values', () => {
    const definitions = {
      '#/$defs/node': {
        name: { 'ui:placeholder': 'Default', 'ui:disabled': true },
        'ui:order': ['name', 'children'],
      },
    };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };
    const local: UiSchema = { name: { 'ui:placeholder': 'Override' } };

    expect(resolveUiSchema({ $ref: '#/$defs/node' }, local, reg)).toEqual({
      name: { 'ui:placeholder': 'Override', 'ui:disabled': true },
      'ui:order': ['name', 'children'],
    });
  });
});
