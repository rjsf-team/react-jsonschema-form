import { expandUiSchemaDefinitions, Registry, RJSFSchema, resolveUiSchema, TemplatesType, UiSchema } from '../src';

const registry: Registry = {
  formContext: {},
  rootSchema: {},
  schemaUtils: {} as Registry['schemaUtils'],
  translateString: () => '',
  fields: {},
  widgets: {},
  templates: {} as TemplatesType,
  globalFormOptions: { idPrefix: 'root', idSeparator: '_', useFallbackUiForUnsupportedType: false },
};

describe('expandUiSchemaDefinitions()', () => {
  it('returns uiSchema unchanged when no matching definitions', () => {
    const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
    const uiSchema: UiSchema = { name: { 'ui:widget': 'textarea' } };
    const definitions = { '#/$defs/other': { 'ui:title': 'Other' } };

    expect(expandUiSchemaDefinitions(schema, schema, uiSchema, definitions)).toEqual(uiSchema);
  });

  it('expands definitions for $ref at root level', () => {
    const schema: RJSFSchema = { $ref: '#/$defs/address' };
    const rootSchema: RJSFSchema = {
      $defs: { address: { type: 'object', properties: { street: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = {};
    const definitions = { '#/$defs/address': { street: { 'ui:placeholder': 'Enter street' } } };

    expect(expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions)).toEqual({
      street: { 'ui:placeholder': 'Enter street' },
    });
  });

  it('expands definitions for nested $ref in properties', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        home: { $ref: '#/$defs/address' },
      },
    };
    const rootSchema: RJSFSchema = {
      ...schema,
      $defs: { address: { type: 'object', properties: { street: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = {};
    const definitions = { '#/$defs/address': { street: { 'ui:placeholder': 'Enter street' } } };

    expect(expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions)).toEqual({
      home: { street: { 'ui:placeholder': 'Enter street' } },
    });
  });

  it('merges local uiSchema overrides on top of definitions', () => {
    const schema: RJSFSchema = { $ref: '#/$defs/address' };
    const rootSchema: RJSFSchema = {
      $defs: { address: { type: 'object', properties: { street: { type: 'string' }, city: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = { street: { 'ui:placeholder': 'Local override' } };
    const definitions = {
      '#/$defs/address': {
        street: { 'ui:placeholder': 'Default', 'ui:help': 'Help text' },
        city: { 'ui:widget': 'select' },
      },
    };

    expect(expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions)).toEqual({
      street: { 'ui:placeholder': 'Local override', 'ui:help': 'Help text' },
      city: { 'ui:widget': 'select' },
    });
  });

  it('expands definitions for array items with $ref', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: { $ref: '#/$defs/item' },
    };
    const rootSchema: RJSFSchema = {
      ...schema,
      $defs: { item: { type: 'object', properties: { name: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = {};
    const definitions = { '#/$defs/item': { name: { 'ui:placeholder': 'Item name' } } };

    expect(expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions)).toEqual({
      items: { name: { 'ui:placeholder': 'Item name' } },
    });
  });

  it('stops expansion at recursion points for recursive schemas', () => {
    const schema: RJSFSchema = { $ref: '#/$defs/node' };
    const rootSchema: RJSFSchema = {
      $defs: {
        node: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            children: { type: 'array', items: { $ref: '#/$defs/node' } },
          },
        },
      },
    };
    const uiSchema: UiSchema = {};
    const definitions = { '#/$defs/node': { name: { 'ui:placeholder': 'Node name' } } };

    const result = expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions);

    // First level should have the definition applied
    expect(result.name).toEqual({ 'ui:placeholder': 'Node name' });
    // children.items should have definition applied but no embedded ui:definitions
    // (runtime resolution uses registry.uiSchemaDefinitions instead)
    expect(result.children?.items?.name).toEqual({ 'ui:placeholder': 'Node name' });
    expect(result.children?.items?.['ui:definitions']).toBeUndefined();
  });

  it('handles failed $ref resolution gracefully', () => {
    const schema: RJSFSchema = { $ref: '#/$defs/nonexistent' };
    const rootSchema: RJSFSchema = { $defs: {} };
    const uiSchema: UiSchema = { 'ui:title': 'Test' };
    const definitions = { '#/$defs/nonexistent': { 'ui:help': 'Help' } };

    // Should not throw, should return merged result
    const result = expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions);
    expect(result).toEqual({ 'ui:title': 'Test', 'ui:help': 'Help' });
  });

  it('does not process function-type items uiSchema', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: { type: 'string' },
    };
    const uiSchema: UiSchema = { items: () => ({ 'ui:widget': 'textarea' }) };
    const definitions = {};

    const result = expandUiSchemaDefinitions(schema, schema, uiSchema as UiSchema, definitions);
    // The function should be preserved as-is
    expect(typeof result.items).toBe('function');
  });

  it('handles $ref with no matching definition', () => {
    const schema: RJSFSchema = { $ref: '#/$defs/address' };
    const rootSchema: RJSFSchema = {
      $defs: { address: { type: 'object', properties: { street: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = { 'ui:title': 'Local title' };
    const definitions = { '#/$defs/other': { 'ui:help': 'Other help' } };

    // Should preserve uiSchema but not merge anything from definitions
    const result = expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions);
    expect(result).toEqual({ 'ui:title': 'Local title' });
  });

  it('does not add empty property uiSchema to result', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };
    const uiSchema: UiSchema = {};
    const definitions = {};

    const result = expandUiSchemaDefinitions(schema, schema, uiSchema, definitions);
    // name should not be present since no definitions apply and no local uiSchema
    expect(result).toEqual({});
    expect(result.name).toBeUndefined();
  });

  it('does not add empty items uiSchema to result', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: { type: 'string' },
    };
    const uiSchema: UiSchema = {};
    const definitions = {};

    const result = expandUiSchemaDefinitions(schema, schema, uiSchema, definitions);
    // items should not be present since no definitions apply and no local uiSchema
    expect(result).toEqual({});
    expect(result.items).toBeUndefined();
  });

  it('expands definitions for additionalProperties with $ref', () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { $ref: '#/$defs/value' },
    };
    const rootSchema: RJSFSchema = {
      ...schema,
      $defs: { value: { type: 'object', properties: { data: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = {};
    const definitions = { '#/$defs/value': { data: { 'ui:placeholder': 'Enter data' } } };

    expect(expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions)).toEqual({
      additionalProperties: { data: { 'ui:placeholder': 'Enter data' } },
    });
  });

  it('does not add empty additionalProperties uiSchema to result', () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
    };
    const uiSchema: UiSchema = {};
    const definitions = {};

    const result = expandUiSchemaDefinitions(schema, schema, uiSchema, definitions);
    expect(result).toEqual({});
    expect(result.additionalProperties).toBeUndefined();
  });

  it('expands oneOf branches into uiSchema.oneOf array', () => {
    const schema: RJSFSchema = {
      oneOf: [{ $ref: '#/$defs/optionA' }, { $ref: '#/$defs/optionB' }],
    };
    const rootSchema: RJSFSchema = {
      ...schema,
      $defs: {
        optionA: { type: 'object', properties: { name: { type: 'string' } } },
        optionB: { type: 'object', properties: { name: { type: 'string' } } },
      },
    };
    const uiSchema: UiSchema = {};
    const definitions = {
      '#/$defs/optionA': { name: { 'ui:placeholder': 'Name for A' } },
      '#/$defs/optionB': { name: { 'ui:placeholder': 'Name for B' } },
    };

    const result = expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions);
    // Each branch should have its own uiSchema in the oneOf array
    expect(result.oneOf).toHaveLength(2);
    expect(result.oneOf[0]).toEqual({ name: { 'ui:placeholder': 'Name for A' } });
    expect(result.oneOf[1]).toEqual({ name: { 'ui:placeholder': 'Name for B' } });
    // Root should not have merged properties
    expect(result.name).toBeUndefined();
  });

  it('expands anyOf and allOf branches into respective arrays', () => {
    const schema: RJSFSchema = {
      anyOf: [{ $ref: '#/$defs/option' }],
      allOf: [{ $ref: '#/$defs/base' }],
    };
    const rootSchema: RJSFSchema = {
      ...schema,
      $defs: {
        option: { type: 'object', properties: { a: { type: 'string' } } },
        base: { type: 'object', properties: { b: { type: 'string' } } },
      },
    };
    const uiSchema: UiSchema = {};
    const definitions = {
      '#/$defs/option': { a: { 'ui:placeholder': 'A' } },
      '#/$defs/base': { b: { 'ui:placeholder': 'B' } },
    };

    const result = expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions);
    expect(result.anyOf).toHaveLength(1);
    expect(result.anyOf[0]).toEqual({ a: { 'ui:placeholder': 'A' } });
    expect(result.allOf).toHaveLength(1);
    expect(result.allOf[0]).toEqual({ b: { 'ui:placeholder': 'B' } });
  });

  it('preserves existing uiSchema.oneOf array and merges with definitions', () => {
    const schema: RJSFSchema = {
      oneOf: [{ $ref: '#/$defs/optionA' }, { $ref: '#/$defs/optionB' }],
    };
    const rootSchema: RJSFSchema = {
      ...schema,
      $defs: {
        optionA: { type: 'object', properties: { name: { type: 'string' } } },
        optionB: { type: 'object', properties: { name: { type: 'string' } } },
      },
    };
    const uiSchema: UiSchema = {
      oneOf: [{ 'ui:title': 'Custom A' }],
    };
    const definitions = {
      '#/$defs/optionA': { name: { 'ui:placeholder': 'Name for A' } },
      '#/$defs/optionB': { name: { 'ui:placeholder': 'Name for B' } },
    };

    const result = expandUiSchemaDefinitions(schema, rootSchema, uiSchema, definitions);
    expect(result.oneOf).toHaveLength(2);
    // First option has local override merged with definition
    expect(result.oneOf[0]).toEqual({ 'ui:title': 'Custom A', name: { 'ui:placeholder': 'Name for A' } });
    // Second option only has definition
    expect(result.oneOf[1]).toEqual({ name: { 'ui:placeholder': 'Name for B' } });
  });

  it('does not add empty oneOf array when no matching definitions', () => {
    const schema: RJSFSchema = {
      oneOf: [{ type: 'string' }, { type: 'number' }],
    };
    const uiSchema: UiSchema = {};
    const definitions = { '#/$defs/other': { 'ui:help': 'Other' } };

    const result = expandUiSchemaDefinitions(schema, schema, uiSchema, definitions);
    expect(result.oneOf).toBeUndefined();
  });
});

