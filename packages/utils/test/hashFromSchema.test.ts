import { hashForSchema, hashObject, hashString, RJSFSchema, sortedJSONStringify } from '../src';
import { RECURSIVE_REF } from './testUtils/testData';

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

const STRINGIFIED_IN_ORDER = JSON.stringify(IN_ORDER_SCHEMA);

describe('hashForSchema', () => {
  it('returns a hash for a tiny schema', () => {
    expect(hashForSchema(TINY_SCHEMA)).toMatchSnapshot();
  });
  it('returns a hash for a more complex schema', () => {
    expect(hashForSchema(RECURSIVE_REF)).toMatchSnapshot();
  });
  it('returns same hash for two schemas but fields are different order', () => {
    const schema1: RJSFSchema = { type: 'string', title: 'order' };
    const schema2: RJSFSchema = { title: 'order', type: 'string' };
    expect(hashForSchema(schema1)).toBe(hashForSchema(schema2));
  });
});

describe('sortedJSONStringify', () => {
  it('stringifies the object with keys already in order', () => {
    expect(sortedJSONStringify(IN_ORDER_SCHEMA)).toEqual(STRINGIFIED_IN_ORDER);
  });
  it('stringifies the object putting keys in order', () => {
    expect(sortedJSONStringify(OUT_OF_ORDER_SCHEMA)).toEqual(STRINGIFIED_IN_ORDER);
  });
});

const TEST_OBJECT_1 = { foo: 'bar', yes: 'no', bool: false, nested: { one: '1', two: 2, three: 3.0 } };
const TEST_OBJECT_2 = { bool: false, foo: 'bar', nested: { one: '1', three: 3.0, two: 2 }, yes: 'no' };
const EMPTY_OBJECT_HASH = hashString('{}');
const NON_PLAIN_OBJECT_HASH = hashString(JSON.stringify([null]));
const TEST_ARRAY_1 = ['foo', 'bar'];
const TEST_ARRAY_2 = ['foo', TEST_OBJECT_2];
const TEST_ARRAY_3 = ['foo', TEST_ARRAY_2];
const TEST_ARRAY_4 = [
  (name: string) => {
    return { name };
  },
];

describe('hashObject', () => {
  it('returns hash of zero for an empty object', () => {
    expect(hashObject({})).toEqual(EMPTY_OBJECT_HASH);
  });
  it('returns the same hash for two objects with differently ordered keys', () => {
    const hash1 = hashObject(TEST_OBJECT_1);
    const hash2 = hashObject(TEST_OBJECT_2);
    expect(hash1).toEqual(hash2);
  });
  it('return the correct hash for non-plain objects', () => {
    const hash3 = hashObject(TEST_ARRAY_4);
    expect(hash3).toEqual(NON_PLAIN_OBJECT_HASH);
  });
  describe('handles arrays', () => {
    let expected1: string;
    let expected2: string;
    let expected3: string;
    beforeAll(() => {
      expected1 = hashString(JSON.stringify(TEST_ARRAY_1));
      expected2 = hashString(JSON.stringify([TEST_ARRAY_2[0], TEST_OBJECT_2]));
      expected3 = hashString(JSON.stringify([TEST_ARRAY_3[0], [TEST_ARRAY_2[0], TEST_OBJECT_2]]));
    });
    it('returns the hash of the json stringified array', () => {
      expect(hashObject(TEST_ARRAY_1)).toEqual(expected1);
    });
    it('hashes object within an array', () => {
      expect(hashObject(TEST_ARRAY_2)).toEqual(expected2);
    });
    it('hashes array within an array', () => {
      expect(hashObject(TEST_ARRAY_3)).toEqual(expected3);
    });
  });
});

describe('hashString', () => {
  it('should return 0 on empty string', () => {
    expect(hashString('')).toEqual('0');
  });

  it('should hash some strings', () => {
    expect(hashString('1')).toEqual('31');
    expect(hashString('a')).toEqual('61');
    expect(hashString('hello good sir')).toEqual('-21f94979');
    expect(hashString('Benign Polyps')).toEqual('292648aa');
  });
});
