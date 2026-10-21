import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

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

  test('gives a ThemeProvider inside it the theme it chose and stored', () => {
    localStorageMock['daisyui-theme'] = 'cupcake';
    function ThemeName() {
      return <span>{useTheme().theme}</span>;
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: (
        <ThemeProvider>
          <ThemeName />
        </ThemeProvider>
      ),
      subtheme: { dataTheme: 'dark' },
    });

    const { container } = render(<DaisyUIFrame />);

    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  test('has useTheme() inside it name the theme it chose from the first render', () => {
    localStorageMock['daisyui-theme'] = 'cupcake';
    const rendered: string[] = [];
    function ThemeName() {
      const { theme } = useTheme();
      rendered.push(theme);
      return <span>{theme}</span>;
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <ThemeName />, subtheme: { dataTheme: 'dark' } });

    render(<DaisyUIFrame />);

    expect(new Set(rendered)).toEqual(new Set(['dark']));
  });

  test('has useTheme() inside it keep naming the theme it chose over one stored while it is chosen', async () => {
    function LightButton() {
      const { theme, setTheme } = useTheme();
      return (
        <button type='button' onClick={() => setTheme('light')}>
          {theme}
        </button>
      );
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <LightButton />, subtheme: { dataTheme: 'dark' } });
    const { container } = render(<DaisyUIFrame />);

    await user.click(screen.getByRole('button', { name: 'dark' }));

    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'light');
    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
    expect(screen.getByRole('button')).toHaveTextContent('dark');
  });

  test('renders useTheme() inside it no more when a theme is stored while it has chosen one', async () => {
    const rendered: string[] = [];
    function ThemeName() {
      const { theme } = useTheme();
      rendered.push(theme);
      return <span>{theme}</span>;
    }
    function LightButton() {
      const { setTheme } = useTheme();
      return (
        <button type='button' onClick={() => setTheme('light')}>
          light
        </button>
      );
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: (
        <>
          <ThemeName />
          <LightButton />
        </>
      ),
      subtheme: { dataTheme: 'dark' },
    });
    render(<DaisyUIFrame />);
    const rendersBeforeWrite = rendered.length;

    await user.click(screen.getByRole('button', { name: 'light' }));

    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'light');
    expect(rendered).toHaveLength(rendersBeforeWrite);
  });

  test('has useTheme() inside it name the stored theme once it clears the theme it chose', async () => {
    function ThemeName() {
      return <span data-testid='theme-name'>{useTheme().theme}</span>;
    }
    function LightButton() {
      const { setTheme } = useTheme();
      return (
        <button type='button' onClick={() => setTheme('light')}>
          light
        </button>
      );
    }
    const children = (
      <>
        <ThemeName />
        <LightButton />
      </>
    );
    // Rendered through the element the factory's component returns, so clearing `subtheme` changes the mounted
    // provider's props rather than remounting it
    function Frame({ subtheme }: { subtheme?: { dataTheme?: string } }) {
      return __createDaisyUIFrameProvider({ children, subtheme })({});
    }
    const { rerender } = render(<Frame subtheme={{ dataTheme: 'dark' }} />);
    await user.click(screen.getByRole('button', { name: 'light' }));
    expect(screen.getByTestId('theme-name')).toHaveTextContent('dark');

    rerender(<Frame />);

    expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
  });

  test("hands useTheme() another tab's stored theme through a ThemeProvider", () => {
    localStorageMock['daisyui-theme'] = 'cupcake';
    function ThemeName() {
      return <span>{useTheme().theme}</span>;
    }
    render(
      <ThemeProvider>
        <ThemeName />
      </ThemeProvider>,
    );
    expect(screen.getByText('cupcake')).toBeInTheDocument();

    localStorageMock['daisyui-theme'] = 'dark';
    // Another tab's write reaches this document only as a `storage` event, which nothing a user does here dispatches
    fireEvent(window, new StorageEvent('storage', { key: 'daisyui-theme', newValue: 'dark' }));

    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  test("has a ThemeProvider follow the theme another ThemeProvider's setTheme stores", async () => {
    localStorageMock['daisyui-theme'] = 'cupcake';
    function DarkButton() {
      const { setTheme } = useTheme();
      return (
        <button type='button' onClick={() => setTheme('dark')}>
          Dark
        </button>
      );
    }
    function ThemeName() {
      return <span>{useTheme().theme}</span>;
    }
    render(
      <>
        <ThemeProvider>
          <DarkButton />
        </ThemeProvider>
        <ThemeProvider>
          <ThemeName />
        </ThemeProvider>
      </>,
    );
    expect(screen.getByText('cupcake')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  test('has useTheme() outside a ThemeProvider name the theme the frame shows where none is stored', () => {
    function ThemeName() {
      return <span>{useTheme().theme}</span>;
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <ThemeName /> });

    const { container } = render(<DaisyUIFrame />);

    expect(container.querySelector('[data-theme="cupcake"]')).not.toBeNull();
    expect(screen.getByText('cupcake')).toBeInTheDocument();
  });

  test('has useTheme() outside a ThemeProvider name the stored theme the frame shows', () => {
    localStorageMock['daisyui-theme'] = 'dark';
    function ThemeName() {
      return <span>{useTheme().theme}</span>;
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <ThemeName /> });

    const { container } = render(<DaisyUIFrame />);

    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  test("shows a theme useTheme()'s setTheme stores outside a ThemeProvider", async () => {
    function DarkButton() {
      const { theme, setTheme } = useTheme();
      return (
        <button type='button' onClick={() => setTheme('dark')}>
          {theme}
        </button>
      );
    }
    const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <div>Test Content</div> });
    const { container } = render(
      <>
        <DarkButton />
        <DaisyUIFrame />
      </>,
    );
    expect(container.querySelector('[data-theme="cupcake"]')).not.toBeNull();

    await user.click(screen.getByText('cupcake'));

    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'dark');
    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
    expect(screen.getByRole('button')).toHaveTextContent('dark');
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

  test.each([
    ['no theme is chosen', undefined, 'cupcake', 'dark'],
    ['a theme is chosen', { dataTheme: 'light' }, 'light', 'light'],
  ])(
    'renders on the server, where %s, with no storage read, and hydrates to the theme shown',
    async (_, subtheme, onServer, hydrated) => {
      localStorageMock['daisyui-theme'] = 'dark';
      const DaisyUIFrame = __createDaisyUIFrameProvider({ children: <div>Test Content</div>, subtheme });

      const markup = renderToString(<DaisyUIFrame />);
      expect(markup).toContain(`data-theme="${onServer}"`);
      expect(mockGetItem).not.toHaveBeenCalled();

      const container = document.createElement('div');
      container.innerHTML = markup;
      document.body.appendChild(container);
      const onRecoverableError = vi.fn();
      const root = await act(async () => hydrateRoot(container, <DaisyUIFrame />, { onRecoverableError }));
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector(`[data-theme="${hydrated}"]`)).not.toBeNull();
      act(() => root.unmount());
      container.remove();
    },
  );

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

  test('shows a chosen theme the storage refuses to store', () => {
    mockSetItem.mockImplementationOnce(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    const DaisyUIFrame = __createDaisyUIFrameProvider({
      children: <div>Test Content</div>,
      subtheme: { dataTheme: 'dark' },
    });

    const { container } = render(<DaisyUIFrame />);

    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'dark');
    expect(container.querySelector('[data-theme="dark"]')).not.toBeNull();
  });

  test("keeps ThemeProvider's theme where the storage refuses the one setTheme stores", async () => {
    localStorageMock['daisyui-theme'] = 'cupcake';
    mockSetItem.mockImplementationOnce(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    function DarkButton() {
      const { theme, setTheme } = useTheme();
      return (
        <button type='button' onClick={() => setTheme('dark')}>
          {theme}
        </button>
      );
    }
    render(
      <ThemeProvider>
        <DarkButton />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'cupcake' }));

    expect(mockSetItem).toHaveBeenCalledWith('daisyui-theme', 'dark');
    expect(screen.getByRole('button', { name: 'cupcake' })).toBeInTheDocument();
  });
});
