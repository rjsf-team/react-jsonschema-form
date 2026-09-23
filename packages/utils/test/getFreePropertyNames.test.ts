import { describe, expect, it } from 'vitest';

import { getFreePropertyNames } from '../src/index.ts';
import type { RJSFSchema } from '../src/types.ts';

describe('getFreePropertyNames()', () => {
  it('returns undefined for a schema with no propertyNames', () => {
    expect(getFreePropertyNames({ type: 'object' } as RJSFSchema)).toBeUndefined();
  });
  it('returns undefined for a boolean propertyNames', () => {
    expect(getFreePropertyNames({ propertyNames: true } as RJSFSchema)).toBeUndefined();
  });
  it('returns undefined for a propertyNames that enumerates nothing', () => {
    expect(getFreePropertyNames({ propertyNames: { pattern: '^a' } } as RJSFSchema)).toBeUndefined();
  });
  it('returns an empty array for an enum that allows no name at all', () => {
    expect(getFreePropertyNames({ propertyNames: { enum: [] } } as RJSFSchema)).toEqual([]);
  });
  it('returns an empty array for an enum holding no string, since no key could equal one', () => {
    expect(getFreePropertyNames({ propertyNames: { enum: [1, null] } } as RJSFSchema)).toEqual([]);
  });
  it('drops the non-string entries of a mixed enum', () => {
    expect(getFreePropertyNames({ propertyNames: { enum: ['a', 2, 'b'] } } as RJSFSchema)).toEqual(['a', 'b']);
  });
  it('returns every allowed name when nothing has taken one', () => {
    expect(getFreePropertyNames({ propertyNames: { enum: ['a', 'b'] } } as RJSFSchema, {})).toEqual(['a', 'b']);
  });
  it('leaves out a name the form data holds', () => {
    expect(getFreePropertyNames({ propertyNames: { enum: ['a', 'b'] } } as RJSFSchema, { a: 1 })).toEqual(['b']);
  });
  it('leaves out a name the schema declares as a property of its own', () => {
    const schema = { properties: { a: { type: 'string' } }, propertyNames: { enum: ['a', 'b'] } } as RJSFSchema;
    expect(getFreePropertyNames(schema)).toEqual(['b']);
  });
  it('ignores form data that is not an object', () => {
    expect(getFreePropertyNames({ propertyNames: { enum: ['a'] } } as RJSFSchema, 'a')).toEqual(['a']);
  });
  it('returns an empty array once every allowed name is taken', () => {
    expect(getFreePropertyNames({ propertyNames: { enum: ['a'] } } as RJSFSchema, { a: 1 })).toEqual([]);
  });
  it('keeps the name being renamed away from even though it is taken', () => {
    const schema = { propertyNames: { enum: ['a', 'b', 'c'] } } as RJSFSchema;
    expect(getFreePropertyNames(schema, { a: 1, b: 2 }, 'a')).toEqual(['a', 'c']);
  });
  it('reads a propertyNames $ref as enumerating nothing, since it cannot resolve one', () => {
    expect(getFreePropertyNames({ propertyNames: { $ref: '#/definitions/names' } } as RJSFSchema)).toBeUndefined();
  });
});
