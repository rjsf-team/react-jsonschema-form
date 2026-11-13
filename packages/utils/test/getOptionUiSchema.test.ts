import { ANY_OF_KEY, ONE_OF_KEY } from '../src/constants.ts';
import getOptionUiSchema, { selectOptionUiSchema } from '../src/getOptionUiSchema.ts';
import type { UiSchema } from '../src/types.ts';

describe('selectOptionUiSchema()', () => {
  it('returns the uiSchema at the given index when the array reaches it', () => {
    const optionsUiSchema: UiSchema[] = [{ a: { 'ui:widget': 'textarea' } }, { b: { 'ui:widget': 'radio' } }];
    const uiSchema: UiSchema = { 'ui:widget': 'fallback' };
    expect(selectOptionUiSchema(optionsUiSchema, uiSchema, 1)).toBe(optionsUiSchema[1]);
  });

  it('falls back to uiSchema when the array does not reach the given index', () => {
    const optionsUiSchema: UiSchema[] = [{ a: { 'ui:widget': 'textarea' } }];
    const uiSchema: UiSchema = { 'ui:widget': 'fallback' };
    expect(selectOptionUiSchema(optionsUiSchema, uiSchema, 1)).toBe(uiSchema);
  });

  it('falls back to uiSchema when optionsUiSchema is undefined', () => {
    const uiSchema: UiSchema = { 'ui:widget': 'fallback' };
    expect(selectOptionUiSchema(undefined, uiSchema, 0)).toBe(uiSchema);
  });

  it('falls back to uiSchema for a negative index, even when the array has entries', () => {
    // Matches MultiSchemaField's cleared-selection state (selectedOption === -1): a declared `uiSchema.oneOf`/`anyOf`
    // array must not be indexed with -1 when nothing is selected.
    const optionsUiSchema: UiSchema[] = [{ a: { 'ui:widget': 'textarea' } }];
    const uiSchema: UiSchema = { 'ui:widget': 'fallback' };
    expect(selectOptionUiSchema(optionsUiSchema, uiSchema, -1)).toBe(uiSchema);
  });
});

describe('getOptionUiSchema()', () => {
  it('returns the uiSchema at the given index when uiSchema[oneOf] is an array reaching it', () => {
    const uiSchema: UiSchema = { [ONE_OF_KEY]: [{ a: { 'ui:widget': 'textarea' } }, { b: { 'ui:widget': 'radio' } }] };
    expect(getOptionUiSchema(uiSchema, ONE_OF_KEY, 1)).toBe(uiSchema[ONE_OF_KEY]![1]);
  });

  it('returns the uiSchema at the given index when uiSchema[anyOf] is an array reaching it', () => {
    const uiSchema: UiSchema = { [ANY_OF_KEY]: [{ a: { 'ui:widget': 'textarea' } }, { b: { 'ui:widget': 'radio' } }] };
    expect(getOptionUiSchema(uiSchema, ANY_OF_KEY, 1)).toBe(uiSchema[ANY_OF_KEY]![1]);
  });

  it('falls back to uiSchema when uiSchema[keyword] is not an array', () => {
    const uiSchema: UiSchema = { [ONE_OF_KEY]: { 'ui:widget': 'not-an-array' } as unknown as UiSchema[] };
    expect(getOptionUiSchema(uiSchema, ONE_OF_KEY, 0)).toBe(uiSchema);
  });

  it('falls back to uiSchema when the array does not reach the given index', () => {
    const uiSchema: UiSchema = { [ONE_OF_KEY]: [{ a: { 'ui:widget': 'textarea' } }] };
    expect(getOptionUiSchema(uiSchema, ONE_OF_KEY, 1)).toBe(uiSchema);
  });

  it('returns undefined when uiSchema itself is undefined', () => {
    expect(getOptionUiSchema(undefined, ONE_OF_KEY, 0)).toBeUndefined();
  });
});
