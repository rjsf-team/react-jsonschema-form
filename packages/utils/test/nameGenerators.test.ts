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
});
