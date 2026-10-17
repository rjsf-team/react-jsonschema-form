import type { ErrorSchema } from '../src/index.ts';
import { ERRORS_KEY } from '../src/index.ts';
import normalizeErrorSchema from '../src/normalizeErrorSchema.ts';

describe('normalizeErrorSchema()', () => {
  it('returns an errorSchema without arrays for items as it is', () => {
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: ['root'], list: { 0: { name: { [ERRORS_KEY]: ['bad'] } } } };
    expect(normalizeErrorSchema(errorSchema)).toBe(errorSchema);
  });

  it('rewrites nested arrays for items as objects keyed by index, sharing the nodes without one', () => {
    const untouched = { [ERRORS_KEY]: ['other'] };
    const errorSchema: ErrorSchema = {
      other: untouched,
      list: [{ sub: [{ [ERRORS_KEY]: ['bad'] }] }],
    };
    const normalized = normalizeErrorSchema(errorSchema);
    expect(normalized).toEqual({ other: untouched, list: { 0: { sub: { 0: { [ERRORS_KEY]: ['bad'] } } } } });
    expect(normalized.other).toBe(untouched);
  });

  it('rewrites an errorSchema that is itself an array, leaving out its holes', () => {
    // oxlint-disable-next-line no-sparse-arrays -- the hole is the item without errors
    const errorSchema: ErrorSchema = [, { [ERRORS_KEY]: ['bad'] }];
    expect(normalizeErrorSchema(errorSchema)).toEqual({ 1: { [ERRORS_KEY]: ['bad'] } });
  });

  it('leaves out the null and undefined items of an array, as it does its holes', () => {
    const normalized = normalizeErrorSchema({ list: [undefined, null, { [ERRORS_KEY]: ['bad'] }] });
    expect(normalized).toStrictEqual({ list: { 2: { [ERRORS_KEY]: ['bad'] } } });
  });

  it('leaves out the null and undefined children of an object, keeping the others', () => {
    const kept = { [ERRORS_KEY]: ['kept'] };
    const normalized = normalizeErrorSchema({ first: kept, empty: undefined, nothing: null, last: kept });
    expect(normalized).toStrictEqual({ first: kept, last: kept });
  });

  it('leaves the __errors arrays of messages as they are', () => {
    const messages = ['bad'];
    const normalized = normalizeErrorSchema({ list: [{ [ERRORS_KEY]: messages }] });
    expect(normalized).toEqual({ list: { 0: { [ERRORS_KEY]: ['bad'] } } });
    expect(normalized.list[0][ERRORS_KEY]).toBe(messages);
  });

  it('copies a __proto__ key in a rewritten node as a plain key', () => {
    const item = JSON.parse(`{ "__proto__": { "${ERRORS_KEY}": ["bad"] } }`) as Record<string, unknown>;
    const normalized = normalizeErrorSchema({ list: [item] });
    const node: object = normalized.list[0];
    expect(Object.getPrototypeOf(node)).toBe(Object.prototype);
    expect(Object.hasOwn(node, '__proto__')).toBe(true);
  });
});
