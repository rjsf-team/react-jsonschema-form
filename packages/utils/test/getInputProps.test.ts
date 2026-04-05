import { getInputProps, RJSFSchema, UIOptionsType } from '../src';

describe('getInputProps', () => {
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
  it('returns type=number, step=any when schema has number type', () => {
    const schema: RJSFSchema = {
      type: 'number',
    };
    expect(getInputProps(schema)).toEqual({ type: schema.type, step: 'any' });
  });
  it('returns type=number when schema has number type and we are not auto-defaulting', () => {
    const schema: RJSFSchema = {
      type: 'number',
    };
    expect(getInputProps(schema, undefined, undefined, false)).toEqual({
      type: schema.type,
    });
  });
  it('returns type=number, step=multipleOf when schema has number type and multipleOf', () => {
    const schema: RJSFSchema = {
      type: 'number',
      multipleOf: 2.1,
    };
    expect(getInputProps(schema)).toEqual({
      type: schema.type,
      step: schema.multipleOf,
    });
  });
  it('returns type=number, step=1, min=minimum when schema has integer type and minimum', () => {
    const schema: RJSFSchema = {
      type: 'integer',
      minimum: 0,
    };
    expect(getInputProps(schema)).toEqual({
      type: 'number',
      step: 1,
      min: schema.minimum,
    });
  });
  it('returns type=number, step=multipleOf, max=maximum when schema has integer type, multipleOf and maximum', () => {
    const schema: RJSFSchema = {
      type: 'integer',
      multipleOf: 5,
      maximum: 100,
    };
    expect(getInputProps(schema)).toEqual({
      type: 'number',
      step: schema.multipleOf,
      max: schema.maximum,
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
