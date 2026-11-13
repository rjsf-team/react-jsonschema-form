import { mockViewport } from 'jsdom-testing-mocks';

// mockViewport installs a matchMedia mock backed by real CSS media query evaluation.
// antd components query window.matchMedia internally; without this they throw in jsdom.
let viewport: ReturnType<typeof mockViewport>;

beforeAll(() => {
  viewport = mockViewport({ width: '1920px', height: '1080px' });
});

afterAll(async () => {
  viewport.cleanup();
  // antd's `Form.Item` debounces its errors with a 10 ms timer that sets state and is not cancelled when the item
  // unmounts. A file whose last test ends sooner than that has the timer fire once Vitest has torn jsdom down, where
  // React's read of `window.event` throws. Node runs timers of one duration in the order they were set, so one set
  // here, after the last test, runs after every one a test left behind.
  await new Promise((resolve) => {
    setTimeout(resolve, 10);
  });
});
