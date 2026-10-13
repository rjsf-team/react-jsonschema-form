import type { Registry, RJSFSchema, TemplatesType, UiSchema, UiSchemaDefinitions } from '../src/index.ts';
import { createSchemaUtils, RJSF_REF_KEY, RJSF_SOURCE_REF_KEY, noop, resolveUiSchema } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const testValidator = getTestValidator({});

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(noop);
});
afterEach(() => {
  vi.restoreAllMocks();
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

describe('resolveUiSchema() - normalized options', () => {
  it('applies ui:definitions to unexpanded anyOf options keyed by the author spelling of their $ref', () => {
    // An unexpanded option carries no ref markers; its object comes from the normalized root with an absolute
    // `$ref`, so the author spelling a `ui:definitions` entry is keyed by is recovered through `originalRefOf`
    const root: RJSFSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://ex.com/r.json',
      definitions: {
        a: { anyOf: [{ $ref: '#/definitions/b' }] },
        b: { type: 'string' },
      },
      properties: { x: { $ref: '#/definitions/a' } },
    };
    const registry = makeRegistry(root, { '#/definitions/b': { 'ui:title': 'from-def' } });
    const utils = createSchemaUtils({ validator: testValidator }, root);
    const resolved = utils.retrieveSchema(root.properties!.x as RJSFSchema, root);
    const result = resolveUiSchema(resolved, undefined, registry);
    expect(result.anyOf).toEqual([{ 'ui:title': 'from-def' }]);
  });
  it('applies ui:definitions to expanded anyOf options keyed by the author spelling of their $ref', () => {
    // An expanded option is a new object: `originalRefOf` misses it and `resolvedFromRef` returns the
    // resolved spelling, so the author spelling a `ui:definitions` entry is keyed by comes from `sourceRefOf`
    const root: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://x.com/root.json',
      $defs: { a: { type: 'string', title: 'A' } },
      properties: { p: { anyOf: [{ $ref: '#/$defs/a' }] } },
    };
    const utils = createSchemaUtils({ validator: testValidator }, root);
    const expanded = utils.retrieveSchema(root.properties!.p as RJSFSchema, undefined, true);
    const registry = makeRegistry(root, { '#/$defs/a': { 'ui:title': 'from-def' } });
    const result = resolveUiSchema(expanded, undefined, registry);
    expect(result).toEqual({ anyOf: [{ 'ui:title': 'from-def' }] });
  });
});

it('skips undefined options when matching anyOf ui:definitions', () => {
  const registry = makeRegistry({}, { '#/definitions/b': { 'ui:title': 'from-def' } });
  const result = resolveUiSchema(
    { anyOf: [undefined as unknown as RJSFSchema, { $ref: '#/definitions/b' }] },
    undefined,
    registry,
  );
  expect(result.anyOf).toEqual([undefined, { 'ui:title': 'from-def' }]);
});

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

describe('resolveUiSchema() - author-spelled ref marker', () => {
  it('looks ui:definitions up by the spelling the author wrote when the walk carried a rewritten ref', () => {
    // A schema resolved from a normalized root carries the resolved ref as RJSF_REF_KEY and the author's
    // spelling as RJSF_SOURCE_REF_KEY; `ui:definitions` are keyed by what the author wrote
    const definitions = { '#/$defs/optionA': { name: { 'ui:placeholder': 'Name for A' } } };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };
    const schema = {
      type: 'object',
      [RJSF_REF_KEY]: 'https://example.com/root.json#/$defs/optionA',
      [RJSF_SOURCE_REF_KEY]: '#/$defs/optionA',
    } as unknown as RJSFSchema;
    const result = resolveUiSchema(schema, undefined, reg);
    expect(result.name).toEqual({ 'ui:placeholder': 'Name for A' });
  });
});

describe('resolveUiSchema() - non-object local uiSchema', () => {
  // Only untyped JavaScript can put a non-object here, so these stand in for a caller the types never saw
  it.each([
    ['a string', 'oops'],
    ['a number', 42],
    ['an array', ['oops']],
    ['true', true],
  ])(
    'replaces %s with an empty uiSchema, so every consumer can treat its own uiSchema as an object',
    (_label, value) => {
      const schema: RJSFSchema = { type: 'string' };

      expect(resolveUiSchema(schema, value as unknown as UiSchema, baseRegistry)).toEqual({});
    },
  );

  it.each([
    ['a string', 'oops'],
    ['a number', 42],
    ['null', null],
    ['true', true],
  ])("drops a `ui:options` that is %s, leaving the caller's uiSchema untouched", (_label, value) => {
    const schema: RJSFSchema = { type: 'string' };
    const local = { 'ui:widget': 'textarea', 'ui:options': value } as unknown as UiSchema;

    expect(resolveUiSchema(schema, local, baseRegistry)).toEqual({ 'ui:widget': 'textarea' });
    expect(local).toHaveProperty('ui:options', value);
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
    expect(result.oneOf).toEqual([{ 'ui:title': 'Option A' }, { 'ui:title': 'Option B' }]);
  });

  it('merges local uiSchema.oneOf overrides on top of definitions', () => {
    const schema: RJSFSchema = { oneOf: [{ $ref: '#/$defs/node' }] };
    const definitions = { '#/$defs/node': { 'ui:title': 'Default', name: { 'ui:placeholder': 'Name' } } };
    const local: UiSchema = { oneOf: [{ 'ui:title': 'Custom' }] };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    const result = resolveUiSchema(schema, local, reg);
    expect(result.oneOf).toEqual([{ 'ui:title': 'Custom', name: { 'ui:placeholder': 'Name' } }]);
  });

  it('walks oneOf on a resolved schema (via RJSF_REF_KEY from #4967)', () => {
    const resolvedSchema = {
      type: 'object',
      oneOf: [{ $ref: '#/$defs/optA' }, { $ref: '#/$defs/optB' }],
      [RJSF_REF_KEY]: '#/$defs/parent',
    } as unknown as RJSFSchema;
    const definitions = {
      '#/$defs/parent': { 'ui:title': 'Parent' },
      '#/$defs/optA': { 'ui:title': 'A' },
      '#/$defs/optB': { 'ui:title': 'B' },
    };
    const reg = { ...baseRegistry, uiSchemaDefinitions: definitions };

    const result = resolveUiSchema(resolvedSchema, undefined, reg);
    expect(result['ui:title']).toBe('Parent');
    expect(result.oneOf).toEqual([{ 'ui:title': 'A' }, { 'ui:title': 'B' }]);
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
    expect(result.oneOf).toEqual([{ 'ui:title': 'Known' }]);
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
    expect(resolveUiSchema({ type: 'string' }, local, reg)).toEqual(local);
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
