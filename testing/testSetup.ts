import '@testing-library/jest-dom';
import { vi } from 'vitest';

// required by antd v6
global.ResizeObserver = class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};
