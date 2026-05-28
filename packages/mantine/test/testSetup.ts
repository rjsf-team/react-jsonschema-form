import { mockViewport } from 'jsdom-testing-mocks';

import cleanSnapshotSerializer from './cleanSnapshotSerializer';

expect.addSnapshotSerializer(cleanSnapshotSerializer as any);

// mockViewport installs a matchMedia mock backed by real CSS media query evaluation.
// jsdom doesn't implement matchMedia; without this Mantine components that read
// window.matchMedia throw or behave incorrectly in tests.
let viewport: ReturnType<typeof mockViewport>;

beforeAll(() => {
  viewport = mockViewport({ width: '1920px', height: '1080px' });
});

// Mock Math.random() (Provides stable IDs for snapshots) ---
// Mantine components often use Math.random() internally for ID generation
// Mocking it ensures a consistent ID is generated every time.
const originalMathRandom = Math.random;
Math.random = vi.fn(() => 0.5) as typeof Math.random;

afterAll(() => {
  Math.random = originalMathRandom;
  viewport.cleanup();
});
