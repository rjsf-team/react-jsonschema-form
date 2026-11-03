import { acceptAttribute } from '../src/index.ts';

describe('acceptAttribute()', () => {
  it('returns a string as it is', () => {
    expect(acceptAttribute('.png,.jpg')).toBe('.png,.jpg');
  });
  it('joins an array of strings', () => {
    expect(acceptAttribute(['.png', 'image/*'])).toBe('.png,image/*');
  });
  it('leaves out the entries of an array that are not strings', () => {
    expect(acceptAttribute(['.png', {}, 5, null, '.jpg'])).toBe('.png,.jpg');
  });
  it('leaves out the empty and blank entries of an array', () => {
    expect(acceptAttribute(['', '.png', ' '])).toBe('.png');
  });
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['true', true],
    ['a number', 5],
    ['an object', {}],
    ['an empty array', []],
    ['an array holding no strings', [{}, 5]],
    ['a blank string', ' '],
    ['an array of empty strings', ['', '']],
    ['an array of blank strings', [' ', '\t']],
  ])('returns undefined for %s', (_, accept) => {
    expect(acceptAttribute(accept)).toBeUndefined();
  });
});
