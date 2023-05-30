import { hashForSchema, RJSFSchema } from '../src';
import { RECURSIVE_REF } from './testUtils/testData';

const TINY_SCHEMA: RJSFSchema = {
  type: 'string',
  title: 'test',
};

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
