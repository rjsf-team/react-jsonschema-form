import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import type { RJSFSchema } from '../src/index.ts';
import { getKeywordParentSchema } from '../src/index.ts';

const item: RJSFSchema = {
  type: 'object',
  title: 'Item',
  properties: { name: { type: 'string', title: 'Full name' } },
};
const decode = (key: string) => decodeURIComponent(key).replaceAll('~1', '/').replaceAll('~0', '~');

describe('getKeywordParentSchema()', () => {
  it('returns the root schema for a keyword the root holds', () => {
    const schema: RJSFSchema = { type: 'object', required: ['a'] };
    expect(getKeywordParentSchema(schema, '#/required')).toBe(schema);
  });
  it('reads the schema holding the keyword along the path', () => {
    const schema: RJSFSchema = { type: 'object', properties: { arr: { type: 'array', items: item } } };
    expect(getKeywordParentSchema(schema, '#/properties/arr/items/properties/name/type')).toBe(item.properties!.name);
  });
  it('reads the schema holding the keyword through an array of subschemas', () => {
    const schema: RJSFSchema = { type: 'object', properties: { a: { allOf: [item] } } };
    expect(getKeywordParentSchema(schema, '#/properties/a/allOf/0/required')).toBe(item);
  });
  it('decodes each key of the path with the decoder it is given', () => {
    const schema: RJSFSchema = { type: 'object', properties: { 'a/b': item } };
    expect(getKeywordParentSchema(schema, '#/properties/a~1b/required', decode)).toBe(item);
  });
  it('follows a `$ref` written into the path as a key, or one the path skips', () => {
    const schema: RJSFSchema = { $defs: { I: item }, type: 'object', properties: { a: { $ref: '#/$defs/I' } } };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/properties/name/type')).toEqual(item.properties!.name);
    expect(getKeywordParentSchema(schema, '#/properties/a/properties/name/type')).toEqual(item.properties!.name);
  });
  it('reads the keys after a `$ref` written into the path from its target alone', () => {
    const branch: RJSFSchema = { properties: { name: item.properties!.name }, required: ['name'] };
    const schema: RJSFSchema = {
      $defs: { P: { type: 'object', allOf: [branch] } },
      type: 'object',
      properties: { a: { $ref: '#/$defs/P', allOf: [{ properties: { email: {} }, required: ['email'] }] } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/allOf/0/required')).toBe(branch);
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/allOf/0/properties/name/type')).toBe(
      item.properties!.name,
    );
  });
  it('reads `properties` or `items` after a `$ref` written into the path merged, with the `$ref` schema’s titles', () => {
    const n: RJSFSchema = { type: 'string', title: 'Target N' };
    const schema: RJSFSchema = {
      $defs: { T: { type: 'object', properties: { n } }, L: { type: 'array', items: { properties: { n } } } },
      type: 'object',
      properties: {
        a: { $ref: '#/$defs/T', properties: { n: { title: 'Own N' } } },
        b: { $ref: '#/$defs/L', items: { properties: { n: { title: 'Own N' } } } },
      },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/properties/n/type')).toEqual({ ...n, title: 'Own N' });
    expect(getKeywordParentSchema(schema, '#/properties/b/$ref/items/properties/n/type')).toEqual({
      ...n,
      title: 'Own N',
    });
  });
  it('reads a path ending in a chain of `$ref`s, or going on through a `$ref` inside `properties`, merged', () => {
    const schema: RJSFSchema = {
      $defs: {
        N: { type: 'string', title: 'N' },
        J: { $ref: '#/$defs/N' },
        T: { type: 'object', properties: { n: { $ref: '#/$defs/N' } } },
      },
      type: 'object',
      properties: {
        a: { $ref: '#/$defs/J', title: 'Wrapper' },
        b: { $ref: '#/$defs/T', properties: { n: { title: 'Own N' } } },
      },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/$ref/type')).toEqual(
      expect.objectContaining({ type: 'string', title: 'Wrapper' }),
    );
    expect(getKeywordParentSchema(schema, '#/properties/b/$ref/properties/n/$ref/type')).toEqual(
      expect.objectContaining({ type: 'string', title: 'Own N' }),
    );
  });
  it('reads a list below `properties` after a `$ref` written into the path from its target alone', () => {
    const branch: RJSFSchema = { properties: { t: { title: 'Target T' } }, required: ['t'] };
    const schema: RJSFSchema = {
      $defs: { T: { type: 'object', properties: { n: { allOf: [branch] } } } },
      type: 'object',
      properties: {
        a: { $ref: '#/$defs/T', properties: { n: { allOf: [{ properties: { t: { title: 'Own T' } } }] } } },
      },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/properties/n/allOf/0/required')).toBe(branch);
  });
  it('reads a tuple position or a chain of `$ref`s written into the path merged, with the first `$ref` schema’s titles', () => {
    const schema: RJSFSchema = {
      $defs: {
        B: { type: 'object', properties: { n: { type: 'string', title: 'B N' } } },
        C: { $ref: '#/$defs/B', properties: { n: { title: 'C N' } } },
        L: { type: 'array', items: [{ type: 'string', title: 'Target 0' }] },
      },
      type: 'object',
      properties: {
        a: { $ref: '#/$defs/C', properties: { n: { title: 'Own N' } } },
        t: { $ref: '#/$defs/L', items: [{ title: 'Own 0' }] },
      },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/$ref/properties/n/type')).toEqual({
      type: 'string',
      title: 'Own N',
    });
    expect(getKeywordParentSchema(schema, '#/properties/t/$ref/items/0/type')).toEqual({
      type: 'string',
      title: 'Own 0',
    });
  });
  it('follows a relative `$ref` inside an `$id` resource written into the path', () => {
    const schema: RJSFSchema = {
      $id: 'https://example.com/root',
      $defs: {
        R: {
          $id: 'https://example.com/r',
          $defs: { N: { type: 'string', title: 'N' } },
          type: 'object',
          properties: { n: { $ref: '#/$defs/N' } },
        },
      },
      type: 'object',
      properties: { a: { $ref: 'https://example.com/r' } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/properties/n/$ref/type')?.title).toEqual('N');
  });
  it('follows a `$ref` whose schema holds the next key too, reading both', () => {
    const schema: RJSFSchema = {
      $defs: { I: item },
      type: 'object',
      properties: { a: { $ref: '#/$defs/I', properties: { extra: { title: 'Extra' } } } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/properties/name/type')).toEqual(item.properties!.name);
    expect(getKeywordParentSchema(schema, '#/properties/a/properties/extra/type')?.title).toEqual('Extra');
  });
  it('reads a list keyword the `$ref` schema holds itself from that schema, which merging crosses with its target’s', () => {
    const own: RJSFSchema = { properties: { n: { title: 'W1' } }, required: ['n'] };
    const schema: RJSFSchema = {
      $defs: { T: { type: 'object', anyOf: [{ properties: { z: {} } }, { properties: { y: {} } }] } },
      type: 'object',
      properties: { a: { $ref: '#/$defs/T', anyOf: [{ properties: { m: {} } }, own] } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/anyOf/1/required')).toBe(own);
  });
  it('reads `items` the `$ref` schema and its target both hold merged, with the target’s titles', () => {
    const schema: RJSFSchema = {
      $defs: { T: { type: 'array', items: { properties: { x: { title: 'X' } } } } },
      type: 'object',
      properties: { a: { $ref: '#/$defs/T', items: { required: ['x'] } } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/items/required')).toEqual({
      required: ['x'],
      properties: { x: { title: 'X' } },
    });
  });
  describe('where the `$ref` schema cannot be merged with its target', () => {
    // Merging warns that the two `n` schemas conflict, then falls back to an `allOf` of both
    setupConsoleWarnSuppression();

    it('reads `properties` the `$ref` schema holds itself as written', () => {
      const n: RJSFSchema = { type: 'string', title: 'WrapperN' };
      const schema: RJSFSchema = {
        $defs: { T: { type: 'object', properties: { n: { type: 'number' } } } },
        type: 'object',
        properties: { a: { $ref: '#/$defs/T', properties: { n } } },
      };
      expect(getKeywordParentSchema(schema, '#/properties/a/properties/n/type')).toBe(n);
    });
    it('reads `properties` after a `$ref` written into the path from its target alone', () => {
      const n: RJSFSchema = { type: 'number', title: 'TargetN' };
      const schema: RJSFSchema = {
        $defs: { T: { type: 'object', properties: { n } } },
        type: 'object',
        properties: { a: { $ref: '#/$defs/T', properties: { n: { type: 'string' } } } },
      };
      expect(getKeywordParentSchema(schema, '#/properties/a/$ref/properties/n/type')).toBe(n);
    });
  });
  describe('with skipsRefs', () => {
    const own = { properties: { name: { title: 'Own' } } };
    const branched: RJSFSchema = { type: 'object', allOf: [item] };
    it.each(['allOf', 'anyOf', 'oneOf', 'items', 'prefixItems'])(
      'returns null where a skipped `$ref` and its target both hold %s',
      (key) => {
        const schema: RJSFSchema = {
          $defs: { B: { [key]: [item] }, C: { $ref: '#/$defs/B' } },
          type: 'object',
          properties: { a: { $ref: '#/$defs/B', [key]: [own] }, chain: { $ref: '#/$defs/C', [key]: [own] } },
        };
        expect(
          getKeywordParentSchema(schema, `#/properties/a/${key}/0/properties/name/type`, undefined, true),
        ).toBeNull();
        expect(
          getKeywordParentSchema(schema, `#/properties/chain/${key}/0/properties/name/type`, undefined, true),
        ).toBeNull();
      },
    );
    it('reads a single-schema `items` a skipped `$ref` and its target both hold, which merging joins', () => {
      const schema: RJSFSchema = {
        $defs: {
          I: { type: 'object', properties: { n: { type: 'string', title: 'Target N' } } },
          T: { type: 'array', items: { $ref: '#/$defs/I' } },
        },
        type: 'object',
        properties: { a: { $ref: '#/$defs/T', items: { properties: { n: { title: 'Own N' } } } } },
      };
      expect(getKeywordParentSchema(schema, '#/properties/a/items/properties/n/type', undefined, true)).toEqual({
        type: 'string',
        title: 'Own N',
      });
    });
    it('returns null for a list keyword inside a single-schema `items` a skipped `$ref` and its target both hold', () => {
      const schema: RJSFSchema = {
        $defs: { T: { type: 'array', items: { allOf: [{ title: 'Target branch', minimum: 1 }] } } },
        type: 'object',
        properties: { a: { $ref: '#/$defs/T', items: { allOf: [{ title: 'Own branch', maximum: 1 }] } } },
      };
      expect(getKeywordParentSchema(schema, '#/properties/a/items/allOf/0/minimum', undefined, true)).toBeNull();
    });
    it('stops at a chain of `$ref`s that loops back on itself', () => {
      const schema: RJSFSchema = {
        $defs: { A: { $ref: '#/$defs/B', allOf: [{}] }, B: { $ref: '#/$defs/A' } },
        type: 'object',
        properties: { a: { $ref: '#/$defs/A' } },
      };
      expect(getKeywordParentSchema(schema, '#/properties/a/allOf/0/type', undefined, true)).toBeUndefined();
    });
    it('returns null where two schemas further along a skipped chain of `$ref`s, or both sides of a `then`, hold the key', () => {
      const schema: RJSFSchema = {
        $defs: { B: branched, C: { $ref: '#/$defs/B', allOf: [own] }, T: { if: {}, then: item } },
        type: 'object',
        properties: { mid: { $ref: '#/$defs/C' }, cond: { $ref: '#/$defs/T', if: {}, then: own } },
      };
      expect(
        getKeywordParentSchema(schema, '#/properties/mid/allOf/0/properties/name/type', undefined, true),
      ).toBeNull();
      expect(getKeywordParentSchema(schema, '#/properties/cond/then/properties/name/type', undefined, true)).toBeNull();
    });
    it('reads the `properties` a skipped `$ref` and its target both hold, which merging combines', () => {
      const schema: RJSFSchema = {
        $defs: { I: item },
        type: 'object',
        properties: { a: { $ref: '#/$defs/I', properties: { extra: { title: 'Extra' } } } },
      };
      expect(getKeywordParentSchema(schema, '#/properties/a/properties/name/type', undefined, true)).toEqual(
        item.properties!.name,
      );
    });
    it('reads a list only the `$ref` schema or only its target holds', () => {
      const schema: RJSFSchema = {
        $defs: { B: branched, P: item },
        type: 'object',
        properties: { target: { $ref: '#/$defs/B' }, site: { $ref: '#/$defs/P', allOf: [own] } },
      };
      const path = (key: string) => `#/properties/${key}/allOf/0/properties/name/type`;
      expect(getKeywordParentSchema(schema, path('target'), undefined, true)).toEqual(item.properties!.name);
      expect(getKeywordParentSchema(schema, path('site'), undefined, true)?.title).toEqual('Own');
    });
    it('reads the merged lists where the path is written with its `$ref`s', () => {
      const schema: RJSFSchema = {
        $defs: { B: branched },
        type: 'object',
        properties: { a: { $ref: '#/$defs/B', allOf: [own] } },
      };
      expect(getKeywordParentSchema(schema, '#/properties/a/allOf/0/properties/name/type')?.title).toEqual('Own');
    });
  });
  it('follows a chain of `$ref`s', () => {
    const schema: RJSFSchema = {
      $defs: { N: { type: 'string', title: 'N' }, P: { type: 'object', properties: { n: { $ref: '#/$defs/N' } } } },
      type: 'object',
      properties: { a: { $ref: '#/$defs/P' } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/properties/n/$ref/type')?.title).toEqual('N');
    expect(getKeywordParentSchema(schema, '#/properties/a/properties/n/type')?.title).toEqual('N');
  });
  it('follows a `$ref` to a `$ref`, written into the path once for each', () => {
    const schema: RJSFSchema = {
      $defs: { I: item, J: { $ref: '#/$defs/I' } },
      type: 'object',
      properties: { a: { $ref: '#/$defs/J' } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/$ref/required')?.title).toEqual('Item');
  });
  it('resolves a `$ref` on the schema it ends at, keeping that schema’s own keywords', () => {
    const schema: RJSFSchema = {
      $defs: { I: item },
      type: 'object',
      properties: { a: { $ref: '#/$defs/I' }, b: { title: 'Wrapper', $ref: '#/$defs/I' } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/required')?.title).toEqual('Item');
    expect(getKeywordParentSchema(schema, '#/properties/b/required')).toEqual(
      expect.objectContaining({ title: 'Wrapper', properties: item.properties }),
    );
  });
  it('resolves a `$ref` to a definition whose key holds a `/`', () => {
    const schema: RJSFSchema = { $defs: { 'x/y': item }, type: 'object', properties: { a: { $ref: '#/$defs/x~1y' } } };
    expect(getKeywordParentSchema(schema, '#/properties/a/$ref/required', decode)?.title).toEqual('Item');
  });
  it('reads a property named `$ref` as a key', () => {
    const schema: RJSFSchema = { type: 'object', properties: { $ref: item } };
    expect(getKeywordParentSchema(schema, '#/properties/$ref/required')).toBe(item);
  });
  it('returns undefined for a `$ref` it cannot resolve', () => {
    const schema: RJSFSchema = {
      $defs: { I: { ...item, $anchor: 'i' } },
      type: 'object',
      properties: { anchor: { $ref: '#i' }, missing: { $ref: '#/$defs/Nope' } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/anchor/required')).toBeUndefined();
    expect(getKeywordParentSchema(schema, '#/properties/missing/$ref/required')).toBeUndefined();
  });
  it('returns undefined for a path that leads to no schema object', () => {
    const schema: RJSFSchema = { type: 'object', properties: { x: false } };
    expect(getKeywordParentSchema(schema, '#/properties/nope/type')).toBeUndefined();
    expect(getKeywordParentSchema(schema, '#/properties/x/type')).toBeUndefined();
    expect(getKeywordParentSchema(schema, '#/properties/x/y/type')).toBeUndefined();
  });
  it('returns undefined for a path that ends at a name, rather than the map holding it', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { x: false, properties: item },
      patternProperties: { '^p': false },
      dependentSchemas: { d: false },
    };
    expect(getKeywordParentSchema(schema, '#/properties/x', undefined, true)).toBeUndefined();
    expect(getKeywordParentSchema(schema, '#/patternProperties/^p')).toBeUndefined();
    expect(getKeywordParentSchema(schema, '#/dependentSchemas/d')).toBeUndefined();
    expect(getKeywordParentSchema(schema, '#/properties/properties/required')).toBe(item);
  });
  it('returns undefined for a path into another resource, which Ajv starts with that resource’s `$id`', () => {
    const schema: RJSFSchema = { type: 'object', required: ['a'], $defs: { F: { $id: 'f', required: ['b'] } } };
    expect(getKeywordParentSchema(schema, 'f/required')).toBeUndefined();
  });
});
