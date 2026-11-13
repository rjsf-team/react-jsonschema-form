import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { getRenderedOptionUiSchema } from '../src/index.ts';

describe('getRenderedOptionUiSchema()', () => {
  const parent: RJSFSchema = { type: 'object', additionalProperties: true };
  const takingExtraKeys: RJSFSchema = { oneOf: [{ properties: { x: { type: 'string' } } }] };
  const uiSchema: UiSchema = {
    'ui:options': { expandable: false },
    additionalProperties: { 'ui:widget': 'textarea' },
    oneOf: [{ 'ui:title': 'A' }],
  };
  const optionUiSchema: UiSchema = { 'ui:title': 'A' };

  it("lays the object's say over its extra keys beneath the uiSchema of an option taking them", () => {
    expect(getRenderedOptionUiSchema(parent, takingExtraKeys, uiSchema, optionUiSchema)).toEqual({
      'ui:title': 'A',
      'ui:options': { expandable: false },
      additionalProperties: { 'ui:widget': 'textarea' },
    });
  });
  it('lays either one beneath it alone where the object has only that one', () => {
    expect(getRenderedOptionUiSchema(parent, takingExtraKeys, { 'ui:expandable': false }, optionUiSchema)).toEqual({
      'ui:title': 'A',
      'ui:options': { expandable: false },
    });
  });
  it("keeps what the option's own uiSchema says over the object's", () => {
    const own: UiSchema = { 'ui:expandable': true, additionalProperties: { 'ui:widget': 'text' } };
    expect(getRenderedOptionUiSchema(parent, takingExtraKeys, uiSchema, own)).toBe(own);
    expect(
      getRenderedOptionUiSchema(parent, takingExtraKeys, { additionalProperties: {} }, { 'ui:expandable': true }),
    ).toEqual({
      'ui:expandable': true,
      additionalProperties: {},
    });
  });
  it("returns the option's uiSchema as it is where the option takes no extra key of the object's, or there is none to add", () => {
    expect(getRenderedOptionUiSchema(parent, { properties: {} }, uiSchema, optionUiSchema)).toBe(optionUiSchema);
    expect(getRenderedOptionUiSchema({ type: 'array' }, takingExtraKeys, uiSchema, optionUiSchema)).toBe(
      optionUiSchema,
    );
    expect(getRenderedOptionUiSchema(parent, takingExtraKeys, uiSchema, uiSchema)).toBe(uiSchema);
    expect(getRenderedOptionUiSchema(parent, takingExtraKeys, undefined, optionUiSchema)).toBe(optionUiSchema);
    expect(getRenderedOptionUiSchema(parent, takingExtraKeys, uiSchema, undefined)).toBeUndefined();
    expect(getRenderedOptionUiSchema(parent, takingExtraKeys, { oneOf: [{}] }, optionUiSchema)).toBe(optionUiSchema);
  });
});
