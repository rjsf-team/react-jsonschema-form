import { isAdditionalKeyDisabled } from '../src/index.ts';

const onKeyRenameBlur = () => {};

describe('isAdditionalKeyDisabled()', () => {
  it('enables the key of an editable field it can rename', () => {
    expect(isAdditionalKeyDisabled({ disabled: false, readonly: false, onKeyRenameBlur })).toBe(false);
  });

  it('disables the key of a disabled field', () => {
    expect(isAdditionalKeyDisabled({ disabled: true, readonly: false, onKeyRenameBlur })).toBe(true);
  });

  it('disables the key of a read-only field', () => {
    expect(isAdditionalKeyDisabled({ disabled: false, readonly: true, onKeyRenameBlur })).toBe(true);
  });

  it('disables the key without a rename callback', () => {
    expect(isAdditionalKeyDisabled({ disabled: false, readonly: false })).toBe(true);
  });
});
