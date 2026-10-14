import type { RJSFSchema } from '../src/index.ts';
import { getDefaultFormState } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const testValidator = getTestValidator({});

describe('own prototype-named properties', () => {
  it('keeps extra form data through the public entry point', () => {
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
    expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { toString: 'abc', b: 1 } })).toEqual({
      toString: 'abc',
      b: 1,
    });
  });

  it('does not turn an inherited toString into own data during allOf matching', () => {
    const schema: RJSFSchema = JSON.parse(
      '{"type":"object","properties":{"toString":{"allOf":[{"type":"string"}]},"a":{"type":"string","default":"x"}}}',
    );
    const result = getDefaultFormState(
      { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
      { schema, formData: { a: 'y' } },
    );
    expect(result).toEqual({ a: 'y' });
    expect(Object.hasOwn(result!, 'toString')).toBe(false);
  });

  it.each([{}, JSON.parse('{"__proto__":{"y":"u"}}')])('retains __proto__ schema defaults with data %s', (formData) => {
    const schema: RJSFSchema = JSON.parse(
      '{"type":"object","properties":{"__proto__":{"type":"object","properties":{"x":{"default":"dx"}}}}}',
    );
    const result = getDefaultFormState({ validator: testValidator }, { schema, formData });
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual({
      x: 'dx',
      ...(Object.getOwnPropertyDescriptor(formData, '__proto__')?.value ?? {}),
    });
  });
});
