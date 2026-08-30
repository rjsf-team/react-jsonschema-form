import { mockViewport } from 'jsdom-testing-mocks';

// mockViewport installs a matchMedia mock backed by real CSS media query evaluation.
// antd components query window.matchMedia internally; without this they throw in jsdom.
let viewport: ReturnType<typeof mockViewport>;

beforeAll(() => {
  viewport = mockViewport({ width: '1920px', height: '1080px' });
});

afterAll(() => {
  viewport.cleanup();
});
