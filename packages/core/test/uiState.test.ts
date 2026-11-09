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
    uiState.selectFallbackType(at(0), 'object,number', 'number', owner);
    const before = uiState.save();

    uiState.move(fieldPathFromList(['pets']), (key) => String(1 - Number(key)));
    expect(uiState.fallbackType(at(0), 'object,number')).toBeUndefined();
    expect(uiState.fallbackType(at(1), 'object,number')).toEqual({ type: 'number', owner });

    uiState.restore(before);
    expect(uiState.fallbackType(at(0), 'object,number')).toEqual({ type: 'number', owner });
  });

  it('keep the type of each type list at a path apart', () => {
    const uiState = createUiState();
    uiState.selectFallbackType(at(0), 'object,number', 'number', owner);
    uiState.keepFallbackType(at(0), 'string,boolean', 'boolean', owner);

    expect(uiState.fallbackType(at(0), 'object,number')?.type).toBe('number');
    expect(uiState.fallbackType(at(0), 'string,boolean')?.type).toBe('boolean');
  });
});
