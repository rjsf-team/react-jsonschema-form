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
  it('follows a `$ref` whose schema holds the next key too, reading both', () => {
    const schema: RJSFSchema = {
      $defs: { I: item },
      type: 'object',
      properties: { a: { $ref: '#/$defs/I', properties: { extra: { title: 'Extra' } } } },
    };
    expect(getKeywordParentSchema(schema, '#/properties/a/properties/name/type')).toEqual(item.properties!.name);
    expect(getKeywordParentSchema(schema, '#/properties/a/properties/extra/type')?.title).toEqual('Extra');
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
});
