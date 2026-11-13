import type { RJSFSchema } from '../src/index.ts';
import { hashObject, RJSF_REF_CYCLE_KEY, RJSF_REF_KEY } from '../src/index.ts';
import { RECURSIVE_REF } from './testUtils/testData.ts';

const TINY_SCHEMA: RJSFSchema = {
  type: 'string',
  title: 'test',
};

const OUT_OF_ORDER_SCHEMA: RJSFSchema = {
  type: 'string',
  title: 'order',
  properties: { foo: { type: 'string' }, bar: { type: 'number', default: 4 } },
};

const IN_ORDER_SCHEMA: RJSFSchema = {
  properties: { bar: { default: 4, type: 'number' }, foo: { type: 'string' } },
  title: 'order',
  type: 'string',
};

const TEST_OBJECT_WITH_IGNORED_PROPERTIES = { a: 1, b: undefined, f: () => {} };

const TEST_OBJECT_1 = { foo: 'bar', yes: 'no', bool: false, nested: { one: '1', two: 2, three: 3.0 } };
const TEST_OBJECT_2 = { bool: false, foo: 'bar', nested: { one: '1', three: 3.0, two: 2 }, yes: 'no' };
const TEST_ARRAY_1 = ['foo', 'bar'];
const TEST_ARRAY_2 = ['foo', TEST_OBJECT_2];
const TEST_ARRAY_3 = ['foo', TEST_ARRAY_2];
const TEST_ARRAY_4 = [(name: string) => ({ name })];

describe('hashObject', () => {
  it('returns a hash for a tiny schema', () => {
    expect(hashObject(TINY_SCHEMA)).toMatchSnapshot();
  });
  it('returns a hash for a more complex schema', () => {
    expect(hashObject(RECURSIVE_REF)).toMatchSnapshot();
  });
  it('ignores Symbol keys (RJSF_REF_KEY, RJSF_REF_CYCLE_KEY) when computing the hash', () => {
    const schema: RJSFSchema = { type: 'object', title: 'test' };
    const schemaWithSymbols = { ...schema, [RJSF_REF_KEY]: '#/foo', [RJSF_REF_CYCLE_KEY]: true };
    expect(hashObject(schema)).toBe(hashObject(schemaWithSymbols));
  });
  it('returns the hash of `{}` for an empty object', () => {
    expect(hashObject({})).toEqual('f62');
  });
  it('returns the same hash for an object whatever the order of its keys', () => {
    expect(hashObject(OUT_OF_ORDER_SCHEMA)).toEqual(hashObject(IN_ORDER_SCHEMA));
    expect(hashObject(TEST_OBJECT_1)).toEqual(hashObject(TEST_OBJECT_2));
  });
  it('leaves out the properties JSON.stringify leaves out', () => {
    expect(hashObject(TEST_OBJECT_WITH_IGNORED_PROPERTIES)).toEqual(hashObject({ a: 1 }));
  });
  it('hashes a function in an array as `null`', () => {
    expect(hashObject(TEST_ARRAY_4)).toEqual(hashObject([null]));
    expect(hashObject([null])).toEqual('-5e7213c5');
  });
  it.each([
    ['[]', [], 'b62'],
    ['[undefined]', [undefined], '6f1853a8'],
    ['[null]', [null], '-5e7213c5'],
    ['[1,undefined,2]', [1, undefined, 2], '6cb582fd'],
  ])('hashes %s as that text', (_text, value, expected) => {
    expect(hashObject(value)).toEqual(expected);
  });
  it('hashes a primitive as its JSON text, with the Java string hash', () => {
    expect(hashObject(1)).toEqual('31');
    expect(hashObject('hello good sir')).toEqual('-27d06de7');
  });
  describe('handles arrays', () => {
    it('returns the hash of the json stringified array', () => {
      expect(hashObject(TEST_ARRAY_1)).toEqual('79e05ef5');
    });
    it('hashes object within an array', () => {
      expect(hashObject(TEST_ARRAY_2)).toEqual('-6dcf0603');
    });
    it('hashes array within an array', () => {
      expect(hashObject(TEST_ARRAY_3)).toEqual('57c5c8d7');
    });
  });
});
