import getItemUiSchemaForItem from '../src/getItemUiSchemaForItem.ts';
import type { FieldPath, UiSchema } from '../src/index.ts';

describe('getItemUiSchemaForItem()', () => {
  describe('naming the item when the uiSchema.items function throws', () => {
    const error = new Error('boom');
    const uiSchema: UiSchema = {
      items: () => {
        throw error;
      },
    };
    let consoleErrorStub: ReturnType<typeof vi.spyOn>;

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
});
