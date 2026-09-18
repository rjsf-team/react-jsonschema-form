import type { RJSFSchema, UiSchema } from '../../src/index.ts';
import { getUiRequiredErrorSchema, toErrorList } from '../../src/index.ts';
import getTestValidator from '../testUtils/getTestValidator.ts';

const testValidator = getTestValidator({});

describe('getUiRequiredErrorSchema()', () => {
  it('returns an empty error schema when no ui:required is set anywhere', () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const uiSchema: UiSchema = { foo: { 'ui:widget': 'textarea' } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { foo: 'x' });
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('returns an empty error schema when uiSchema is undefined', () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, undefined, {});
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('reports a missing top-level ui:required field', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.nick');
    expect(errors[0].message).toBe("must have required property 'nick'");
  });

  it('does not report a ui:required field that has a value', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { nick: 'Chuck' });
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('ignores ui:required: false', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    const uiSchema: UiSchema = { nick: { 'ui:required': false } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('does not duplicate a schema-required error when the same field is also ui:required: true', () => {
    const schema: RJSFSchema = { type: 'object', required: ['nick'], properties: { nick: { type: 'string' } } };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('still reports a schema-required, ui:required field when its parent object is entirely absent, since AJV never validates a missing property against its own required list', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        addr: { type: 'object', required: ['zip'], properties: { zip: { type: 'string' } } },
      },
    };
    const uiSchema: UiSchema = { addr: { zip: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.addr.zip');
  });

  it('does not check ui:required at the root path itself', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    // 'ui:required' isn't a real uiSchema key at the root, but even if present it must not be checked at path []
    const uiSchema = { 'ui:required': true } as unknown as UiSchema;
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('reports a missing deeply nested ui:required field', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        a: { type: 'object', properties: { b: { type: 'object', properties: { c: { type: 'string' } } } } },
      },
    };
    const uiSchema: UiSchema = { a: { b: { c: { 'ui:required': true } } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { a: { b: {} } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.a.b.c');
  });

  it('reports a missing nested ui:required field when an ancestor object is entirely absent from formData', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        a: { type: 'object', properties: { b: { type: 'object', properties: { c: { type: 'string' } } } } },
      },
    };
    const uiSchema: UiSchema = { a: { b: { c: { 'ui:required': true } } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.a.b.c');
  });

  it('walks into an object schema with no properties without erroring', () => {
    // A satisfied, unrelated ui:required keeps the top-level short-circuit from skipping the walk entirely, so this
    // still exercises the "no properties" branch it's meant to check.
    const schema: RJSFSchema = { type: 'object', properties: { empty: { type: 'object' }, nick: { type: 'string' } } };
    const uiSchema: UiSchema = { empty: { 'ui:widget': 'someWidget' }, nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { empty: {}, nick: 'x' });
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('skips a boolean sub-schema property without erroring', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { flag: true as unknown as RJSFSchema, nick: { type: 'string' } },
    };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.nick');
  });

  it('reports a ui:required field only introduced by a schema-form dependency', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' } },
      dependencies: { a: { properties: { b: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = { b: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { a: 'x' });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.b');
  });

  it('reports a ui:required field declared through a nested allOf', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        address: {
          allOf: [
            { type: 'object', properties: { street: { type: 'string' } } },
            { type: 'object', properties: { city: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { address: { street: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { address: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.address.street');
  });

  it('reports a ui:required field declared under a nested $ref', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Address: { type: 'object', properties: { street: { type: 'string' } } } },
      properties: { address: { $ref: '#/definitions/Address' } },
    };
    const uiSchema: UiSchema = { address: { street: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { address: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.address.street');
  });

  it('reports a ui:required field on a $ref-rooted schema', () => {
    const schema: RJSFSchema = {
      definitions: { Person: { type: 'object', properties: { nick: { type: 'string' } } } },
      $ref: '#/definitions/Person',
    };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.nick');
  });

  it('reports a ui:required field declared in a ui:definitions fragment', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Address: { type: 'object', properties: { zip: { type: 'string' } } } },
      properties: { home: { $ref: '#/definitions/Address' } },
    };
    const uiSchema: UiSchema = {
      'ui:definitions': { '#/definitions/Address': { zip: { 'ui:required': true } } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { home: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.home.zip');
  });

  it('finds a ui:definitions-declared field reused at more than one path', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Address: { type: 'object', properties: { zip: { type: 'string' } } } },
      properties: {
        home: { $ref: '#/definitions/Address' },
        work: { $ref: '#/definitions/Address' },
      },
    };
    const uiSchema: UiSchema = {
      'ui:definitions': { '#/definitions/Address': { zip: { 'ui:required': true } } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { home: {}, work: { zip: '1' } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.home.zip');
  });

  it('accepts an explicit uiSchemaDefinitions argument instead of reading ui:definitions off the uiSchema', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Address: { type: 'object', properties: { zip: { type: 'string' } } } },
      properties: { home: { $ref: '#/definitions/Address' } },
    };
    const uiSchemaDefinitions = { '#/definitions/Address': { zip: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(
      testValidator,
      schema,
      undefined,
      { home: {} },
      undefined,
      uiSchemaDefinitions,
    );
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.home.zip');
  });

  it('memoizes the ui:required pre-scan for a repeated, unchanged uiSchema reference', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    let scans = 0;
    const uiSchema: UiSchema = {
      get nick() {
        scans += 1;
        return { 'ui:widget': 'textarea' };
      },
    };
    getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    expect(scans).toBe(1);
    // A second call against the very same uiSchema object (the common case across `liveValidate: 'onChange'`
    // keystrokes, where only formData changes) must not re-scan it.
    getUiRequiredErrorSchema(testValidator, schema, uiSchema, { nick: 'x' });
    expect(scans).toBe(1);
    // A genuinely different uiSchema object is still scanned, proving the assertions above aren't just trivially
    // satisfied by the scan never running at all.
    const otherUiSchema: UiSchema = {
      get nick() {
        scans += 1;
        return { 'ui:widget': 'textarea' };
      },
    };
    getUiRequiredErrorSchema(testValidator, schema, otherUiSchema, {});
    expect(scans).toBe(2);
  });

  it('never resolves a descendant node when ui:definitions is present but nothing declares ui:required', () => {
    // Once any ui:definitions fragment exists, the walk's per-node prune (no local uiSchema, no active definitions)
    // can't rule out a subtree on its own — a definition might attach a ui:required further down. Without a cheaper
    // check first, that turns every validation pass into a full, uncached schema resolution. `if` is resolved via
    // `validator.isValid()` on every node retrieveSchema() actually visits, so a node the walk should never reach
    // acts as a tripwire: if the walk is properly skipped up front, `isValid` is never called at all.
    const validator = getTestValidator({});
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          if: { properties: { flag: { const: true } } },
          then: { properties: { flag2: { type: 'string' } } },
          properties: { flag: { type: 'boolean' } },
        },
      },
    };
    const uiSchema: UiSchema = {
      'ui:definitions': { '#/definitions/Unrelated': { zip: { 'ui:widget': 'text' } } },
    };
    const errorSchema = getUiRequiredErrorSchema(validator, schema, uiSchema, { a: { flag: true } });
    expect(toErrorList(errorSchema)).toEqual([]);
    expect(validator.isValid).not.toHaveBeenCalled();
  });

  it('reports a ui:required field nested inside array items', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
      },
    };
    const uiSchema: UiSchema = { people: { items: { name: { 'ui:required': true } } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { people: [{}, { name: 'x' }] });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.people.0.name');
  });

  it('reports a ui:required field at the correct tuple position when uiSchema.items is an array', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: [
        { type: 'object', properties: { first: { type: 'string' } } },
        { type: 'object', properties: { second: { type: 'string' } } },
      ],
    };
    const uiSchema: UiSchema = {
      items: [{ first: { 'ui:required': true } }, { second: { 'ui:required': true } }],
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, [{}, {}]);
    const errors = toErrorList(errorSchema)
      .map((e) => e.property)
      .sort();
    expect(errors).toEqual(['.0.first', '.1.second']);
  });

  it('reports a ui:required field on an item added past a fixed tuple, using uiSchema.additionalItems', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: [{ type: 'object', properties: { first: { type: 'string' } } }],
      additionalItems: { type: 'object', properties: { extra: { type: 'string' } } },
    };
    const uiSchema: UiSchema = {
      items: { first: { 'ui:required': true } },
      additionalItems: { extra: { 'ui:required': true } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, [{ first: 'x' }, {}]);
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.1.extra');
  });

  it('uses uiSchema.additionalItems, not the function form of uiSchema.items, for a row past a fixed tuple', () => {
    // ArrayField's fixed-items render checks `index >= schemaItems.length` before anything else, so an overflow row
    // never reaches the function form of `uiSchema.items` at all — it always renders with `uiSchema.additionalItems`.
    const schema: RJSFSchema = {
      type: 'array',
      items: [{ type: 'object', properties: { first: { type: 'string' } } }],
      additionalItems: { type: 'object', properties: { extra: { type: 'string' } } },
    };
    const uiSchema: UiSchema = {
      items: () => ({ first: { 'ui:required': true } }),
      additionalItems: { extra: { 'ui:required': true } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, [{ first: 'x' }, {}]);
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.1.extra');
  });

  it('reports a ui:required field on a dynamically-added additionalProperties entry', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' } },
      additionalProperties: { type: 'object', properties: { name: { type: 'string' } } },
    };
    const uiSchema: UiSchema = {
      additionalProperties: { name: { 'ui:required': true } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { foo: 'x', extraKey: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.extraKey.name');
  });

  it('reports a ui:required field inside the selected oneOf branch', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          oneOf: [
            { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
            { type: 'object', properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true }, bField: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: { kind: 'a' } });
    const errors = toErrorList(errorSchema);
    // Only the selected ('a') branch's field is checked; the unselected branch's bField is not reached.
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.aField');
  });

  it('reports a ui:required field inside a selected oneOf branch that is itself a raw $ref', () => {
    // resolveSelectedBranch() must expand $ref options (resolveAnyOfOrOneOfRefs: true), the same way ObjectField
    // does when rendering, or the merged branch schema has no `properties` and aField is never visited.
    const schema: RJSFSchema = {
      type: 'object',
      definitions: {
        A: { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
      },
      properties: {
        thing: { oneOf: [{ $ref: '#/definitions/A' }] },
      },
    };
    const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.aField');
  });

  it('reports a ui:required field inside the selected anyOf branch', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          anyOf: [
            { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
            { type: 'object', properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { thing: { bField: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: { kind: 'b' } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.bField');
  });

  it('enforces a ui:required field declared inside uiSchema.oneOf[i] for the branch matching formData', () => {
    // MultiSchemaField renders `uiSchema.oneOf[selectedOption]` in place of the parent uiSchema for that branch's own
    // fields (see AnyOfField's `optionsUiSchema`/`optionUiSchema`) rather than merging it with a per-key entry on the
    // parent (`uiSchema.thing.bField`), so the walk has to resolve the branch's uiSchema the same way.
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          oneOf: [
            { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
            { type: 'object', properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { thing: { oneOf: [{}, { bField: { 'ui:required': true } }] } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: { kind: 'b' } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.bField');
  });

  it('enforces a ui:required field declared inside uiSchema.anyOf[i] for the branch matching formData', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          anyOf: [
            { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
            { type: 'object', properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { thing: { anyOf: [{}, { bField: { 'ui:required': true } }] } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: { kind: 'b' } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.bField');
  });

  it('falls back to the parent uiSchema for a branch when uiSchema.oneOf has fewer entries than the schema', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          oneOf: [
            { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
            { type: 'object', properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } } },
          ],
        },
      },
    };
    // Only one entry for two options: the second (selected) branch isn't covered by the array, so it falls back to
    // the parent uiSchema (`uiSchema.thing`) exactly as `AnyOfField` does when `optionsUiSchema.length <= selectedOption`.
    const uiSchema: UiSchema = {
      thing: { bField: { 'ui:required': true }, oneOf: [{ aField: { 'ui:required': true } }] },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: { kind: 'b' } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.bField');
  });

  it('treats a sparse entry in uiSchema.oneOf at the selected index as an empty uiSchema rather than throwing', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          oneOf: [
            { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
            { type: 'object', properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { thing: { oneOf: [{ aField: { 'ui:required': true } }, undefined as never] } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: { kind: 'b' } });
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('treats an empty oneOf list as a plain schema rather than throwing', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { thing: { type: 'object', oneOf: [], properties: { nick: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = { thing: { nick: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.nick');
  });

  it('treats a malformed non-array oneOf as a plain schema rather than throwing', () => {
    const schema = {
      type: 'object',
      properties: {
        thing: {
          type: 'object',
          oneOf: 'not-an-array',
          properties: { nick: { type: 'string' } },
        },
      },
    } as unknown as RJSFSchema;
    const uiSchema: UiSchema = { thing: { nick: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.nick');
  });

  describe('recursive $ref cycles', () => {
    it('does not stack overflow on a recursive $ref reached through a ui:definitions fragment', () => {
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Node: {
            type: 'object',
            properties: { value: { type: 'string' }, next: { $ref: '#/definitions/Node' } },
          },
        },
        properties: { root: { $ref: '#/definitions/Node' } },
      };
      const uiSchema: UiSchema = {
        'ui:definitions': { '#/definitions/Node': { value: { 'ui:required': true } } },
      };
      const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { root: {} });
      const errors = toErrorList(errorSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('.root.value');
    });

    it('does not report past the point retrieveSchema() itself marks as a $ref cycle', () => {
      // retrieveSchema() (the same one SchemaField/CyclicSchemaField render against) marks the *second* occurrence
      // of a repeated $ref within a single resolution pass as a cycle without expanding it further — here, that's
      // `root.next` itself, one level shallower than the recursive structure might suggest. Matching that boundary
      // (rather than either stack-overflowing past it or silently swallowing the first, legitimate level) is the
      // property under test, not the traversal depth as such.
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Node: {
            type: 'object',
            properties: { value: { type: 'string' }, next: { $ref: '#/definitions/Node' } },
          },
        },
        properties: { root: { $ref: '#/definitions/Node' } },
      };
      const uiSchema: UiSchema = {
        'ui:definitions': { '#/definitions/Node': { value: { 'ui:required': true } } },
      };
      const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {
        root: { value: 'x', next: {} },
      });
      expect(toErrorList(errorSchema)).toEqual([]);
    });
  });

  describe('Optional Data Controls', () => {
    it('does not fire for a field inside an unselected anyOf branch configured as an Optional Data Control', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          thing: {
            anyOf: [
              { type: 'object', properties: { aField: { type: 'string' } } },
              { type: 'object', properties: { bField: { type: 'string' } } },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true } } };
      const globalUiOptions = { enableOptionalDataFieldForType: ['object'] as ('object' | 'array')[] };
      const errorSchema = getUiRequiredErrorSchema(
        testValidator,
        schema,
        uiSchema,
        {},
        undefined,
        undefined,
        globalUiOptions,
      );
      expect(toErrorList(errorSchema)).toEqual([]);
    });

    it('does not fire for a field inside an unselected oneOf branch configured as an Optional Data Control', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          thing: {
            oneOf: [
              { type: 'object', properties: { aField: { type: 'string' } } },
              { type: 'object', properties: { bField: { type: 'string' } } },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true } } };
      const globalUiOptions = { enableOptionalDataFieldForType: ['object'] as ('object' | 'array')[] };
      const errorSchema = getUiRequiredErrorSchema(
        testValidator,
        schema,
        uiSchema,
        {},
        undefined,
        undefined,
        globalUiOptions,
      );
      expect(toErrorList(errorSchema)).toEqual([]);
    });

    it('still fires once the Optional Data Control has been opted into (formData present)', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          thing: {
            anyOf: [
              { type: 'object', properties: { aField: { type: 'string' } } },
              { type: 'object', properties: { bField: { type: 'string' } } },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true } } };
      const globalUiOptions = { enableOptionalDataFieldForType: ['object'] as ('object' | 'array')[] };
      const errorSchema = getUiRequiredErrorSchema(
        testValidator,
        schema,
        uiSchema,
        { thing: {} },
        undefined,
        undefined,
        globalUiOptions,
      );
      const errors = toErrorList(errorSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('.thing.aField');
    });

    it('still fires for an absent Optional-Data-Control-eligible field that is itself ui:required', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          thing: { type: 'object', properties: { aField: { type: 'string' } } },
        },
      };
      const uiSchema: UiSchema = { thing: { 'ui:required': true } };
      const globalUiOptions = { enableOptionalDataFieldForType: ['object'] as ('object' | 'array')[] };
      const errorSchema = getUiRequiredErrorSchema(
        testValidator,
        schema,
        uiSchema,
        {},
        undefined,
        undefined,
        globalUiOptions,
      );
      const errors = toErrorList(errorSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('.thing');
    });

    it('does not treat an absent field as an Optional Data Control when the type is not enabled for it', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          thing: { type: 'object', properties: { aField: { type: 'string' } } },
        },
      };
      const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true } } };
      const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
      const errors = toErrorList(errorSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('.thing.aField');
    });
  });

  describe('the function form of uiSchema.items', () => {
    it('enforces ui:required returned by the function form of uiSchema.items', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
        },
      };
      const uiSchema: UiSchema = {
        people: { items: () => ({ name: { 'ui:required': true } }) },
      };
      const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { people: [{}] });
      const errors = toErrorList(errorSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('.people.0.name');
    });

    it('passes formContext through to the function form of uiSchema.items', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
        },
      };
      const uiSchema: UiSchema = {
        people: {
          items: (_item: unknown, _index: number, formContext?: { requireName?: boolean }) => ({
            name: { 'ui:required': formContext?.requireName === true },
          }),
        },
      };
      const errorSchema = getUiRequiredErrorSchema(
        testValidator,
        schema,
        uiSchema,
        { people: [{}] },
        undefined,
        undefined,
        undefined,
        { requireName: true },
      );
      const errors = toErrorList(errorSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('.people.0.name');
    });

    it('falls back to no uiSchema and logs when the function form of uiSchema.items throws', () => {
      const consoleErrorStub = vi.spyOn(console, 'error').mockImplementation(() => {});
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
        },
      };
      const error = new Error('boom');
      const uiSchema: UiSchema = {
        people: {
          items: () => {
            throw error;
          },
        },
      };
      const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { people: [{}] });
      expect(toErrorList(errorSchema)).toEqual([]);
      expect(consoleErrorStub).toHaveBeenCalledWith(
        'Error executing dynamic uiSchema.items function for item at index 0:',
        error,
      );
      consoleErrorStub.mockRestore();
    });
  });
});
