import { callerInputProps } from '../src/index.ts';

describe('callerInputProps()', () => {
  it('holds nothing for props that name neither', () => {
    expect(callerInputProps({})).toEqual({});
  });

  it('keeps a pattern, an inputMode, an accept and a multiple', () => {
    expect(callerInputProps({ pattern: '[A-Z]+', inputMode: 'tel', accept: '.png', multiple: true })).toEqual({
      pattern: '[A-Z]+',
      inputMode: 'tel',
      accept: '.png',
      multiple: true,
    });
  });

  it('keeps a pattern named as undefined, which turns the derived one off', () => {
    expect(Object.keys(callerInputProps({ pattern: undefined }))).toEqual(['pattern']);
  });

  it('keeps an inputMode named as undefined, which turns the derived one off', () => {
    expect(Object.keys(callerInputProps({ inputMode: undefined }))).toEqual(['inputMode']);
  });

  it('leaves out an accept and a multiple that are undefined', () => {
    expect(Object.keys(callerInputProps({ accept: undefined, multiple: undefined }))).toEqual([]);
  });
});
