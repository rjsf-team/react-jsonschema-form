import { isFormDataAvailable } from '../src';

const TEST_CASES = [
  { value: undefined, result: false },
  { value: null, result: false },
  { value: [], result: true },
  { value: {}, result: false },
  { value: true, result: true },
  { value: 1, result: true },
  { value: 'string', result: true },
  { value: [1], result: true },
  { value: { foo: true }, result: true },
];

describe.each(TEST_CASES)('hasFormData(%s)', ({ value, result }) => {
  test(`hasFormData(value) returns ${result}`, () => {
    expect(isFormDataAvailable(value)).toEqual(result);
  });
});
