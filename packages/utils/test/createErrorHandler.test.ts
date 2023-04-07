import { createErrorHandler, ERRORS_KEY } from '../src';
import { TEST_FORM_DATA } from './testUtils/testData';

const SOME_ERROR = 'some error';

describe('createErrorHandler()', () => {
  it('returns a simple handler for simple type', () => {
    expect(createErrorHandler('foo')).toEqual({
      [ERRORS_KEY]: [],
      addError: expect.any(Function),
    });
  });
  it('expect returned FormValidation.addError() adds error to itself', () => {
    const formValidation = createErrorHandler(5);
    formValidation.addError(SOME_ERROR);
    expect(formValidation[ERRORS_KEY]).toEqual([SOME_ERROR]);
  });
  it('returns a handler that maps to the form data with objects and arrays', () => {
    expect(createErrorHandler(TEST_FORM_DATA)).toEqual({
      [ERRORS_KEY]: [],
      addError: expect.any(Function),
      foo: { [ERRORS_KEY]: [], addError: expect.any(Function) },
      list: {
        [ERRORS_KEY]: [],
        addError: expect.any(Function),
        '0': { [ERRORS_KEY]: [], addError: expect.any(Function) },
        '1': { [ERRORS_KEY]: [], addError: expect.any(Function) },
      },
      nested: {
        [ERRORS_KEY]: [],
        addError: expect.any(Function),
        baz: { [ERRORS_KEY]: [], addError: expect.any(Function) },
        blah: { [ERRORS_KEY]: [], addError: expect.any(Function) },
      },
    });
  });
});
