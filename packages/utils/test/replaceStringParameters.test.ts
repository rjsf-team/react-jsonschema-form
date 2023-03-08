import { replaceStringParameters } from '../src';

const PARAMS = ['one', 'two'];
const FUNKY_PARAMS = ['o%20n%20e'];
const REPLACEABLE = 'String with %1 replaceable parameters %2';
const REPLACED = 'String with one replaceable parameters two';
const NO_REPLACEABLE = 'String without replaceable parameter';
const REPLACED_FUNKY = 'String with o%20n%20e replaceable parameters %2';

describe('replaceStringParameters()', () => {
  it('returns inputString when there are no parameters', () => {
    expect(replaceStringParameters(REPLACEABLE)).toBe(REPLACEABLE);
  });
  it('returns same string as input string when there are no replaceable params', () => {
    expect(replaceStringParameters(NO_REPLACEABLE, PARAMS)).toEqual(NO_REPLACEABLE);
  });
  it('returns string as input string when there are no replaceable params', () => {
    expect(replaceStringParameters(REPLACEABLE, PARAMS)).toEqual(REPLACED);
  });
  it('returns string with funky strings when replaceable params', () => {
    expect(replaceStringParameters(REPLACEABLE, FUNKY_PARAMS)).toEqual(REPLACED_FUNKY);
  });
});
