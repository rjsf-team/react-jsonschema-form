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

describe('options scored with useDefaults, which fills defaults into the data as it checks', () => {
  // The first and last options offer `p` the same option objects, so scoring the last asks again for the pick the first
  // made for `p`, after scoring the middle one has filled `flag` into `p`
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
  it.each([
    ['plain data', {}],
    // A pick for data holding a Date is kept for the outermost call alone, and compared within it all the same
    ['data holding a Date', { when: new Date(0) }],
  ])('scores a nested option list again once a default is filled into %s it was scored for', (_name, extra) => {
    const validator = customizeValidator({ ajvOptionsOverrides: { useDefaults: true } });
    const formData = { p: { k: 'x', ...extra }, q: 'z' };
    expect(getClosestMatchingOption({ validator }, root, formData, options)).toBe(2);
    expect(formData.p).toEqual({ k: 'x', flag: 'on', ...extra });
  });
});
