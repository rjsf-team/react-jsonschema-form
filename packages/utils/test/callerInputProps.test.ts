import type { BaseInputTemplateProps } from '../src/index.ts';
import { callerInputProps } from '../src/index.ts';

const props = {} as BaseInputTemplateProps;

describe('callerInputProps()', () => {
  it('holds nothing for props that name neither', () => {
    expect(callerInputProps(props)).toEqual({});
  });

  it('keeps a pattern and an accept', () => {
    expect(callerInputProps({ ...props, pattern: '[A-Z]+', accept: '.png' })).toEqual({
      pattern: '[A-Z]+',
      accept: '.png',
    });
  });

  it('keeps a pattern named as undefined, which turns the derived one off', () => {
    expect(Object.keys(callerInputProps({ ...props, pattern: undefined }))).toEqual(['pattern']);
  });

  it('leaves out an accept that is undefined', () => {
    expect(Object.keys(callerInputProps({ ...props, accept: undefined }))).toEqual([]);
  });
});
