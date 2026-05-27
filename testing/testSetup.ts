import '@testing-library/jest-dom';
import { vi } from 'vitest';

// required by antd v6
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
