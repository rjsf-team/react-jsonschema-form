import { NameGeneratorFunction, PathSegment } from './types';

/**
 * Generates bracketed names
 * Example: root[tasks][0][title]
 */
export const bracketNameGenerator: NameGeneratorFunction = (segments: PathSegment[], rootName = 'root'): string => {
  if (!segments || segments.length === 0) {
    return rootName;
  }

  return segments.reduce((acc, segment, index) => {
    if (index === 0 && rootName) {
      return `${rootName}[${segment.key}]`;
    }
    return `${acc}[${segment.key}]`;
  }, '');
};

/**
 * Generates dot-notation names
 * Example: root.tasks.0.title
 */
export const dotNotationNameGenerator: NameGeneratorFunction = (segments: PathSegment[], rootName = 'root'): string => {
  if (!segments || segments.length === 0) {
    return rootName;
  }

  const path = segments.map((segment) => segment.key).join('.');
  return rootName ? `${rootName}.${path}` : path;
};
