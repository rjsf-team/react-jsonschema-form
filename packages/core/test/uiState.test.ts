import { fieldPathFromList } from '@rjsf/utils';

import { createUiState, withSelectionsAsOf } from '../src/components/uiState.ts';

describe('withSelectionsAsOf()', () => {
  const path = fieldPathFromList(['pet']);

  it("holds each selection for the reset's data and keeps none of the data from before the reset", () => {
    const uiState = createUiState();
    const before = { name: 'Rex' };
    uiState.select(path, '#/definitions', 1, [before]);

    const otherData = withSelectionsAsOf(uiState, () => ({ name: 'Tom' }));
    expect(otherData.selection(path, '#/definitions')).toEqual({ index: 1, pick: 1, holdsFor: [], isReleased: false });

    const sameData = withSelectionsAsOf(uiState, () => ({ name: 'Rex' }));
    expect(sameData.selection(path, '#/definitions')).toEqual({
      index: 1,
      pick: 1,
      holdsFor: [{ name: 'Rex' }],
      isReleased: false,
    });
  });

  it('leaves the live selections as they are', () => {
    const uiState = createUiState();
    const before = { name: 'Rex' };
    uiState.select(path, '#/definitions', 1, [before]);

    withSelectionsAsOf(uiState, () => ({ name: 'Tom' }));

    expect(uiState.selection(path, '#/definitions')?.holdsFor[0]).toBe(before);
  });
});

describe('fallback UI types', () => {
  const at = (index: number) => fieldPathFromList(['pets', index]);
  const owner = {};

  it('follow the array items they were picked for as the items move, and come back on restore()', () => {
    const uiState = createUiState();
    const kept = { type: 'number', typeList: 'object,number', owner } as const;
    uiState.selectFallbackType(at(0), '1', kept);
    const before = uiState.save();

    uiState.move(fieldPathFromList(['pets']), (key) => String(1 - Number(key)));
    expect(uiState.fallbackType(at(0), '1')).toBeUndefined();
    expect(uiState.fallbackType(at(1), '1')).toEqual(kept);

    uiState.restore(before);
    expect(uiState.fallbackType(at(0), '1')).toEqual(kept);
  });

  it('keep the type of each selector at a path apart', () => {
    const uiState = createUiState();
    uiState.selectFallbackType(at(0), '1', { type: 'number', typeList: 'object,number', owner });
    uiState.keepFallbackType(at(0), '2', { type: 'boolean', typeList: 'string,boolean', owner });

    expect(uiState.fallbackType(at(0), '1')?.type).toBe('number');
    expect(uiState.fallbackType(at(0), '2')?.type).toBe('boolean');
  });
});
