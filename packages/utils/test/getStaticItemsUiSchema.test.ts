import getStaticItemsUiSchema from '../src/getStaticItemsUiSchema.ts';
import type { UiSchema } from '../src/index.ts';

describe('getStaticItemsUiSchema()', () => {
  it('returns undefined when uiSchema is undefined', () => {
    expect(getStaticItemsUiSchema(undefined)).toBeUndefined();
  });

  it('returns undefined when uiSchema.items is undefined', () => {
    const uiSchema: UiSchema = { 'ui:widget': 'textarea' };
    expect(getStaticItemsUiSchema(uiSchema)).toBeUndefined();
  });

  it('returns the plain-object form of uiSchema.items', () => {
    const itemsUiSchema: UiSchema = { name: { 'ui:initialValue': 'Anonymous' } };
    const uiSchema: UiSchema = { items: itemsUiSchema };
    expect(getStaticItemsUiSchema(uiSchema)).toBe(itemsUiSchema);
  });

  it('returns undefined for the dynamic (itemData, index, formContext) => UiSchema function form', () => {
    const uiSchema: UiSchema = { items: () => ({ name: { 'ui:initialValue': 'Anonymous' } }) };
    expect(getStaticItemsUiSchema(uiSchema)).toBeUndefined();
  });
});
