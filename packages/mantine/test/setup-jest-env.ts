// Mock the ResizeObserver because jest-dom doesn't
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Math.random() (Provides stable IDs for snapshots) ---
// Mantine components often use Math.random() internally for ID generation
// Mocking it ensures a consistent ID is generated every time.
const originalMathRandom = Math.random;
Math.random = jest.fn(() => 0.5); // Always returns the same value

afterAll(() => {
  Math.random = originalMathRandom;
});
