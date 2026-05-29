import { mockViewport } from 'jsdom-testing-mocks';
import { MessageChannel } from 'worker_threads';

// required by react 18 for antd
global.MessageChannel = MessageChannel as unknown as typeof global.MessageChannel;

// mockViewport installs a matchMedia mock backed by real CSS media query evaluation.
// antd components query window.matchMedia internally; without this they throw in jsdom.
let viewport: ReturnType<typeof mockViewport>;

beforeAll(() => {
  viewport = mockViewport({ width: '1920px', height: '1080px' });
});

afterAll(() => {
  viewport.cleanup();
});
