import { bracketNameGenerator, dotNotationNameGenerator } from '../src/nameGenerators';
import { PathSegment } from '../src/types';

describe('nameGenerators', () => {
  describe('bracketNameGenerator', () => {
    it('should return rootName when segments is empty', () => {
      expect(bracketNameGenerator([])).toBe('root');
    });

    it('should return rootName when segments is null/undefined', () => {
      expect(bracketNameGenerator(null as any)).toBe('root');
      expect(bracketNameGenerator(undefined as any)).toBe('root');
    });

    it('should return custom rootName when segments is empty', () => {
      expect(bracketNameGenerator([], 'form')).toBe('form');
    });

    it('should generate single bracket notation', () => {
      const segments: PathSegment[] = [{ type: 'object', key: 'firstName' }];
      expect(bracketNameGenerator(segments)).toBe('root[firstName]');
    });

    it('should generate nested bracket notation', () => {
      const segments: PathSegment[] = [
        { type: 'object', key: 'person' },
        { type: 'object', key: 'name' },
      ];
      expect(bracketNameGenerator(segments)).toBe('root[person][name]');
    });

    it('should generate array bracket notation', () => {
      const segments: PathSegment[] = [
        { type: 'object', key: 'tasks' },
        { type: 'array', key: 0 },
        { type: 'object', key: 'title' },
      ];
      expect(bracketNameGenerator(segments)).toBe('root[tasks][0][title]');
    });

    it('should work with custom rootName', () => {
      const segments: PathSegment[] = [
        { type: 'object', key: 'person' },
        { type: 'object', key: 'name' },
      ];
      expect(bracketNameGenerator(segments, 'form')).toBe('form[person][name]');
    });

    it('should work without rootName', () => {
      const segments: PathSegment[] = [
        { type: 'object', key: 'person' },
        { type: 'object', key: 'name' },
      ];
      expect(bracketNameGenerator(segments, '')).toBe('[person][name]');
    });
  });

  describe('dotNotationNameGenerator', () => {
    it('should return rootName when segments is empty', () => {
      expect(dotNotationNameGenerator([])).toBe('root');
    });

    it('should return rootName when segments is null/undefined', () => {
      expect(dotNotationNameGenerator(null as any)).toBe('root');
      expect(dotNotationNameGenerator(undefined as any)).toBe('root');
    });

    it('should return custom rootName when segments is empty', () => {
      expect(dotNotationNameGenerator([], 'form')).toBe('form');
    });

    it('should generate single dot notation', () => {
      const segments: PathSegment[] = [{ type: 'object', key: 'firstName' }];
      expect(dotNotationNameGenerator(segments)).toBe('root.firstName');
    });

    it('should generate nested dot notation', () => {
      const segments: PathSegment[] = [
        { type: 'object', key: 'person' },
        { type: 'object', key: 'name' },
      ];
      expect(dotNotationNameGenerator(segments)).toBe('root.person.name');
    });

    it('should generate array dot notation', () => {
      const segments: PathSegment[] = [
        { type: 'object', key: 'tasks' },
        { type: 'array', key: 0 },
        { type: 'object', key: 'title' },
      ];
      expect(dotNotationNameGenerator(segments)).toBe('root.tasks.0.title');
    });

    it('should work with custom rootName', () => {
      const segments: PathSegment[] = [
        { type: 'object', key: 'person' },
        { type: 'object', key: 'name' },
      ];
      expect(dotNotationNameGenerator(segments, 'form')).toBe('form.person.name');
    });

    it('should work without rootName', () => {
      const segments: PathSegment[] = [
        { type: 'object', key: 'person' },
        { type: 'object', key: 'name' },
      ];
      expect(dotNotationNameGenerator(segments, '')).toBe('person.name');
    });
  });
});
