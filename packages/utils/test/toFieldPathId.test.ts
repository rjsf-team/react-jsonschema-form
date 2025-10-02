import { DEFAULT_ID_PREFIX, DEFAULT_ID_SEPARATOR, ID_KEY, toFieldPathId } from '../src';

const GLOBAL_FORM_OPTIONS = {
  idPrefix: DEFAULT_ID_PREFIX,
  idSeparator: DEFAULT_ID_SEPARATOR,
};

const ONE = 'one';
const ONE_ID = `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}${ONE}`;

describe('toFieldPathId()', () => {
  test('fieldPath is empty string', () => {
    expect(toFieldPathId('', GLOBAL_FORM_OPTIONS)).toEqual({ path: [], [ID_KEY]: DEFAULT_ID_PREFIX });
  });
  test('no parent path, string fieldPath', () => {
    const path = 'one';
    expect(toFieldPathId(path, GLOBAL_FORM_OPTIONS)).toEqual({
      [ID_KEY]: ONE_ID,
      path: [path],
    });
  });
  test('no parent path, number fieldPath', () => {
    const path = 1;
    expect(toFieldPathId(path, GLOBAL_FORM_OPTIONS)).toEqual({
      [ID_KEY]: `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}${path}`,
      path: [path],
    });
  });
  test('parent path ID, string fieldPath', () => {
    const path = 'two';
    const parentPath = { [ID_KEY]: ONE_ID, path: [ONE] };
    expect(toFieldPathId(path, GLOBAL_FORM_OPTIONS, parentPath)).toEqual({
      [ID_KEY]: `${ONE_ID}${DEFAULT_ID_SEPARATOR}${path}`,
      path: [ONE, path],
    });
  });
  test('parent path ID, number fieldPath', () => {
    const path = 1;
    const parentPath = { [ID_KEY]: ONE_ID, path: [ONE] };
    expect(toFieldPathId(path, GLOBAL_FORM_OPTIONS, parentPath)).toEqual({
      [ID_KEY]: `${ONE_ID}${DEFAULT_ID_SEPARATOR}${path}`,
      path: [ONE, path],
    });
  });
  test('parent path list, string fieldPath', () => {
    const path = 'two';
    const parentPath = [ONE];
    expect(toFieldPathId(path, GLOBAL_FORM_OPTIONS, parentPath)).toEqual({
      [ID_KEY]: `${ONE_ID}${DEFAULT_ID_SEPARATOR}${path}`,
      path: [...parentPath, path],
    });
  });
  test('parent path list, number fieldPath', () => {
    const path = 1;
    const parentPath = [ONE, 'two'];
    expect(toFieldPathId(path, GLOBAL_FORM_OPTIONS, parentPath)).toEqual({
      [ID_KEY]: `${ONE_ID}${DEFAULT_ID_SEPARATOR}${parentPath[1]}${DEFAULT_ID_SEPARATOR}${path}`,
      path: [...parentPath, path],
    });
  });
  test('fieldPath empty string, parent path list', () => {
    const path = '';
    const parentPath = [ONE];
    expect(toFieldPathId(path, GLOBAL_FORM_OPTIONS, parentPath)).toEqual({
      [ID_KEY]: ONE_ID,
      path: [...parentPath],
    });
  });
  test('fieldPath empty string, parent path list', () => {
    const path = '';
    const parentPath = [ONE, 'two'];
    expect(toFieldPathId(path, GLOBAL_FORM_OPTIONS, parentPath)).toEqual({
      [ID_KEY]: `${ONE_ID}${DEFAULT_ID_SEPARATOR}${parentPath[1]}`,
      path: [...parentPath],
    });
  });
});
