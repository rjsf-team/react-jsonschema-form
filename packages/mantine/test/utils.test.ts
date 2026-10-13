import { cleanupOptions } from '../src/utils.tsx';

describe('cleanupOptions()', () => {
  it('removes autocapitalize from Mantine theme props', () => {
    expect(cleanupOptions({ autocapitalize: 'words', radius: 'md' })).toEqual({ radius: 'md' });
  });

  it('removes the itemLabel array option', () => {
    expect(cleanupOptions({ itemLabel: 'name', radius: 'md' })).toEqual({ radius: 'md' });
  });
});
