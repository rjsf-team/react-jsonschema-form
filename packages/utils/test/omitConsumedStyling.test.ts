import { UI_OPTIONS_KEY, omitConsumedStyling } from '../src/index.ts';

describe('omitConsumedStyling()', () => {
  it('returns undefined for no uiSchema', () => {
    expect(omitConsumedStyling()).toBeUndefined();
  });

  // The identity matters: a field memoizing the result would otherwise hand its children a new object every render
  it('returns the same object when there is nothing to strip', () => {
    const uiSchema = { 'ui:title': 'Name', [UI_OPTIONS_KEY]: { widget: 'radio' } };

    expect(omitConsumedStyling(uiSchema)).toBe(uiSchema);
  });

  it('strips the ui: spellings, leaving the rest alone', () => {
    expect(
      omitConsumedStyling({ 'ui:classNames': 'custom', 'ui:style': { color: 'red' }, 'ui:title': 'Name' }),
    ).toEqual({ 'ui:title': 'Name' });
  });

  it('strips a bare classNames', () => {
    expect(omitConsumedStyling({ classNames: 'custom', 'ui:title': 'Name' })).toEqual({ 'ui:title': 'Name' });
  });

  it('strips the ui:options spellings, keeping the options beside them', () => {
    expect(
      omitConsumedStyling({ [UI_OPTIONS_KEY]: { classNames: 'custom', style: { color: 'red' }, widget: 'radio' } }),
    ).toEqual({ [UI_OPTIONS_KEY]: { widget: 'radio' } });
  });

  it('leaves the ui:options object alone when only a ui: spelling is consumed', () => {
    const uiOptions = { widget: 'radio' };

    expect(omitConsumedStyling({ 'ui:classNames': 'custom', [UI_OPTIONS_KEY]: uiOptions })).toEqual({
      [UI_OPTIONS_KEY]: uiOptions,
    });
  });

  // The uiSchema reaching a custom field has not necessarily been through `resolveUiSchema()`, so `ui:options` is not
  // known to be an object; `in` throws on anything else
  it('ignores a ui:options that is not an object', () => {
    const uiSchema = { [UI_OPTIONS_KEY]: 'classNames', 'ui:title': 'Name' };

    // @ts-expect-error -- the whole point is a uiSchema that does not respect the type
    expect(omitConsumedStyling(uiSchema)).toBe(uiSchema);
  });

  it('does not mutate the uiSchema it is given', () => {
    const uiSchema = { 'ui:classNames': 'custom', [UI_OPTIONS_KEY]: { style: { color: 'red' } } };

    omitConsumedStyling(uiSchema);

    expect(uiSchema).toEqual({ 'ui:classNames': 'custom', [UI_OPTIONS_KEY]: { style: { color: 'red' } } });
  });
});
