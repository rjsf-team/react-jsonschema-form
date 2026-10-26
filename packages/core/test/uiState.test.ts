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
