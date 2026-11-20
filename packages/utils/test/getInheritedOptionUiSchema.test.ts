import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { getInheritedOptionUiSchema } from '../src/index.ts';

describe('getInheritedOptionUiSchema()', () => {
  const schema: RJSFSchema = { anyOf: [{ type: 'string' }, { anyOf: [{ type: 'number' }, { type: 'boolean' }] }] };
  const option: RJSFSchema = { type: 'string' };

  it("gives an option with no entry of its own the field's uiSchema, without the field's list", () => {
    const uiSchema: UiSchema = { 'ui:required': true, 'ui:title': 'T', anyOf: [{ 'ui:widget': 'textarea' }] };
    expect(getInheritedOptionUiSchema(schema, option, uiSchema, uiSchema, 'anyOf')).toEqual({
      'ui:required': true,
      'ui:title': 'T',
    });
  });

  it("hands the field's `ui:required` on to an option's entry that leaves its own unset", () => {
    const uiSchema: UiSchema = { 'ui:required': true, anyOf: [{ 'ui:widget': 'textarea' }] };
    expect(getInheritedOptionUiSchema(schema, option, uiSchema, { 'ui:widget': 'textarea' }, 'anyOf')).toEqual({
      'ui:widget': 'textarea',
      'ui:required': true,
    });
  });

  it.each<[string, UiSchema]>([
    ['`ui:required`', { 'ui:required': false }],
    ['`ui:options.required`', { 'ui:options': { required: false } }],
  ])("keeps an option's own %s over the field's", (_, entry) => {
    expect(getInheritedOptionUiSchema(schema, option, { 'ui:required': true }, entry, 'anyOf')).toBe(entry);
  });

  it('returns the entry as it is where the field sets no `ui:required`', () => {
    const entry: UiSchema = { 'ui:widget': 'textarea' };
    expect(getInheritedOptionUiSchema(schema, option, { 'ui:title': 'T' }, entry, 'anyOf')).toBe(entry);
    expect(getInheritedOptionUiSchema(schema, option, undefined, entry, 'anyOf')).toBe(entry);
  });

  it("hands the field's `ui:required` on where no option is shown", () => {
    const entry: UiSchema = { 'ui:widget': 'textarea' };
    expect(getInheritedOptionUiSchema(schema, null, { 'ui:required': true }, entry, 'anyOf')).toEqual({
      'ui:widget': 'textarea',
      'ui:required': true,
    });
  });

  it("hands the field's `ui:required` on where no entry is picked", () => {
    expect(getInheritedOptionUiSchema(schema, option, { 'ui:required': true }, undefined, 'anyOf')).toEqual({
      'ui:required': true,
    });
  });

  it('returns undefined with no uiSchema at all', () => {
    expect(getInheritedOptionUiSchema(schema, option, undefined, undefined, 'anyOf')).toBeUndefined();
  });
});
