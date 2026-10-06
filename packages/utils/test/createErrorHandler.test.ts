import { createErrorHandler, ERRORS_KEY, unwrapErrorHandler } from '../src/index.ts';
import { TEST_FORM_DATA } from './testUtils/testData.ts';

const SOME_ERROR = 'some error';

describe('createErrorHandler()', () => {
  it('preserves errors for a field named __proto__ without replacing the handler prototype', () => {
    const data: { __proto__: { x: number }; a: number } = JSON.parse('{"__proto__":{"x":1},"a":1}');
    const errors = createErrorHandler(data);
    errors.__proto__.addError('proto error');
    errors.__proto__.x.addError('nested error');
    errors.a.addError('a error');
    expect(Object.hasOwn(errors, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(errors)).toBe(Object.prototype);
    expect(unwrapErrorHandler(errors)).toEqual(
      JSON.parse(
        '{"__errors":[],"__proto__":{"__errors":["proto error"],"x":{"__errors":["nested error"]}},"a":{"__errors":["a error"]}}',
      ),
    );
  });

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
