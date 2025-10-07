import { NameGeneratorFunction, FieldPathList } from './types';

/**
 * Generates bracketed names
 * Example: root[tasks][0][title]
 */
export const bracketNameGenerator: NameGeneratorFunction = (path: FieldPathList, idPrefix: string): string => {
  if (!path || path.length === 0) {
    return idPrefix;
  }

  return path.reduce<string>((acc, pathUnit, index) => {
    if (index === 0) {
      return `${idPrefix}[${String(pathUnit)}]`;
    }
    return `${acc}[${String(pathUnit)}]`;
  }, '');
};

/**
 * Generates dot-notation names
 * Example: root.tasks.0.title
 */
export const dotNotationNameGenerator: NameGeneratorFunction = (path: FieldPathList, idPrefix: string): string => {
  if (!path || path.length === 0) {
    return idPrefix;
  }

  return `${idPrefix}.${path.map(String).join('.')}`;
};