describe('resolveUiSchema() - branching keyword runtime resolution', () => {
  it('resolves correct definition for oneOf branch A at runtime', () => {
    const definitions = {
      '#/$defs/optionA': { name: { 'ui:placeholder': 'Name for A' } },
      '#/$defs/optionB': { name: { 'ui:placeholder': 'Name for B' } },
    };
    const reg = { ...registry, uiSchemaDefinitions: definitions };

    // When optionA branch is selected, SchemaField receives its $ref
    const result = resolveUiSchema({ $ref: '#/$defs/optionA' }, undefined, reg);
    expect(result.name).toEqual({ 'ui:placeholder': 'Name for A' });
  });

  it('resolves correct definition for oneOf branch B at runtime', () => {
    const definitions = {
      '#/$defs/optionA': { name: { 'ui:placeholder': 'Name for A' } },
      '#/$defs/optionB': { name: { 'ui:placeholder': 'Name for B' } },
    };
    const reg = { ...registry, uiSchemaDefinitions: definitions };

    // When optionB branch is selected, SchemaField receives its $ref
    const result = resolveUiSchema({ $ref: '#/$defs/optionB' }, undefined, reg);
    expect(result.name).toEqual({ 'ui:placeholder': 'Name for B' });
  });

  it('each branch gets distinct uiSchema for same property name', () => {
    const definitions = {
      '#/$defs/optionA': { shared: { 'ui:widget': 'textarea', 'ui:help': 'Help for A' } },
      '#/$defs/optionB': { shared: { 'ui:widget': 'select', 'ui:help': 'Help for B' } },
    };
    const reg = { ...registry, uiSchemaDefinitions: definitions };

    const resultA = resolveUiSchema({ $ref: '#/$defs/optionA' }, undefined, reg);
    const resultB = resolveUiSchema({ $ref: '#/$defs/optionB' }, undefined, reg);

    expect(resultA.shared).toEqual({ 'ui:widget': 'textarea', 'ui:help': 'Help for A' });
    expect(resultB.shared).toEqual({ 'ui:widget': 'select', 'ui:help': 'Help for B' });
  });
});

