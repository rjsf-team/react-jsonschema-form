import { render, waitFor } from '@testing-library/react';

import { __createDaisyUIFrameProvider } from '../src/DaisyUIFrameProvider.tsx';

let localStorageMock: Record<string, string> = {};
const mockSetItem = vi.fn((key, value) => {
  localStorageMock[key] = value;
});
const mockGetItem = vi.fn((key) => localStorageMock[key] || null);
const mockRemove = vi.fn();
const mockDocument = {
  head: {
    appendChild: vi.fn(),
  },
  createElement: vi.fn((tagName) => ({
    tagName,
    textContent: '',
    rel: '',
    href: '',
    src: '',
    remove: mockRemove,
  })),
};

describe('DaisyUIFrameProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  test('renders children with default theme when no theme is provided', async () => {
    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: <div>Test Content</div>,
    });

    const { container, unmount } = render(<DaisyUIFrame document={mockDocument as unknown as Document} />);

    expect(container.querySelector('.daisy-ui-theme')).not.toBeNull();
    expect(container.querySelector('[data-theme="cupcake"]')).not.toBeNull();
    expect(container.textContent).toContain('Test Content');
    expect(mockGetItem).toHaveBeenCalledWith('daisyui-theme');
    expect(mockRemove).not.toHaveBeenCalled();
    unmount();
    await waitFor(() => {
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

  test('reads the stored theme once across renders, and stores a chosen theme', () => {
    localStorageMock['daisyui-theme'] = 'dark';
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <div>Test Content</div> });
    const Chosen = __createDaisyUIFrameProvider({
      children: <div>Test Content</div>,
      subtheme: { dataTheme: 'light' },
    });

    const { container, rerender } = render(<DaisyUIFrame />);
    rerender(<DaisyUIFrame />);
    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
    expect(mockGetItem).toHaveBeenCalledTimes(1);
    expect(mockSetItem).not.toHaveBeenCalled();

    rerender(<Chosen />);
    expect(container.querySelector('[data-theme="light"]')).not.toBeNull();
    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'light');
  });

  test('falls back to the theme last stored when the chosen theme is cleared', () => {
    localStorageMock['daisyui-theme'] = 'cupcake';
    // Rendered as the playground renders it, through the element the factory's component returns, so a new `subtheme`
    // changes the mounted provider's props rather than remounting it
    function Frame({ subtheme }: { subtheme?: { dataTheme?: string } }) {
      return __createDaisyUIFrameProvider({ children: <div>Test Content</div>, subtheme })({});
    }
    const { container, rerender } = render(<Frame />);
    expect(container.querySelector('[data-theme="cupcake"]')).not.toBeNull();

    rerender(<Frame subtheme={{ dataTheme: 'dark' }} />);
    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'dark');
    rerender(<Frame />);

    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
    expect(mockGetItem).toHaveBeenCalledTimes(1);
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
