import { getDescribedControlAttributes } from '../src/index.ts';

describe('getDescribedControlAttributes()', () => {
  it('describes a control by the ids given, and marks it invalid while errors show', () => {
    expect(getDescribedControlAttributes(['root__error', 'root__description'], ['is required'])).toEqual({
      'aria-describedby': 'root__error root__description',
      'aria-invalid': true,
    });
  });

  it('leaves out what there is nothing to say about', () => {
    expect(getDescribedControlAttributes([], [])).toEqual({});
  });
});
