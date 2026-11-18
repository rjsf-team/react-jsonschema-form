import { nonEmptyErrorMessages } from '../src/index.ts';

describe('nonEmptyErrorMessages()', () => {
  it('drops an empty message and keeps a numeric 0, as untyped error data can hold either', () => {
    expect(nonEmptyErrorMessages(['a', '', null, undefined, false, true, 0])).toEqual(['a', 0]);
  });
});
