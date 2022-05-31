import { schemaRequiresTrueValue } from '../src';

describe('schemaRequiresTrueValue()', () => {
  it('const', () => {
    expect(schemaRequiresTrueValue({ const: true })).toBe(true);
  });
  it('enum with multiple', () => {
    expect(schemaRequiresTrueValue({ enum: [true, false] })).toBe(false);
  });
  it('enum with one', () => {
    expect(schemaRequiresTrueValue({ enum: [true] })).toBe(true);
  });
  it('anyOf with multiple', () => {
    expect(
      schemaRequiresTrueValue({
        anyOf: [{ type: 'string' }, { type: 'number' }],
      })
    ).toBe(false);
  });
  it('anyOf with one that would require true', () => {
    expect(
      schemaRequiresTrueValue({
        anyOf: [{ const: true }],
      })
    ).toBe(true);
  });
  it('anyOf with one that would not require true', () => {
    expect(
      schemaRequiresTrueValue({
        anyOf: [{ type: 'string' }],
      })
    ).toBe(false);
  });
  it('oneOf with multiple', () => {
    expect(
      schemaRequiresTrueValue({
        oneOf: [{ type: 'string' }, { type: 'number' }],
      })
    ).toBe(false);
  });
  it('oneOf with one that would require true', () => {
    expect(
      schemaRequiresTrueValue({
        oneOf: [{ const: true }],
      })
    ).toBe(true);
  });
  it('oneOf with one that would not require true', () => {
    expect(
      schemaRequiresTrueValue({
        oneOf: [{ type: 'string' }],
      })
    ).toBe(false);
  });
  it('allOf with multiple', () => {
    expect(
      schemaRequiresTrueValue({
        allOf: [{ type: 'string' }, { type: 'number' }],
      })
    ).toBe(false);
  });
  it('allOf with one that would require true', () => {
    expect(
      schemaRequiresTrueValue({
        allOf: [{ const: true }],
      })
    ).toBe(true);
  });
  it('allOf with one that would not require true', () => {
    expect(
      schemaRequiresTrueValue({
        allOf: [{ type: 'string' }],
      })
    ).toBe(false);
  });
  it('simply doesn`t require true', () => {
    expect(schemaRequiresTrueValue({ type: 'string' })).toBe(false);
  });
});
