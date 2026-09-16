import { cleanupOptions } from '../src/utils.ts';

describe('cleanupOptions()', () => {
  it('removes autocapitalize from Mantine theme props', () => {
    expect(cleanupOptions({ autocapitalize: 'words', radius: 'md' })).toEqual({ radius: 'md' });
  });
});
