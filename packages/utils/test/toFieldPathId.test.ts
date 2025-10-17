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

  describe('with nameGenerator', () => {
    const phpNameGenerator = (path: (string | number)[], idPrefix: string) => {
      if (path.length === 0) {
        return idPrefix;
      }
      const segments = path.map((segment) => `[${segment}]`).join('');
      return `${idPrefix}${segments}`;
    };

    const GLOBAL_FORM_OPTIONS_WITH_NAME_GENERATOR = {
      idPrefix: DEFAULT_ID_PREFIX,
      idSeparator: DEFAULT_ID_SEPARATOR,
      nameGenerator: phpNameGenerator,
    };

    test('generates name for string fieldPath', () => {
      const path = 'firstName';
      const result = toFieldPathId(path, GLOBAL_FORM_OPTIONS_WITH_NAME_GENERATOR);
      expect(result).toEqual({
        [ID_KEY]: `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}${path}`,
        path: [path],
        name: 'root[firstName]',
      });
    });

    test('generates name for nested object path', () => {
      const parentPath = ['tasks', 0];
      const path = 'title';
      const result = toFieldPathId(path, GLOBAL_FORM_OPTIONS_WITH_NAME_GENERATOR, parentPath);
      expect(result).toEqual({
        [ID_KEY]: `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}tasks${DEFAULT_ID_SEPARATOR}0${DEFAULT_ID_SEPARATOR}${path}`,
        path: [...parentPath, path],
        name: 'root[tasks][0][title]',
      });
    });

    test('generates name for array index', () => {
      const parentPath = ['listOfStrings'];
      const path = 0;
      const result = toFieldPathId(path, GLOBAL_FORM_OPTIONS_WITH_NAME_GENERATOR, parentPath);
      expect(result).toEqual({
        [ID_KEY]: `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}listOfStrings${DEFAULT_ID_SEPARATOR}${path}`,
        path: [...parentPath, path],
        name: 'root[listOfStrings][0]',
      });
    });

    test('does not generate name for empty path', () => {
      const result = toFieldPathId('', GLOBAL_FORM_OPTIONS_WITH_NAME_GENERATOR);
      expect(result).toEqual({
        [ID_KEY]: DEFAULT_ID_PREFIX,
        path: [],
      });
    });

    test('generates name with isMultiValue flag for multi-select fields', () => {
      const phpMultiValueNameGenerator = (path: (string | number)[], idPrefix: string, isMultiValue?: boolean) => {
        if (path.length === 0) {
          return idPrefix;
        }
        const segments = path.map((segment) => `[${segment}]`).join('');
        const baseName = `${idPrefix}${segments}`;
        return isMultiValue ? `${baseName}[]` : baseName;
      };

      const GLOBAL_FORM_OPTIONS_WITH_MULTI_VALUE = {
        idPrefix: DEFAULT_ID_PREFIX,
        idSeparator: DEFAULT_ID_SEPARATOR,
        nameGenerator: phpMultiValueNameGenerator,
      };

      const parentPath = ['hobbies'];
      const result = toFieldPathId('', GLOBAL_FORM_OPTIONS_WITH_MULTI_VALUE, parentPath, true);
      expect(result).toEqual({
        [ID_KEY]: `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}hobbies`,
        path: parentPath,
        name: 'root[hobbies][]',
      });
    });

    test('generates name without brackets when isMultiValue is false', () => {
      const phpMultiValueNameGenerator = (path: (string | number)[], idPrefix: string, isMultiValue?: boolean) => {
        if (path.length === 0) {
          return idPrefix;
        }
        const segments = path.map((segment) => `[${segment}]`).join('');
        const baseName = `${idPrefix}${segments}`;
        return isMultiValue ? `${baseName}[]` : baseName;
      };

      const GLOBAL_FORM_OPTIONS_WITH_MULTI_VALUE = {
        idPrefix: DEFAULT_ID_PREFIX,
        idSeparator: DEFAULT_ID_SEPARATOR,
        nameGenerator: phpMultiValueNameGenerator,
      };

      const parentPath = ['firstName'];
      const result = toFieldPathId('', GLOBAL_FORM_OPTIONS_WITH_MULTI_VALUE, parentPath, false);
      expect(result).toEqual({
        [ID_KEY]: `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}firstName`,
        path: parentPath,
        name: 'root[firstName]',
      });
    });
  });
});
