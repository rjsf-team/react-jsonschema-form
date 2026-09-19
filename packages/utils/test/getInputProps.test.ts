import type { RJSFSchema, UIOptionsType } from '../src/index.ts';
import { getInputProps } from '../src/index.ts';

const EXPONENT = '([eE][+\\-]?[0-9]+)?';
const NUMBER_PATTERN = `-?[0-9]*[.]?[0-9]*${EXPONENT}`;

describe('getInputProps', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns type=text when no other data is passed', () => {
    expect(getInputProps({})).toEqual({ type: 'text' });
  });
  it('returns type and autoComplete from options when provided', () => {
    const options: UIOptionsType = { inputType: 'password', autocomplete: 'on' };
    expect(getInputProps({}, 'text', options)).toEqual({
      type: options.inputType,
      autoComplete: options.autocomplete,
    });
  });
  it('returns autoCapitalize from options when provided', () => {
    const options: UIOptionsType = { autocapitalize: 'words' };
    expect(getInputProps({}, 'text', options)).toEqual({
      type: 'text',
      autoCapitalize: options.autocapitalize,
    });
  });
  it('returns type and accept from options when provided', () => {
    const options: UIOptionsType = { accept: '.pdf' };
    expect(getInputProps({}, 'file', options)).toEqual({
      type: 'file',
      accept: options.accept,
    });
  });
  it('returns type=defaultType even when schema has type', () => {
    const schema: RJSFSchema = {
      type: 'number',
    };
    expect(getInputProps(schema, 'date')).toEqual({ type: 'date' });
  });
  it('returns type=text, inputMode=decimal and a pattern, with no step, when schema has number type', () => {
    const schema: RJSFSchema = {
      type: 'number',
    };
    expect(getInputProps(schema)).toEqual({
      type: 'text',
      inputMode: 'decimal',
      pattern: NUMBER_PATTERN,
    });
  });
  it('accepts both "." and the locale decimal separator in the pattern when the separator is not "."', () => {
    vi.stubGlobal('navigator', { languages: ['pl'] });
    const schema: RJSFSchema = {
      type: 'number',
    };
    expect(getInputProps(schema)).toEqual({
      type: 'text',
      inputMode: 'decimal',
      pattern: `-?[0-9]*[.,]?[0-9]*${EXPONENT}`,
    });
  });
  it('returns type=number when schema has number type and an explicit inputType overrides the locale', () => {
    vi.stubGlobal('navigator', { languages: ['pl'] });
    const schema: RJSFSchema = {
      type: 'number',
    };
    const options: UIOptionsType = { inputType: 'number' };
    expect(getInputProps(schema, undefined, options)).toEqual({ type: 'number' });
  });
  it('keeps step, min and max for an explicit inputType of number', () => {
    const schema: RJSFSchema = {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      multipleOf: 5,
    };
    const options: UIOptionsType = { inputType: 'number' };
    expect(getInputProps(schema, undefined, options)).toEqual({ type: 'number', step: 5, min: 0, max: 100 });
  });
  it('returns type=text, inputMode=numeric and a pattern for integer schemas regardless of the locale decimal separator', () => {
    vi.stubGlobal('navigator', { languages: ['pl'] });
    const schema: RJSFSchema = {
      type: 'integer',
    };
    expect(getInputProps(schema)).toEqual({ type: 'text', inputMode: 'numeric', pattern: `-?[0-9]*${EXPONENT}` });
  });
  it('returns type=number when schema has number type and we are not auto-defaulting', () => {
    const schema: RJSFSchema = {
      type: 'number',
    };
    expect(getInputProps(schema, undefined, undefined, false)).toEqual({
      type: schema.type,
    });
  });
  it('returns type=text when schema has number type, the locale decimal separator is not "." and we are not auto-defaulting', () => {
    vi.stubGlobal('navigator', { languages: ['pl'] });
    const schema: RJSFSchema = {
      type: 'number',
    };
    expect(getInputProps(schema, undefined, undefined, false)).toEqual({ type: 'text' });
  });
  it('returns type=number and step=1 when schema has integer type and we are not auto-defaulting', () => {
    const schema: RJSFSchema = {
      type: 'integer',
    };
    expect(getInputProps(schema, undefined, undefined, false)).toEqual({ type: 'number', step: 1 });
  });
  it('keeps the multipleOf, minimum and maximum of an integer as step, min and max when not auto-defaulting', () => {
    const schema: RJSFSchema = {
      type: 'integer',
      multipleOf: 5,
      minimum: 0,
      maximum: 100,
    };
    expect(getInputProps(schema, undefined, undefined, false)).toEqual({ type: 'number', step: 5, min: 0, max: 100 });
  });
  it('leaves step, min and max off a number rendered as a text input, whatever the schema range is', () => {
    const schema: RJSFSchema = {
      type: 'number',
      multipleOf: 2.1,
      minimum: -5,
      maximum: 5,
    };
    expect(getInputProps(schema)).toEqual({
      type: 'text',
      inputMode: 'decimal',
      pattern: NUMBER_PATTERN,
    });
  });
  it('returns no leading minus in the pattern when schema has a non-negative integer minimum', () => {
    const schema: RJSFSchema = {
      type: 'integer',
      minimum: 0,
    };
    expect(getInputProps(schema)).toEqual({
      type: 'text',
      inputMode: 'numeric',
      pattern: `[0-9]*${EXPONENT}`,
    });
  });
  it('allows a leading minus in the pattern when the schema has a negative minimum', () => {
    const schema: RJSFSchema = {
      type: 'integer',
      minimum: -10,
    };
    expect(getInputProps(schema)).toEqual({
      type: 'text',
      inputMode: 'numeric',
      pattern: `-?[0-9]*${EXPONENT}`,
    });
  });
  describe('numeric pattern', () => {
    // Browsers compile a `pattern` with the `v` flag, and ignore one that does not compile
    const matches = (pattern: string, value: string) => new RegExp(`^(?:${pattern})$`, 'v').test(value);

    it('compiles under the `v` flag and accepts every string JavaScript renders for a number', () => {
      const pattern = getInputProps({ type: 'number' }).pattern!;
      ['0', '1.5', '-2', '.5', '', '1e-7', '1.5e-9', '-1e21', '1e+21', '123456789012345680000'].forEach((value) => {
        expect(matches(pattern, value)).toBe(true);
      });
      [String(0.0000001), String(1e21), String(-1.5e-9)].forEach((value) => {
        expect(matches(pattern, value)).toBe(true);
      });
    });
    it('rejects a non-numeric string for a number', () => {
      const pattern = getInputProps({ type: 'number' }).pattern!;
      ['yo', '1,5', '1e', '1e--2', '1.2.3', '12a'].forEach((value) => {
        expect(matches(pattern, value)).toBe(false);
      });
    });
    it('accepts a "." and the locale separator for a number in a locale whose separator is not "."', () => {
      vi.stubGlobal('navigator', { languages: ['pl'] });
      const pattern = getInputProps({ type: 'number' }).pattern!;
      ['1.5', '1,5', '1,5e-9'].forEach((value) => {
        expect(matches(pattern, value)).toBe(true);
      });
      expect(matches(pattern, '1;5')).toBe(false);
    });
    it('compiles under the `v` flag and accepts the string JavaScript renders for a large integer', () => {
      const pattern = getInputProps({ type: 'integer' }).pattern!;
      [String(1e21), '-42', '7'].forEach((value) => {
        expect(matches(pattern, value)).toBe(true);
      });
      ['1.5', 'yo'].forEach((value) => {
        expect(matches(pattern, value)).toBe(false);
      });
    });
  });
  it('returns min from formatMinimum when defaultType is date', () => {
    const schema: RJSFSchema = { formatMinimum: '2020-01-01' };
    expect(getInputProps(schema, 'date')).toEqual({ type: 'date', min: '2020-01-01' });
  });
  it('returns max from formatMaximum when defaultType is date', () => {
    const schema: RJSFSchema = { formatMaximum: '2030-12-31' };
    expect(getInputProps(schema, 'date')).toEqual({ type: 'date', max: '2030-12-31' });
  });
  it('returns min and max from formatMinimum/formatMaximum when defaultType is date', () => {
    const schema: RJSFSchema = { formatMinimum: '2020-01-01', formatMaximum: '2030-12-31' };
    expect(getInputProps(schema, 'date')).toEqual({ type: 'date', min: '2020-01-01', max: '2030-12-31' });
  });
  it('returns min and max from formatMinimum/formatMaximum when defaultType is datetime-local', () => {
    const schema: RJSFSchema = { formatMinimum: '2020-01-01T00:00', formatMaximum: '2030-12-31T23:59' };
    expect(getInputProps(schema, 'datetime-local')).toEqual({
      type: 'datetime-local',
      min: '2020-01-01T00:00',
      max: '2030-12-31T23:59',
    });
  });
  it('does not set min/max from formatMinimum/formatMaximum for non-date input types', () => {
    const schema: RJSFSchema = { formatMinimum: '2020-01-01', formatMaximum: '2030-12-31' };
    expect(getInputProps(schema, 'text')).toEqual({ type: 'text' });
  });
});
