import { isAdditionalRemoveDisabled } from '../src/index.ts';

const onRemoveProperty = () => {};

describe('isAdditionalRemoveDisabled()', () => {
  it('enables the remove button of an editable field it can remove', () => {
    expect(isAdditionalRemoveDisabled({ disabled: false, readonly: false, onRemoveProperty })).toBe(false);
  });

  it('disables the remove button of a disabled field', () => {
    expect(isAdditionalRemoveDisabled({ disabled: true, readonly: false, onRemoveProperty })).toBe(true);
  });

  it('disables the remove button of a read-only field', () => {
    expect(isAdditionalRemoveDisabled({ disabled: false, readonly: true, onRemoveProperty })).toBe(true);
  });

  it('disables the remove button without a remove callback', () => {
    expect(isAdditionalRemoveDisabled({ disabled: false, readonly: false })).toBe(true);
  });
});
