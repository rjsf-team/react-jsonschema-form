import type { MockInstance } from 'vitest';

import getItemUiSchemaForItem from '../src/getItemUiSchemaForItem.ts';
import type { FieldPath, RJSFSchema, UiSchema } from '../src/index.ts';

describe('getItemUiSchemaForItem()', () => {
  describe('naming the item when the uiSchema.items function throws', () => {
    const error = new Error('boom');
    const uiSchema: UiSchema = {
      items: () => {
        throw error;
      },
    };
    let consoleErrorStub: MockInstance<typeof console.error>;

    beforeEach(() => {
      consoleErrorStub = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      consoleErrorStub.mockRestore();
    });

    it('names the item by its path within the array it belongs to', () => {
      expect(getItemUiSchemaForItem(uiSchema, {}, 1, undefined, 'people' as FieldPath)).toBeUndefined();
      expect(consoleErrorStub).toHaveBeenCalledWith(
        'Error executing dynamic uiSchema.items function for people[1]:',
        error,
      );
    });

    it('names the index alone when no array path was given', () => {
      // A caller with no `FieldPath` to pass must not get `[1]`, which is the root array's own item: a real path it
      // never supplied, and one that would dedupe against a different array's identical failure
      expect(getItemUiSchemaForItem(uiSchema, {}, 1)).toBeUndefined();
      expect(consoleErrorStub).toHaveBeenCalledWith(
        'Error executing dynamic uiSchema.items function for item at index 1:',
        error,
      );
    });
  });

  describe('given the array schema', () => {
    const fromFunction: UiSchema = { 'ui:widget': 'textarea' };
    const firstUiSchema: UiSchema = { 'ui:initialValue': 'first' };
    const restUiSchema: UiSchema = { 'ui:initialValue': 'rest' };

    it('resolves the function form for an item past prefixItems, and not for a prefixItems position', () => {
      const items = vi.fn(() => fromFunction);
      const schema: RJSFSchema = { type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'string' } };
      const uiSchema: UiSchema = { prefixItems: [firstUiSchema], items };
      expect(getItemUiSchemaForItem(uiSchema, 'a', 0, undefined, undefined, schema)).toBe(firstUiSchema);
      expect(items).not.toHaveBeenCalled();
      expect(getItemUiSchemaForItem(uiSchema, 'b', 1, undefined, undefined, schema)).toBe(fromFunction);
      expect(items).toHaveBeenCalledWith('b', 1, undefined);
    });

    it('reads uiSchema.additionalItems past a tuple items, rather than the function form', () => {
      const items = vi.fn(() => fromFunction);
      const schema: RJSFSchema = { type: 'array', items: [{ type: 'string' }], additionalItems: { type: 'string' } };
      const uiSchema: UiSchema = { items, additionalItems: restUiSchema };
      expect(getItemUiSchemaForItem(uiSchema, 'b', 1, undefined, undefined, schema)).toBe(restUiSchema);
      expect(items).not.toHaveBeenCalled();
      expect(getItemUiSchemaForItem(uiSchema, 'a', 0, undefined, undefined, schema)).toBe(fromFunction);
    });
  });
});
