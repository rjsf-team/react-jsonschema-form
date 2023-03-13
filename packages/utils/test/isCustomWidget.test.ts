import { isCustomWidget } from '../src';

describe('isCustomWidget()', () => {
  it('When the function is called with no uiSchema it returns false', () => {
    expect(isCustomWidget()).toBe(false);
  });
  it('When the function is called with a custom widget in the uiSchema it returns true', () => {
    expect(isCustomWidget({ 'ui:widget': 'MyAwesomeWidget' })).toBe(true);
  });
  it('When the function is called without a custom widget in the schema it returns false', () => {
    expect(isCustomWidget({ 'ui:fields': 'randomString' })).toBe(false);
  });
});
