import { callerInputProps } from '../src/index.ts';

describe('callerInputProps()', () => {
  it('holds nothing for props that name neither', () => {
    expect(callerInputProps({})).toEqual({});
  });

  it('keeps a pattern and an accept', () => {
    expect(callerInputProps({ pattern: '[A-Z]+', accept: '.png' })).toEqual({
      pattern: '[A-Z]+',
      accept: '.png',
    });
  });

  it('keeps a pattern named as undefined, which turns the derived one off', () => {
    expect(Object.keys(callerInputProps({ pattern: undefined }))).toEqual(['pattern']);
  });

  it('leaves out an accept that is undefined', () => {
    expect(Object.keys(callerInputProps({ accept: undefined }))).toEqual([]);
  });
});
