import defaultValidator, { customizeValidator } from '../src/index.ts';
import CFWorkerValidator from '../src/validator.ts';
import { CUSTOM_OPTIONS } from './harness/testData.ts';

vi.mock('../src/validator');

interface TestType {
  foo: string;
  bar: boolean;
}

describe('customizeValidator()', () => {
  it('creates the default validator with default options', () => {
    expect(defaultValidator).toBeInstanceOf(CFWorkerValidator);
    expect(CFWorkerValidator).toHaveBeenCalledWith({});
  });

  it('passes custom options to the validator', () => {
    vi.mocked(CFWorkerValidator).mockClear();
    const custom = customizeValidator<TestType>(CUSTOM_OPTIONS);
    expect(custom).toBeInstanceOf(CFWorkerValidator);
    expect(CFWorkerValidator).toHaveBeenCalledWith(CUSTOM_OPTIONS);
  });
});
