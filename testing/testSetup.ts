import '@testing-library/jest-dom';
import { mockResizeObserver } from 'jsdom-testing-mocks';

// Installs a ResizeObserver mock globally. jsdom doesn't implement ResizeObserver;
// this stub prevents "ResizeObserver is not defined" errors across all packages.
mockResizeObserver();
