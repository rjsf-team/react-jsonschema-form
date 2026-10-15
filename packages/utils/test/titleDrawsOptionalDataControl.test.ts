import { titleDrawsOptionalDataControl } from '../src/index.ts';

describe('titleDrawsOptionalDataControl()', () => {
  it('lays the control out in a heading that is drawn', () => {
    expect(titleDrawsOptionalDataControl({ title: 'Tags' })).toBe(true);
  });

  it('lays the control out elsewhere where no heading is drawn', () => {
    expect(titleDrawsOptionalDataControl({ title: '' })).toBe(false);
  });

  it.each(['readonly', 'disabled'])('lays the control out elsewhere for a %s container', (flag) => {
    expect(titleDrawsOptionalDataControl({ title: 'Tags', [flag]: true })).toBe(false);
  });
});
