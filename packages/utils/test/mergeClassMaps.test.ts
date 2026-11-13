import type { FormClassMap } from '../src/index.ts';
import { mergeClassMaps } from '../src/index.ts';

describe('mergeClassMaps()', () => {
  it('returns an empty map when there is nothing to merge', () => {
    expect(mergeClassMaps()).toStrictEqual({});
    expect(mergeClassMaps(undefined, {})).toStrictEqual({});
  });

  it('layers the maps key by key, a later class replacing the one beneath', () => {
    expect(mergeClassMaps({ input: 'a', select: 'b' }, { input: 'c' }, undefined, { input: '' })).toStrictEqual({
      input: '',
      select: 'b',
    });
  });

  it('keeps the class beneath an entry that is neither a class nor a function', () => {
    const layer = { input: null, select: false, textarea: undefined } as unknown as FormClassMap;

    expect(mergeClassMaps({ input: 'a', select: 'b', textarea: 'c' }, layer)).toStrictEqual({
      input: 'a',
      select: 'b',
      textarea: 'c',
    });
  });

  it('calls a function entry with the class beneath it', () => {
    expect(mergeClassMaps({ input: 'a' }, { input: (base) => `${base} b` })).toStrictEqual({ input: 'a b' });
  });

  it('composes function entries until a class is there to call them with', () => {
    const merged = mergeClassMaps({ input: (base) => `${base} a` }, { input: (base) => `${base} b` });
    const { input } = merged;

    expect(typeof input).toBe('function');
    expect(typeof input === 'function' && input('core')).toBe('core a b');
    expect(mergeClassMaps({ input: 'core' }, merged)).toStrictEqual({ input: 'core a b' });
  });
});
