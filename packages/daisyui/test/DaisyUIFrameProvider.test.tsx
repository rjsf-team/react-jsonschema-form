import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { __createDaisyUIFrameProvider } from '../src/DaisyUIFrameProvider.tsx';
import { ThemeProvider, useTheme } from '../src/theme/index.ts';

const user = userEvent.setup();

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

  test('stores a chosen theme once it has rendered, not while rendering', () => {
    localStorageMock['daisyui-theme'] = 'dark';
    const storedWhileRendering: (string | null)[] = [];
    function Probe() {
      storedWhileRendering.push(localStorageMock['daisyui-theme']);
      return null;
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <Probe />, subtheme: { dataTheme: 'light' } });

    const { container } = render(<DaisyUIFrame />);

    expect(container.querySelector('[data-theme="light"]')).not.toBeNull();
    expect(storedWhileRendering).toEqual(['dark']);
    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'light');
  });

  test('shows a chosen theme without reading the storage', () => {
    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: <div>Test Content</div>,
      subtheme: { dataTheme: 'light' },
    });

    const { container } = render(<DaisyUIFrame />);

    expect(container.querySelector('[data-theme="light"]')).not.toBeNull();
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  test('shows a theme another provider stores after it mounted', () => {
    localStorageMock['daisyui-theme'] = 'cupcake';
    const Unchosen = __createDaisyUIFrameProvider({ children: <div>Unchosen</div> });
    const Chosen = __createDaisyUIFrameProvider({ children: <div>Chosen</div>, subtheme: { dataTheme: 'dark' } });
    function Page({ withChosen }: { withChosen: boolean }) {
      return (
        <>
          <Unchosen />
          {withChosen && <Chosen />}
        </>
      );
    }
    const { rerender } = render(<Page withChosen={false} />);
    expect(screen.getByText('Unchosen').closest('[data-theme]')).toHaveAttribute('data-theme', 'cupcake');

    rerender(<Page withChosen />);

    expect(screen.getByText('Unchosen').closest('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  });

  test('shows a theme another tab stores', () => {
    localStorageMock['daisyui-theme'] = 'cupcake';
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <div>Test Content</div> });
    const { container } = render(<DaisyUIFrame />);
    expect(container.querySelector('[data-theme="cupcake"]')).not.toBeNull();

    localStorageMock['daisyui-theme'] = 'dark';
    // Another tab's write reaches this document only as a `storage` event, which nothing a user does here dispatches
    fireEvent(window, new StorageEvent('storage', { key: 'daisyui-theme', newValue: 'dark' }));

    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
  });

  test("shows a theme ThemeProvider's setTheme stores", async () => {
    function DarkButton() {
      const { setTheme } = useTheme();
      return (
        <button type='button' onClick={() => setTheme('dark')}>
          Dark
        </button>
      );
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <div>Test Content</div> });
    const { container } = render(
      <ThemeProvider>
        <DarkButton />
        <DaisyUIFrame />
      </ThemeProvider>,
    );
    expect(container.querySelector('[data-theme="cupcake"]')).not.toBeNull();

    await user.click(screen.getByText('Dark'));

    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'dark');
    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
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
