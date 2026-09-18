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

  it('returns the entry at `index` for the tuple (array) form of uiSchema.items', () => {
    const firstUiSchema: UiSchema = { 'ui:initialValue': 'first' };
    const secondUiSchema: UiSchema = { 'ui:initialValue': 'second' };
    const uiSchema: UiSchema = { items: [firstUiSchema, secondUiSchema] };
    expect(getStaticItemsUiSchema(uiSchema, 0)).toBe(firstUiSchema);
    expect(getStaticItemsUiSchema(uiSchema, 1)).toBe(secondUiSchema);
  });

  it('returns undefined for the tuple (array) form of uiSchema.items when no index is given', () => {
    const uiSchema: UiSchema = { items: [{ 'ui:initialValue': 'first' }] };
    expect(getStaticItemsUiSchema(uiSchema)).toBeUndefined();
  });
});
