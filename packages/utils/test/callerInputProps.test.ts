import { callerInputProps } from '../src/index.ts';

describe('callerInputProps()', () => {
  it('holds nothing for props that name neither', () => {
    expect(callerInputProps({})).toEqual({});
  });

  it('keeps a pattern, an inputMode and an accept', () => {
    expect(callerInputProps({ pattern: '[A-Z]+', inputMode: 'tel', accept: '.png' })).toEqual({
      pattern: '[A-Z]+',
      inputMode: 'tel',
      accept: '.png',
    });
  });

  it('keeps a pattern named as undefined, which turns the derived one off', () => {
    expect(Object.keys(callerInputProps({ pattern: undefined }))).toEqual(['pattern']);
  });

  it('keeps an inputMode named as undefined, which turns the derived one off', () => {
    expect(Object.keys(callerInputProps({ inputMode: undefined }))).toEqual(['inputMode']);
  });

  it('leaves out an accept that is undefined', () => {
    expect(Object.keys(callerInputProps({ accept: undefined }))).toEqual([]);
  });
});
