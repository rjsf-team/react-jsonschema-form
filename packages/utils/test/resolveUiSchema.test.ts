import type {
  MergedClassMap,
  Registry,
  RJSFSchema,
  TemplatesType,
  UiSchema,
  UiSchemaDefinitions,
  ValidatorType,
} from '../src/index.ts';
import {
  createSchemaUtils,
  mergeOptionDefinitions,
  mergeThemePresentation,
  noop,
  resolveUiSchema,
  retrieveSchema,
  RJSF_REF_KEY,
  UI_DEFINITION_ORIGIN_KEY,
} from '../src/index.ts';
import looseSchema from './schema/graph/looseSchema.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

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
  presentation: mergeThemePresentation(),
  classMap: {} as MergedClassMap,
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

describe('resolveUiSchema() - definitions composed through allOf', () => {
  const rootSchema: RJSFSchema = {
    definitions: {
      B: { type: 'object', properties: { n: { type: 'string' } } },
      A: { allOf: [{ $ref: '#/definitions/B' }], properties: { m: { type: 'string' } } },
    },
    type: 'array',
    items: { $ref: '#/definitions/A' },
  };
  const definitions: UiSchemaDefinitions = {
    '#/definitions/B': { 'ui:title': 'FROM_B', 'ui:help': 'HELP_B' },
    '#/definitions/A': { 'ui:description': 'FROM_A', 'ui:help': 'HELP_A' },
  };
  const validator: ValidatorType = {
    validateFormData: () => ({ errors: [], errorSchema: {} }),
    isValid: () => true,
    rawValidation: () => ({}),
  };

  it('applies only the entry of the $ref the field was resolved from, not those of the definitions it composes', () => {
    const { items } = retrieveSchema({ validator }, rootSchema, rootSchema);
    const handedOut: RJSFSchema = typeof items === 'object' && !Array.isArray(items) ? items : {};
    const resolved = retrieveSchema({ validator }, handedOut, rootSchema);
    const fromA = { 'ui:description': 'FROM_A', 'ui:help': 'HELP_A' };
    expect(resolveUiSchema(handedOut, undefined, makeRegistry(rootSchema, definitions))).toEqual(fromA);
    expect(resolveUiSchema(resolved, undefined, makeRegistry(rootSchema, definitions))).toEqual(fromA);
    expect(
      resolveUiSchema({ allOf: [{ $ref: '#/definitions/B' }] }, undefined, makeRegistry(rootSchema, definitions)),
    ).toEqual({});
  });
  it('applies the entry of the definition an extra key of the data names through its additionalProperties', () => {
    const mapSchema: RJSFSchema = {
      definitions: { A: { allOf: [{ type: 'object', properties: { a: { type: 'string' } } }] } },
      type: 'object',
      additionalProperties: { $ref: '#/definitions/A' },
    };
    const { properties } = retrieveSchema({ validator }, mapSchema, mapSchema, { k: {} });
    const handedOut: RJSFSchema = typeof properties?.k === 'object' ? properties.k : {};
    const resolved = retrieveSchema({ validator }, handedOut, mapSchema, {});
    expect(Reflect.get(resolved, RJSF_REF_KEY)).toBe('#/definitions/A');
    expect(
      resolveUiSchema(
        resolved,
        undefined,
        makeRegistry(mapSchema, { '#/definitions/A': { 'ui:description': 'FROM_A' } }),
      ),
    ).toEqual({ 'ui:description': 'FROM_A' });
  });
});

