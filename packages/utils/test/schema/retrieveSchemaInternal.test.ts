import { RJSF_REF_KEY } from '../../src/index.ts';
import type { RJSFSchema } from '../../src/index.ts';
import { retrieveSchemaInternal, withDependentProperties } from '../../src/schema/retrieveSchema.ts';
import { miniValidator } from './graph/miniValidator.ts';

describe('the branch resolution schemaParser() enumerates with', () => {
  it('merges a branch beside a $ref into the definition, marked with the reference it was resolved from', () => {
    const schema: RJSFSchema = {
      definitions: { A: { type: 'object', properties: { a: { type: 'string' } } } },
      type: 'object',
      properties: {
        p: { $ref: '#/definitions/A', if: {}, then: { properties: { friend: { $ref: '#/definitions/A' } } } },
      },
    };
    const property = schema.properties?.p;
    expect(typeof property).toBe('object');
    const [retrieved] = retrieveSchemaInternal(
      { validator: miniValidator() },
      typeof property === 'object' ? property : {},
      schema,
      {},
    );
    expect(retrieved.properties).toEqual({ a: { type: 'string' }, friend: { $ref: '#/definitions/A' } });
    expect(Reflect.get(retrieved, RJSF_REF_KEY)).toBe('#/definitions/A');
  });

  it('withDependentProperties() starts a required list for a schema without one', () => {
    expect(withDependentProperties({ type: 'object' }, ['a'])).toEqual({ type: 'object', required: ['a'] });
  });
});
