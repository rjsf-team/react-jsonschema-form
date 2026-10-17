import type { RJSFSchema } from '../../src/index.ts';
import { resolveConstantOptions, RJSF_REF_KEY } from '../../src/index.ts';

describe('resolveConstantOptions()', () => {
  const rootSchema: RJSFSchema = {
    definitions: { red: { const: 'red', title: 'Red' }, text: { type: 'string' } },
    type: 'object',
  };

  it('resolves the $ref of each option when that makes every option a constant, the same schema on every call', () => {
    const schema: RJSFSchema = { type: 'string', oneOf: [{ $ref: '#/definitions/red' }, { const: 'green' }] };
    const resolved = resolveConstantOptions(schema, rootSchema);
    expect(resolved).toEqual({
      type: 'string',
      oneOf: [{ const: 'red', title: 'Red', [RJSF_REF_KEY]: '#/definitions/red' }, { const: 'green' }],
    });
    expect(resolveConstantOptions(schema, rootSchema)).toBe(resolved);
  });
  it('reads an option whose $ref has constraints beside it as the allOf of both, merged into the constant', () => {
    const schema: RJSFSchema = {
      type: 'string',
      oneOf: [{ $ref: '#/definitions/red', type: 'string' }, { const: 'green' }],
    };
    expect(resolveConstantOptions(schema, rootSchema)).toEqual({
      type: 'string',
      oneOf: [{ const: 'red', title: 'Red', type: 'string', [RJSF_REF_KEY]: '#/definitions/red' }, { const: 'green' }],
    });
  });
  it('returns the schema itself when an option it resolves is not a constant', () => {
    const schema: RJSFSchema = { anyOf: [{ $ref: '#/definitions/red' }, { $ref: '#/definitions/text' }] };
    expect(resolveConstantOptions(schema, rootSchema)).toBe(schema);
  });
  it('returns the schema itself when an option is a boolean', () => {
    const schema: RJSFSchema = { anyOf: [{ $ref: '#/definitions/red' }, true] };
    expect(resolveConstantOptions(schema, rootSchema)).toBe(schema);
  });
  it('returns the schema itself when no option is written as a $ref', () => {
    const schema: RJSFSchema = { oneOf: [{ const: 'a' }, { const: 'b' }] };
    expect(resolveConstantOptions(schema, rootSchema)).toBe(schema);
  });
  it('returns a schema without options as it stands', () => {
    const schema: RJSFSchema = { type: 'string' };
    expect(resolveConstantOptions(schema, rootSchema)).toBe(schema);
  });
});