describe('resolveUiSchema() - option walk through the schema graph', () => {
  const optionDefinitions: UiSchemaDefinitions = { '#/$defs/leaf': { 'ui:title': 'Leaf' } };

  it('walks the options of a definition an $anchor names, without a warning', () => {
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: {
        node: looseSchema({ $anchor: 'nd', oneOf: [{ $ref: '#/$defs/leaf' }] }),
        leaf: { type: 'string' },
      },
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop);
    const result = resolveUiSchema({ $ref: '#nd' }, undefined, makeRegistry(rootSchema, optionDefinitions));
    expect(result.oneOf).toEqual([{ 'ui:title': 'Leaf' }]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('walks the options of the definition a chain of aliases leads to', () => {
    const rootSchema: RJSFSchema = {
      $defs: { alias: { $ref: '#/$defs/node' }, node: { anyOf: [{ $ref: '#/$defs/leaf' }] }, leaf: { type: 'string' } },
    };
    const result = resolveUiSchema({ $ref: '#/$defs/alias' }, undefined, makeRegistry(rootSchema, optionDefinitions));
    expect(result.anyOf).toEqual([{ 'ui:title': 'Leaf' }]);
  });

  it('walks the options of the definition an alias with sibling keywords leads to', () => {
    const rootSchema: RJSFSchema = {
      $defs: {
        alias: { $ref: '#/$defs/node', type: 'string', minLength: 1 },
        node: { oneOf: [{ $ref: '#/$defs/leaf' }, { type: 'string' }] },
        leaf: { type: 'string' },
      },
    };
    const result = resolveUiSchema({ $ref: '#/$defs/alias' }, undefined, makeRegistry(rootSchema, optionDefinitions));
    expect(result.oneOf).toEqual([{ 'ui:title': 'Leaf' }]);
  });

  it('walks the options of the definition a $ref with constraints beside it names, as the allOf of both', () => {
    const field: RJSFSchema = { $ref: '#/$defs/node', type: 'string' };
    const rootSchema: RJSFSchema = {
      $defs: { node: { oneOf: [{ $ref: '#/$defs/leaf' }, { type: 'string' }] }, leaf: { type: 'string' } },
      properties: { field },
    };
    const result = resolveUiSchema(field, undefined, makeRegistry(rootSchema, optionDefinitions));
    expect(result.oneOf).toEqual([{ 'ui:title': 'Leaf' }]);
  });

  it('walks the options of a $ref under a relative root $id from the root createSchemaUtils() hands out', () => {
    const field: RJSFSchema = { $ref: 'child.json' };
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'nested/root.json',
      $defs: { child: { $id: 'child.json', oneOf: [{ $ref: '#/$defs/leaf' }], $defs: { leaf: { type: 'string' } } } },
      properties: { field },
    };
    const schemaUtils = createSchemaUtils({ validator: getTestValidator({}) }, rootSchema);
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop);
    const result = resolveUiSchema(field, undefined, makeRegistry(schemaUtils.getRootSchema(), optionDefinitions));
    expect(result.oneOf).toEqual([{ 'ui:title': 'Leaf' }]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('walks the options of a 2020-12 $ref beside only annotations, as of one beside nothing', () => {
    const field: RJSFSchema = { $ref: '#/$defs/node', title: 'Node' };
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: { node: { oneOf: [{ $ref: '#/$defs/leaf' }, { type: 'number' }] }, leaf: { type: 'string' } },
      properties: { field },
    };
    const result = resolveUiSchema(field, undefined, makeRegistry(rootSchema, optionDefinitions));
    expect(result.oneOf).toEqual([{ 'ui:title': 'Leaf' }]);
  });
});

describe('resolveUiSchema() - the definition origin it records', () => {
  const Foo = { type: 'object', properties: { b: { type: 'string' } } } satisfies RJSFSchema;
  const rootSchema: RJSFSchema = { $defs: { Foo } };
  const definition: UiSchema = { 'ui:title': 'Foo' };

  it("records the definition and the field's own entry, where it merges one under the other", () => {
    const local: UiSchema = { 'ui:description': 'Mine' };
    const result = resolveUiSchema(
      { $ref: '#/$defs/Foo' },
      local,
      makeRegistry(rootSchema, { '#/$defs/Foo': definition }),
    );
    expect(Reflect.get(result, UI_DEFINITION_ORIGIN_KEY)).toEqual({ ref: '#/$defs/Foo', local, definition });
    // Not enumerable, so a spread or a comparison with an entry written by hand doesn't see it
    expect(result).toEqual({ 'ui:title': 'Foo', 'ui:description': 'Mine' });
    expect(Reflect.get({ ...result }, UI_DEFINITION_ORIGIN_KEY)).toBeUndefined();
  });

  it("records an option's own entry as the uiSchema gives it, without changing the caller's uiSchema", () => {
    const optionEntry: UiSchema = { 'ui:description': 'Mine' };
    const uiSchema: UiSchema = { anyOf: [optionEntry] };
    const registry = makeRegistry(rootSchema, { '#/$defs/Foo': definition });
    const schema: RJSFSchema = { anyOf: [{ $ref: '#/$defs/Foo' }] };
    const first = resolveUiSchema(schema, uiSchema, registry);
    const second = resolveUiSchema(schema, uiSchema, registry);
    expect(uiSchema).toEqual({ anyOf: [optionEntry] });
    expect(Reflect.get(second.anyOf?.[0] ?? {}, UI_DEFINITION_ORIGIN_KEY)).toEqual({
      ref: '#/$defs/Foo',
      local: optionEntry,
      definition,
    });
    expect(first.anyOf).toEqual(second.anyOf);
    // The field merges no definition of its own, so it records none
    expect(Reflect.get(second, UI_DEFINITION_ORIGIN_KEY)).toBeUndefined();
  });
});

describe('resolveUiSchema() - the options of an allOf member', () => {
  const fooOrBar = { anyOf: [{ $ref: '#/$defs/Foo' }, { $ref: '#/$defs/Bar' }] };
  const $defs: RJSFSchema['$defs'] = {
    Foo: { type: 'object', properties: { c: { type: 'string' } } },
    Bar: { type: 'number' },
    FooOrBar: fooOrBar,
    Loop: { allOf: [{ $ref: '#/$defs/Loop' }] },
  };
  const definitions = { '#/$defs/Foo': { 'ui:title': 'Foo' }, '#/$defs/Bar': { 'ui:title': 'Bar' } };

  it.each<[string, RJSFSchema]>([
    ['inline', { allOf: [fooOrBar] }],
    ['named by a $ref', { allOf: [{ $ref: '#/$defs/FooOrBar' }] }],
    ['in a nested allOf', { allOf: [{ allOf: [fooOrBar] }] }],
    ['beside a member that loops back to itself', { allOf: [{ $ref: '#/$defs/Loop' }, fooOrBar] }],
    ['beside a boolean member', { allOf: [true, fooOrBar] }],
    ['beside a then branch offering none', { allOf: [fooOrBar], if: { type: 'object' }, then: { required: ['c'] } }],
  ])('merges the definitions of the options a member offers %s', (_label, schema) => {
    const rootSchema: RJSFSchema = { $defs, ...schema };
    const local: UiSchema = { anyOf: [{ 'ui:description': 'Mine' }] };
    const result = resolveUiSchema(rootSchema, local, makeRegistry(rootSchema, definitions));
    expect(result.anyOf).toEqual([{ 'ui:title': 'Foo', 'ui:description': 'Mine' }, { 'ui:title': 'Bar' }]);
    expect(Reflect.get(result.anyOf![0], UI_DEFINITION_ORIGIN_KEY)).toMatchObject({ ref: '#/$defs/Foo' });
    expect(local).toEqual({ anyOf: [{ 'ui:description': 'Mine' }] });
  });

  const other: RJSFSchema = { anyOf: [{ type: 'string' }] };
  it.each<[string, RJSFSchema]>([
    ['two members', { allOf: [fooOrBar, fooOrBar] }],
    ['the field and a member', { ...fooOrBar, allOf: [fooOrBar] }],
    ['a member and a then branch', { allOf: [fooOrBar], if: { type: 'object' }, then: other }],
    [
      'a member and a then branch naming its $ref',
      { allOf: [{ $ref: '#/$defs/FooOrBar' }], if: { type: 'object' }, then: { $ref: '#/$defs/FooOrBar' } },
    ],
    [
      'a nested member and a then branch naming its $ref',
      {
        allOf: [{ allOf: [{ $ref: '#/$defs/FooOrBar' }] }],
        if: { type: 'object' },
        then: { $ref: '#/$defs/FooOrBar' },
      },
    ],
    ['the field and an else branch', { ...fooOrBar, if: { type: 'object' }, then: {}, else: other }],
    ['the field and a dependencies entry', { ...fooOrBar, dependencies: { c: other, d: ['c'] } }],
  ])('merges none where %s offer a list, whose positions the merged list need not keep', (_label, schema) => {
    const rootSchema: RJSFSchema = { $defs, ...schema };
    expect(resolveUiSchema(rootSchema, undefined, makeRegistry(rootSchema, definitions))).toEqual({});
  });

  const fooOrBarOneOf = { oneOf: fooOrBar.anyOf };
  const pickA: RJSFSchema = { properties: { k: { const: 'a' } } };
  const pickB: RJSFSchema = { properties: { k: { const: 'b' }, e: { type: 'string' } } };
  const picks = {
    PickA: pickA,
    PickB: pickB,
    Picks: { oneOf: [pickA, pickB] },
    Shared: { type: 'object' },
  } satisfies RJSFSchema['$defs'];
  const picksRef = { $ref: '#/$defs/Picks' };
  it.each<[string, RJSFSchema]>([
    ['inline', { oneOf: [pickA, pickB] }],
    ['named by a $ref', { $ref: '#/$defs/Picks' }],
    ['whose options are named by $refs', { oneOf: [false, { $ref: '#/$defs/PickA' }, { $ref: '#/$defs/PickB' }] }],
    ['whose option loops back to itself', { oneOf: [pickA, { ...pickB, allOf: [{ $ref: '#/$defs/Loop' }] }] }],
  ])("merges a member's options beside a dependencies entry whose oneOf picks the branch, %s", (_label, entry) => {
    const rootSchema: RJSFSchema = {
      $defs: { ...$defs, ...picks },
      type: 'object',
      properties: { k: { type: 'string', enum: ['a', 'b'] } },
      allOf: [fooOrBarOneOf],
      dependencies: { k: entry },
    };
    const result = resolveUiSchema(rootSchema, undefined, makeRegistry(rootSchema, definitions));
    expect(result.oneOf).toEqual([{ 'ui:title': 'Foo' }, { 'ui:title': 'Bar' }]);
  });

  it.each<[string, RJSFSchema['dependencies']]>([
    ["an entry's oneOf no option of which declares its key", { k: { oneOf: [{ properties: { e: {} } }] } }],
    ['an option the oneOf picks', { k: { oneOf: [pickA, { ...pickB, oneOf: [{ type: 'string' }] }] } }],
    ['an entry under a key its shared oneOf declares and one it does not', { k: picks.Picks, other: picks.Picks }],
    ['a $ref entry under a key its oneOf declares and then one it does not', { k: picksRef, other: picksRef }],
    [
      'the second option of two naming the same $ref',
      {
        k: {
          oneOf: [
            { $ref: '#/$defs/Shared', ...pickA },
            { $ref: '#/$defs/Shared', ...pickB, oneOf: [{ type: 'string' }, { type: 'number' }] },
          ],
        },
      },
    ],
  ])("merges none of a member's oneOf options where %s offers a oneOf list", (_label, dependencies) => {
    const rootSchema: RJSFSchema = { $defs: { ...$defs, ...picks }, allOf: [fooOrBarOneOf], dependencies };
    expect(resolveUiSchema(rootSchema, undefined, makeRegistry(rootSchema, definitions))).toEqual({});
  });

  it("merges none of a member's anyOf options where an option a dependencies entry's oneOf picks offers an anyOf", () => {
    const rootSchema: RJSFSchema = {
      $defs,
      allOf: [fooOrBar],
      dependencies: { k: { oneOf: [pickA, { ...pickB, anyOf: [{ type: 'string' }] }] } },
    };
    expect(resolveUiSchema(rootSchema, undefined, makeRegistry(rootSchema, definitions))).toEqual({});
  });

  it("merges the field's own options where its allOf loops back to the definition it is", () => {
    const rootSchema: RJSFSchema = { $defs: { ...$defs, Node: { ...fooOrBar, allOf: [{ $ref: '#/$defs/Node' }] } } };
    const result = resolveUiSchema({ $ref: '#/$defs/Node' }, undefined, makeRegistry(rootSchema, definitions));
    expect(result.anyOf).toEqual([{ 'ui:title': 'Foo' }, { 'ui:title': 'Bar' }]);
  });

  it.each<[string, RJSFSchema['$defs'], string]>([
    ['the field is named by an alias of', { Alias: { $ref: '#/$defs/Node' } }, '#/$defs/Alias'],
    [
      'its allOf loops back through an alias to',
      { Node: { ...fooOrBar, allOf: [{ $ref: '#/$defs/Alias' }] }, Alias: { $ref: '#/$defs/Node' } },
      '#/$defs/Node',
    ],
  ])("merges the field's own options where %s the definition it is", (_label, extra, ref) => {
    const rootSchema: RJSFSchema = {
      $defs: { ...$defs, Node: { ...fooOrBar, allOf: [{ $ref: '#/$defs/Node' }] }, ...extra },
    };
    const result = resolveUiSchema({ $ref: ref }, undefined, makeRegistry(rootSchema, definitions));
    expect(result.anyOf).toEqual([{ 'ui:title': 'Foo' }, { 'ui:title': 'Bar' }]);
  });

  it('reads a boolean schema, which a field can be handed, as offering no options', () => {
    // A field's schema can be `true`, which the schema types don't admit
    const schema = true as unknown as RJSFSchema;
    expect(resolveUiSchema(schema, undefined, makeRegistry({}, definitions))).toEqual({});
  });

  it('skips a member whose $ref names nothing', () => {
    const rootSchema: RJSFSchema = { $defs, allOf: [{ $ref: '#/$defs/Missing' }, fooOrBar] };
    const result = resolveUiSchema(rootSchema, undefined, makeRegistry(rootSchema, definitions));
    expect(result.anyOf).toEqual([{ 'ui:title': 'Foo' }, { 'ui:title': 'Bar' }]);
  });
});

describe('mergeOptionDefinitions()', () => {
  const registry = makeRegistry({}, { '#/$defs/Foo': { 'ui:title': 'Foo' }, '#/$defs/Bar': { 'ui:title': 'Bar' } });

  it('merges and records the definition of each option with no record, keeping the entries it is given', () => {
    const given: UiSchema[] = [{ 'ui:description': 'Mine' }];
    const merged = mergeOptionDefinitions(['#/$defs/Foo', null, '#/$defs/Bar'], given, registry);
    expect(merged).toEqual([{ 'ui:title': 'Foo', 'ui:description': 'Mine' }, undefined, { 'ui:title': 'Bar' }]);
    expect(Reflect.get(merged[0], UI_DEFINITION_ORIGIN_KEY)).toEqual({
      ref: '#/$defs/Foo',
      local: given[0],
      definition: { 'ui:title': 'Foo' },
    });
    expect(given).toEqual([{ 'ui:description': 'Mine' }]);
  });

  it('returns the entries it is given where there is nothing to merge', () => {
    const recorded = resolveUiSchema({ $ref: '#/$defs/Foo' }, {}, registry);
    const given: UiSchema[] = [recorded, {}];
    expect(mergeOptionDefinitions(['#/$defs/Foo', '#/$defs/Missing'], given, registry)).toBe(given);
    expect(mergeOptionDefinitions(['#/$defs/Foo'], given, makeRegistry({}, undefined))).toBe(given);
  });
});
