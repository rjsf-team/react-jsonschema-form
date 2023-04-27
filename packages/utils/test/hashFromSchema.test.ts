import { hashForSchema, RJSFSchema } from '../src';
import { RECURSIVE_REF } from './testUtils/testData';

const TINY_SCHEMA: RJSFSchema = {
  type: 'string',
  title: 'test',
};

describe('hashForSchema', () => {
  it('returns a hash for a tiny schema', () => {
    expect(hashForSchema(TINY_SCHEMA)).toEqual('1529867581');
  });
  it('returns a hash for a more complex schema', () => {
    expect(hashForSchema(RECURSIVE_REF)).toEqual('-1807418922');
  });
});
