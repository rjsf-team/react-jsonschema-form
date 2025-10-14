import { bracketNameGenerator, dotNotationNameGenerator } from '../src';

describe('bracketNameGenerator()', () => {
  test('returns "root" for empty path', () => {
    expect(bracketNameGenerator([], 'root')).toBe('root');
  });

  test('generates name for single string segment', () => {
    expect(bracketNameGenerator(['firstName'], 'root')).toBe('root[firstName]');
  });

  test('generates name for single number segment (array index)', () => {
    expect(bracketNameGenerator([0], 'root')).toBe('root[0]');
  });

  test('generates name for nested object path', () => {
    expect(bracketNameGenerator(['user', 'address', 'city'], 'root')).toBe('root[user][address][city]');
  });

  test('generates name for array with object properties', () => {
    expect(bracketNameGenerator(['tasks', 0, 'title'], 'root')).toBe('root[tasks][0][title]');
  });

  test('generates name for nested arrays', () => {
    expect(bracketNameGenerator(['matrix', 0, 1], 'root')).toBe('root[matrix][0][1]');
  });

  test('generates name for complex nested structure', () => {
    expect(bracketNameGenerator(['users', 0, 'addresses', 1, 'street'], 'root')).toBe(
      'root[users][0][addresses][1][street]',
    );
  });

  test('appends [] for multi-value fields (checkboxes, multi-select)', () => {
    expect(bracketNameGenerator(['hobbies'], 'root', true)).toBe('root[hobbies][]');
  });

  test('does not append [] when isMultiValue is false', () => {
    expect(bracketNameGenerator(['hobbies'], 'root', false)).toBe('root[hobbies]');
  });

  test('does not append [] when isMultiValue is undefined', () => {
    expect(bracketNameGenerator(['hobbies'], 'root')).toBe('root[hobbies]');
  });

  test('appends [] to nested path when isMultiValue is true', () => {
    expect(bracketNameGenerator(['user', 'hobbies'], 'root', true)).toBe('root[user][hobbies][]');
  });
});

describe('dotNotationNameGenerator()', () => {
  test('returns "root" for empty path', () => {
    expect(dotNotationNameGenerator([], 'root')).toBe('root');
  });

  test('generates name for single string segment', () => {
    expect(dotNotationNameGenerator(['firstName'], 'root')).toBe('root.firstName');
  });

  test('generates name for single number segment (array index)', () => {
    expect(dotNotationNameGenerator([0], 'root')).toBe('root.0');
  });

  test('generates name for nested object path', () => {
    expect(dotNotationNameGenerator(['user', 'address', 'city'], 'root')).toBe('root.user.address.city');
  });

  test('generates name for array with object properties', () => {
    expect(dotNotationNameGenerator(['tasks', 0, 'title'], 'root')).toBe('root.tasks.0.title');
  });

  test('generates name for nested arrays', () => {
    expect(dotNotationNameGenerator(['matrix', 0, 1], 'root')).toBe('root.matrix.0.1');
  });

  test('generates name for complex nested structure', () => {
    expect(dotNotationNameGenerator(['users', 0, 'addresses', 1, 'street'], 'root')).toBe(
      'root.users.0.addresses.1.street',
    );
  });

  test('isMultiValue flag has no effect in dot notation', () => {
    expect(dotNotationNameGenerator(['hobbies'], 'root', true)).toBe('root.hobbies');
  });

  test('isMultiValue flag false has no effect in dot notation', () => {
    expect(dotNotationNameGenerator(['hobbies'], 'root', false)).toBe('root.hobbies');
  });
});
