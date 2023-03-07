import { ErrorSchemaBuilder, ERRORS_KEY, ErrorSchema } from '../src';

const AN_ERROR = 'an error';
const SOME_ERRORS = ['error1', 'error2'];
const STRING_PATH = 'foo';
const ARRAY_PATH = ['bar', 'baz'];

const INITIAL_ROOT = 'initial root';
const INITIAL_STRING = 'initial string path';
const INITIAL_ARRAY = 'initial array path';

// We have to cast to ErrorSchema because the type is not meant for building
const INITIAL_SCHEMA: ErrorSchema = {
  [ERRORS_KEY]: [INITIAL_ROOT],
  [STRING_PATH]: {
    [ERRORS_KEY]: [INITIAL_STRING],
  } as ErrorSchema,
  [ARRAY_PATH[0]]: {
    [ARRAY_PATH[1]]: {
      [ERRORS_KEY]: [INITIAL_ARRAY],
    },
  },
} as ErrorSchema;

describe('ErrorSchemaBuilder', () => {
  describe('no initial schema', () => {
    let builder: ErrorSchemaBuilder;
    beforeAll(() => {
      builder = new ErrorSchemaBuilder();
    });
    it('returns an empty error schema after construction', () => {
      expect(builder.ErrorSchema).toEqual({});
    });
    it('adding error string without a path puts it into the root', () => {
      expect(builder.addErrors(AN_ERROR).ErrorSchema).toEqual({
        [ERRORS_KEY]: [AN_ERROR],
      });
    });
    it('setting error string list without a path replaces at the root', () => {
      expect(builder.setErrors(SOME_ERRORS).ErrorSchema).toEqual({
        [ERRORS_KEY]: SOME_ERRORS,
      });
    });
    it('clearing errors without a path clears them from the root', () => {
      expect(builder.clearErrors().ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
      });
    });
    it('adding error string with a string path puts it at the path', () => {
      expect(builder.addErrors(AN_ERROR, STRING_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [AN_ERROR],
        },
      });
    });
    it('setting error string list with a string path replaces errors at the path', () => {
      expect(builder.setErrors(SOME_ERRORS, STRING_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: SOME_ERRORS,
        },
      });
    });
    it('clearing errors with a string path clears them the path', () => {
      expect(builder.clearErrors(STRING_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
      });
    });
    it('adding error string with a string[] path puts it at the path', () => {
      expect(builder.addErrors(AN_ERROR, ARRAY_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [AN_ERROR],
          },
        },
      });
    });
    it('setting error string list with a string[] path replaces errors at the path', () => {
      expect(builder.setErrors(SOME_ERRORS, ARRAY_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: SOME_ERRORS,
          },
        },
      });
    });
    it('setting error string with a new path set errors at the path', () => {
      expect(builder.setErrors(AN_ERROR, ['another', 'path']).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: SOME_ERRORS,
          },
        },
        another: {
          path: {
            [ERRORS_KEY]: [AN_ERROR],
          },
        },
      });
    });
    it('clearing errors with a string[] path clears them the path', () => {
      expect(builder.clearErrors(ARRAY_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [],
          },
        },
        another: {
          path: {
            [ERRORS_KEY]: [AN_ERROR],
          },
        },
      });
    });
    it('clearing errors with a new path creates an empty block', () => {
      expect(builder.clearErrors('newPath').ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [],
          },
        },
        another: {
          path: {
            [ERRORS_KEY]: [AN_ERROR],
          },
        },
        newPath: {
          [ERRORS_KEY]: [],
        },
      });
    });
    it('resetting error restores things back to an empty object', () => {
      expect(builder.resetAllErrors().ErrorSchema).toEqual({});
    });
  });
  describe('using initial schema', () => {
    let builder: ErrorSchemaBuilder;
    beforeAll(() => {
      builder = new ErrorSchemaBuilder(INITIAL_SCHEMA);
    });
    it('returns the INITIAL_SCHEMA after construction', () => {
      expect(builder.ErrorSchema).toEqual(INITIAL_SCHEMA);
    });
    it('adding error array with an empty array as a path puts it into the root', () => {
      expect(builder.addErrors(SOME_ERRORS, []).ErrorSchema).toEqual({
        [ERRORS_KEY]: [INITIAL_ROOT, ...SOME_ERRORS],
        [STRING_PATH]: {
          [ERRORS_KEY]: [INITIAL_STRING],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [INITIAL_ARRAY],
          },
        },
      });
    });
    it('setting error string without a path replaces at the root', () => {
      expect(builder.setErrors(AN_ERROR).ErrorSchema).toEqual({
        [ERRORS_KEY]: [AN_ERROR],
        [STRING_PATH]: {
          [ERRORS_KEY]: [INITIAL_STRING],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [INITIAL_ARRAY],
          },
        },
      });
    });
    it('clearing errors without a path clears them from the root', () => {
      expect(builder.clearErrors().ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [INITIAL_STRING],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [INITIAL_ARRAY],
          },
        },
      });
    });
    it('adding error string with a string path puts it at the path', () => {
      expect(builder.addErrors(AN_ERROR, STRING_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [INITIAL_STRING, AN_ERROR],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [INITIAL_ARRAY],
          },
        },
      });
    });
    it('setting error string list with a string path replaces errors at the path', () => {
      expect(builder.setErrors(SOME_ERRORS, STRING_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: SOME_ERRORS,
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [INITIAL_ARRAY],
          },
        },
      });
    });
    it('clearing errors with a string path clears them the path', () => {
      expect(builder.clearErrors(STRING_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [INITIAL_ARRAY],
          },
        },
      });
    });
    it('adding error string with a string[] path puts it at the path', () => {
      expect(builder.addErrors(AN_ERROR, ARRAY_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [INITIAL_ARRAY, AN_ERROR],
          },
        },
      });
    });
    it('setting error string list with a string[] path replaces errors at the path', () => {
      expect(builder.setErrors(SOME_ERRORS, ARRAY_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: SOME_ERRORS,
          },
        },
      });
    });
    it('clearing errors with a string[] path clears them the path', () => {
      expect(builder.clearErrors(ARRAY_PATH).ErrorSchema).toEqual({
        [ERRORS_KEY]: [],
        [STRING_PATH]: {
          [ERRORS_KEY]: [],
        },
        [ARRAY_PATH[0]]: {
          [ARRAY_PATH[1]]: {
            [ERRORS_KEY]: [],
          },
        },
      });
    });
    it('resetting error restores things back to the INITIAL_SCHEMA', () => {
      expect(builder.resetAllErrors(INITIAL_SCHEMA).ErrorSchema).toEqual(INITIAL_SCHEMA);
    });
  });
});
