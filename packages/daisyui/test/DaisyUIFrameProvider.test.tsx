import { render, waitFor } from '@testing-library/react';

import { __createDaisyUIFrameProvider } from '../src/DaisyUIFrameProvider';

let localStorageMock: { [key: string]: string } = {};
const mockSetItem = jest.fn((key, value) => {
  localStorageMock[key] = value;
});
const mockGetItem = jest.fn((key) => localStorageMock[key] || null);
const mockRemove = jest.fn();
const mockDocument = {
  head: {
    appendChild: jest.fn(),
  },
  createElement: jest.fn((tagName) => {
    return {
      tagName,
      textContent: '',
      rel: '',
      href: '',
      src: '',
      remove: mockRemove,
    };
  }),
};

describe('DaisyUIFrameProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock = {};

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
      },
      writable: true,
    });
  });

  test('renders children with default theme when no theme is provided', () => {
    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: <div>Test Content</div>,
    });

    const { container, unmount } = render(<DaisyUIFrame />);

    expect(container.querySelector('.daisy-ui-theme')).not.toBeNull();
    expect(container.querySelector('[data-theme="cupcake"]')).not.toBeNull();
    expect(container.textContent).toContain('Test Content');
    expect(mockGetItem).toHaveBeenCalledWith('daisyui-theme');
    expect(mockRemove).not.toHaveBeenCalled();
    unmount();
    waitFor(() => {
      expect(mockRemove).toHaveBeenCalledTimes(4);
    });
  });

  test('uses provided theme when specified', () => {
    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: <div>Test Content</div>,
      subtheme: { dataTheme: 'dark' },
    });

    const { container } = render(<DaisyUIFrame />);

    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'dark');
  });

  test('injects scripts and styles when document is provided', () => {
    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: <div>Test Content</div>,
    });

    render(<DaisyUIFrame document={mockDocument as unknown as Document} />);

    // Should create and append 4 elements: config script, tailwind script, daisyui css, daisyui themes css
    expect(mockDocument.createElement).toHaveBeenCalledTimes(4);
    expect(mockDocument.createElement).toHaveBeenCalledWith('script');
    expect(mockDocument.createElement).toHaveBeenCalledWith('link');
    expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(4);
  });

  test('handles localStorage exceptions gracefully', () => {
    // Make localStorage.getItem throw an exception
    mockGetItem.mockImplementationOnce(() => {
      throw new Error('localStorage error');
    });

    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: <div>Test Content</div>,
    });

    const { container } = render(<DaisyUIFrame />);

    // Should fall back to default theme
    expect(container.querySelector('[data-theme="cupcake"]')).not.toBeNull();
  });
});
