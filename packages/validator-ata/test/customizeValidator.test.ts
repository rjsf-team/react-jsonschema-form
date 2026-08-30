import customizeValidator from '../src/customizeValidator.ts';
import type { Localizer } from '../src/index.ts';
import defaultValidator from '../src/index.ts';
import ATAValidator from '../src/validator.ts';
import { CUSTOM_OPTIONS } from './harness/testData.ts';

describe('customizeValidator()', () => {
  it('default export is an ATAValidator instance', () => {
    expect(defaultValidator).toBeInstanceOf(ATAValidator);
  });

  it('customizeValidator with no options returns an ATAValidator', () => {
    const v = customizeValidator();
    expect(v).toBeInstanceOf(ATAValidator);
  });

  it('forwards options through the constructor', () => {
    const v = customizeValidator(CUSTOM_OPTIONS);
    expect(v).toBeInstanceOf(ATAValidator);
    // The options object is held internally; localizer is undefined here.
    expect(v.localizer).toBeUndefined();
    expect(v.options).toBe(CUSTOM_OPTIONS);
  });

  it('forwards a localizer through the constructor', () => {
    const localizer: Localizer = vi.fn();
    const v = customizeValidator({}, localizer);
    expect(v.localizer).toBe(localizer);
  });

  it('honors suppressDuplicateFiltering passthrough', () => {
    const v = customizeValidator({ suppressDuplicateFiltering: 'all' });
    expect(v.suppressDuplicateFiltering).toBe('all');
  });
});
