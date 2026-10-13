import { cleanupOptions } from '../src/utils.tsx';

describe('cleanupOptions()', () => {
  it('removes autocapitalize from Mantine theme props', () => {
    expect(cleanupOptions({ autocapitalize: 'words', radius: 'md' })).toEqual({ radius: 'md' });
  });

  it('removes the itemLabel array option', () => {
    expect(cleanupOptions({ itemLabel: 'name', radius: 'md' })).toEqual({ radius: 'md' });
  });

  it.each(['initialValue', 'placeholder', 'required', 'rows', 'enumOptions'])('removes the %s option', (name) => {
    expect(cleanupOptions({ [name]: 'value', radius: 'md' })).toEqual({ radius: 'md' });
  });

  it.each(['MarkdownTemplate', 'GridTemplate', 'FieldTemplate'])('removes a per-field %s override', (name) => {
    expect(cleanupOptions({ [name]: () => null, radius: 'md' })).toEqual({ radius: 'md' });
  });

  it.each(['definitions', 'fieldReplacesAnyOrOneOf', 'globalOptions'])(
    'removes %s, which the ui: key of the same name gives a field',
    (name) => {
      expect(cleanupOptions({ [name]: {}, radius: 'md' })).toEqual({ radius: 'md' });
    },
  );

  it('also removes the extra keys it is given', () => {
    expect(cleanupOptions({ min: 1, radius: 'md' }, ['min'])).toEqual({ radius: 'md' });
  });
});
