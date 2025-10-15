import { renderHook } from '@testing-library/react';

import { FieldPathId, ID_KEY, useFieldPathId } from '../src';

const ID_1 = 'id-1';
const ID_2 = 'id-2';
const FIELD_PATH_ID_1: FieldPathId = { [ID_KEY]: ID_1, path: [ID_1] };
const FIELD_PATH_ID_1A: FieldPathId = { ...FIELD_PATH_ID_1 };
const FIELD_PATH_ID_2: FieldPathId = { [ID_KEY]: ID_2, path: [ID_2] };

describe('useFieldPathId()', () => {
  test('initial use returns the given FieldPathId', () => {
    const { result } = renderHook(() => useFieldPathId(FIELD_PATH_ID_1));
    expect(result.current).toBe(FIELD_PATH_ID_1);
  });
  test('second use returns the original FieldPathId for same field info', () => {
    const { result, rerender } = renderHook(({ newFieldPathId }) => useFieldPathId(newFieldPathId), {
      initialProps: { newFieldPathId: FIELD_PATH_ID_1 },
    });
    expect(result.current).toBe(FIELD_PATH_ID_1);
    rerender({ newFieldPathId: FIELD_PATH_ID_1A });
    expect(result.current).toBe(FIELD_PATH_ID_1);
  });
  test('second use returns the new FieldPathId for different field info', () => {
    const { result, rerender } = renderHook(({ newFieldPathId }) => useFieldPathId(newFieldPathId), {
      initialProps: { newFieldPathId: FIELD_PATH_ID_1 },
    });
    expect(result.current).toBe(FIELD_PATH_ID_1);
    rerender({ newFieldPathId: FIELD_PATH_ID_2 });
    expect(result.current).toBe(FIELD_PATH_ID_2);
  });
});
