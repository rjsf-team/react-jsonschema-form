import type { FormValidation } from '../src/index.ts';
import { createErrorHandler, getByPath, toPath, unwrapErrorHandler, ERRORS_KEY } from '../src/index.ts';
import { TEST_FORM_DATA, ERROR_MAPPER, TEST_ERROR_SCHEMA } from './testUtils/testData.ts';

const EMPTY_WRAPPER = createErrorHandler(null);
const POPULATED_WRAPPER: FormValidation = Object.entries(ERROR_MAPPER).reduce(
  (validation: FormValidation, [key, value]) => {
    const propValidation: FormValidation | undefined = key
      ? getByPath<FormValidation>(validation, toPath(key))
      : validation;
    propValidation?.addError(value);
    return validation;
  },
  createErrorHandler(TEST_FORM_DATA),
);

describe('unwrapErrorHandler()', () => {
  it('an empty FormValidation returns an empty ErrorSchema', () => {
    expect(unwrapErrorHandler(EMPTY_WRAPPER)).toEqual({ [ERRORS_KEY]: [] });
  });
  it('A fully loaded FormValidation returns the associated ErrorSchema', () => {
    expect(unwrapErrorHandler(POPULATED_WRAPPER)).toEqual(TEST_ERROR_SCHEMA);
  });
  it('strips the addError() functions from an array of item handlers, keying the items by index', () => {
    const handler = createErrorHandler({ list: [{ name: 'a' }, { name: 'b' }] });
    handler.list![1]!.name!.addError('taken');
    const returned = { ...handler, list: [handler.list![0], handler.list![1]] } as unknown as FormValidation;
    expect(unwrapErrorHandler(returned)).toStrictEqual({
      [ERRORS_KEY]: [],
      list: {
        0: { [ERRORS_KEY]: [], name: { [ERRORS_KEY]: [] } },
        1: { [ERRORS_KEY]: [], name: { [ERRORS_KEY]: ['taken'] } },
      },
    });
  });
  it('leaves out the null and undefined children of an array of item handlers and of an object', () => {
    const handler = createErrorHandler({ list: ['a', 'b'] });
    handler.list![1]!.addError('taken');
    const returned = { ...handler, list: [null, handler.list![1]], other: undefined } as unknown as FormValidation;
    expect(unwrapErrorHandler(returned)).toStrictEqual({
      [ERRORS_KEY]: [],
      list: { 1: { [ERRORS_KEY]: ['taken'] } },
    });
  });
});
