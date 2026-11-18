import indexHtml from '../index.html?raw';
import { APPEARANCE_STORAGE_KEY } from '../src/layout/Layout.tsx';

describe('index.html', () => {
  it('reads the appearance the playground stores, to show it from the first paint', () => {
    expect(indexHtml).toContain(APPEARANCE_STORAGE_KEY);
  });
});