describe('resolveUiSchema()', () => {
  it('returns empty object when no definitions and no local uiSchema', () => {
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, undefined, registry)).toEqual({});
  });

  it('returns local uiSchema as-is when no definitions', () => {
    const local: UiSchema = { 'ui:placeholder': 'test' };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, local, registry)).toEqual(local);
  });

  it('returns definition when $ref matches and no local uiSchema', () => {
    const definitions = { '#/$defs/node': { name: { 'ui:placeholder': 'Node name' } } };
    const reg = { ...registry, uiSchemaDefinitions: definitions };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, undefined, reg)).toEqual(definitions['#/$defs/node']);
  });

  it('returns definition when $ref matches and local uiSchema is empty object', () => {
    const definitions = { '#/$defs/node': { name: { 'ui:placeholder': 'Node name' } } };
    const reg = { ...registry, uiSchemaDefinitions: definitions };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, {}, reg)).toEqual(definitions['#/$defs/node']);
  });

  it('returns local uiSchema when schema has no $ref', () => {
    const definitions = { '#/$defs/node': { name: { 'ui:placeholder': 'Node name' } } };
    const reg = { ...registry, uiSchemaDefinitions: definitions };
    const local: UiSchema = { 'ui:widget': 'textarea' };
    expect(resolveUiSchema({ type: 'string' } as RJSFSchema, local, reg)).toEqual(local);
  });

  it('returns local uiSchema when $ref has no matching definition', () => {
    const definitions = { '#/$defs/other': { 'ui:title': 'Other' } };
    const reg = { ...registry, uiSchemaDefinitions: definitions };
    const local: UiSchema = { 'ui:placeholder': 'test' };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, local, reg)).toEqual(local);
  });

  it('returns empty object when $ref has no matching definition and no local uiSchema', () => {
    const definitions = { '#/$defs/other': { 'ui:title': 'Other' } };
    const reg = { ...registry, uiSchemaDefinitions: definitions };
    expect(resolveUiSchema({ $ref: '#/$defs/node' }, undefined, reg)).toEqual({});
  });

  it('merges local override on top of definition', () => {
    const definitions = {
      '#/$defs/node': { name: { 'ui:placeholder': 'Default' }, children: { 'ui:orderable': false } },
    };
    const reg = { ...registry, uiSchemaDefinitions: definitions };
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
    const reg = { ...registry, uiSchemaDefinitions: definitions };
    const local: UiSchema = { name: { 'ui:placeholder': 'Override' } };

    expect(resolveUiSchema({ $ref: '#/$defs/node' }, local, reg)).toEqual({
      name: { 'ui:placeholder': 'Override', 'ui:disabled': true },
      'ui:order': ['name', 'children'],
    });
  });
});
