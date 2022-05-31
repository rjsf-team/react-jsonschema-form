import { guessType } from '../src';

describe('guessType()', () => {
  it('should guess the type of array values', () => {
    expect(guessType([1, 2, 3])).toEqual('array');
  });

  it('should guess the type of string values', () => {
    expect(guessType('foobar')).toEqual('string');
  });

  it('should guess the type of null values', () => {
    expect(guessType(null)).toEqual('null');
  });

  it('should treat undefined values as null values', () => {
    expect(guessType(undefined)).toEqual('null');
  });

  it('should guess the type of boolean values', () => {
    expect(guessType(true)).toEqual('boolean');
  });

  it('should guess the type of object values', () => {
    expect(guessType({})).toEqual('object');
  });

  it('falls through to string', () => {
    expect(guessType(NaN)).toEqual('string');
  });
});
