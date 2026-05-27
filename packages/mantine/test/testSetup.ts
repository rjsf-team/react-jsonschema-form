import cleanSnapshotSerializer from './cleanSnapshotSerializer';

expect.addSnapshotSerializer(cleanSnapshotSerializer as any);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the ResizeObserver because jsdom doesn't
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Math.random() (Provides stable IDs for snapshots) ---
// Mantine components often use Math.random() internally for ID generation
// Mocking it ensures a consistent ID is generated every time.
const originalMathRandom = Math.random;
Math.random = vi.fn(() => 0.5) as typeof Math.random;

afterAll(() => {
  Math.random = originalMathRandom;
});
