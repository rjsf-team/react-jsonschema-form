import getStaticItemsUiSchema, { getItemsUiSchemaKey } from '../src/getStaticItemsUiSchema.ts';
import type { RJSFSchema, UiSchema } from '../src/index.ts';

describe('getItemsUiSchemaKey()', () => {
  const prefixItems: RJSFSchema = { type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'number' } };
  const tuple: RJSFSchema = { type: 'array', items: [{ type: 'string' }], additionalItems: { type: 'number' } };
  it.each<[string, RJSFSchema, number, string]>([
    ['a prefixItems position', prefixItems, 0, 'prefixItems'],
    ['an item past prefixItems', prefixItems, 1, 'items'],
    ['a tuple items position', tuple, 0, 'items'],
    ['an item past a tuple items', tuple, 1, 'additionalItems'],
    ['an item of a list', { type: 'array', items: { type: 'number' } }, 3, 'items'],
    ['a boolean prefixItems position', { prefixItems: [true] }, 0, 'prefixItems'],
    ['an item of a tuple items holding a boolean, which is no tuple', { items: [true] }, 1, 'items'],
  ])('names the key of %s', (_, schema, index, key) => {
    expect(getItemsUiSchemaKey(schema, index)).toBe(key);
  });
});

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

  describe('given the array schema', () => {
    const firstUiSchema: UiSchema = { 'ui:initialValue': 'first' };
    const restUiSchema: UiSchema = { 'ui:initialValue': 'rest' };

    it('reads a prefixItems position from uiSchema.prefixItems, and the items past it from uiSchema.items', () => {
      const schema: RJSFSchema = { type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'string' } };
      const uiSchema: UiSchema = { prefixItems: [firstUiSchema], items: restUiSchema };
      expect(getStaticItemsUiSchema(uiSchema, 0, schema)).toBe(firstUiSchema);
      expect(getStaticItemsUiSchema(uiSchema, 1, schema)).toBe(restUiSchema);
      expect(getStaticItemsUiSchema({ items: restUiSchema }, 0, schema)).toBeUndefined();
    });

    it('reads a tuple items position from uiSchema.items, and the items past it from uiSchema.additionalItems', () => {
      const schema: RJSFSchema = { type: 'array', items: [{ type: 'string' }], additionalItems: { type: 'string' } };
      const uiSchema: UiSchema = { items: [firstUiSchema], additionalItems: restUiSchema };
      expect(getStaticItemsUiSchema(uiSchema, 0, schema)).toBe(firstUiSchema);
      expect(getStaticItemsUiSchema(uiSchema, 1, schema)).toBe(restUiSchema);
    });

    it('reads a list item from uiSchema.items', () => {
      const schema: RJSFSchema = { type: 'array', items: { type: 'string' } };
      expect(getStaticItemsUiSchema({ items: restUiSchema, additionalItems: firstUiSchema }, 2, schema)).toBe(
        restUiSchema,
      );
    });
  });
});
