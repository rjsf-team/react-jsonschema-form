import { getClosestMatchingOption, retrieveSchema } from '@rjsf/utils';
import type { RJSFSchema } from '@rjsf/utils';

import { customizeValidator } from '../src/index.ts';

describe('an if checked for a field with no data, with useDefaults', () => {
  const root: RJSFSchema = {
    type: 'object',
    properties: { kind: { type: 'string' } },
    if: { required: ['kind'], properties: { kind: { const: 'a', default: 'a' } } },
    then: { properties: { forA: { type: 'string' } } },
    else: { properties: { other: { type: 'string' } } },
  };
  it.each([undefined, null])('checks %s as an empty object AJV can fill with defaults', (data) => {
    const validator = customizeValidator({ ajvOptionsOverrides: { useDefaults: true } });
    expect(Object.keys(retrieveSchema({ validator }, root, root, data).properties ?? {})).toEqual(['kind', 'forA']);
  });
});

/** Data that is neither an array nor a plain object, which Ajv fills defaults into all the same */
class Holder {
  readonly k = 'x';
}

describe('options scored with useDefaults, which fills defaults into a copy of the data as it checks', () => {
  // The first and last options offer `p` the same option objects, so scoring the last asks again for the pick the first
  // made for `p`, after checking the middle one has filled `flag` into a copy of `p`
  const shared: RJSFSchema[] = [
    { type: 'object', properties: { k: { type: 'string' }, flag: { not: {} } } },
    { type: 'object', properties: { k: { type: 'string' }, flag: { type: 'string', const: 'on' } } },
  ];
  const filling: RJSFSchema = {
    type: 'object',
    properties: { k: { type: 'string' }, flag: { type: 'string', default: 'on' } },
  };
  const options: RJSFSchema[] = [
    { type: 'object', properties: { p: { anyOf: shared } } },
    { type: 'object', properties: { p: { anyOf: [filling] } } },
    { type: 'object', properties: { p: { anyOf: shared }, q: { type: 'string' } } },
  ];
  const root: RJSFSchema = { anyOf: options };
  it.each<[string, () => object]>([
    ['plain data', () => ({ k: 'x' })],
    ['data holding a Date', () => ({ k: 'x', when: new Date(0) })],
    ['a class instance', () => new Holder()],
    ['a Date', () => new Date(0)],
  ])('picks for %s under a nested option list as for data no default was filled into', (_name, p) => {
    const validator = customizeValidator({ ajvOptionsOverrides: { useDefaults: true } });
    const formData = { p: p(), q: 'z' };
    // What the data scores with nothing filled into it, as without `useDefaults`
    const fresh = getClosestMatchingOption({ validator: customizeValidator() }, root, { p: p(), q: 'z' }, options);

    expect(getClosestMatchingOption({ validator }, root, formData, options)).toBe(fresh);
    expect(fresh).toBe(2);
    expect(formData.p).toEqual(p());
    expect(Object.keys(formData.p)).toEqual(Object.keys(p()));
  });
  it('leaves the data it matches as it was, so a later call matches it as the first did', () => {
    // Checking the second option fills `flag`, which the first rules out, into a copy: the data matches both every time
    const filledLast: RJSFSchema[] = [
      {
        type: 'object',
        properties: { k: { type: 'string' }, m: { type: 'number' }, n: { type: 'boolean' } },
        not: { required: ['flag'] },
      },
      filling,
    ];
    const filledLastRoot: RJSFSchema = { anyOf: filledLast };
    const validator = customizeValidator({ ajvOptionsOverrides: { useDefaults: true } });
    const formData = { k: 'x', m: 1, n: true };

    expect(getClosestMatchingOption({ validator }, filledLastRoot, formData, filledLast)).toBe(0);
    expect(formData).toEqual({ k: 'x', m: 1, n: true });
    expect(getClosestMatchingOption({ validator }, filledLastRoot, formData, filledLast)).toBe(0);
  });
});
