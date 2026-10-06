import { act, cleanup, renderHook } from '@testing-library/react';

import { APPEARANCE_STORAGE_KEY } from '../../src/layout/AppearanceContext.ts';
import useAppearance from '../../src/layout/useAppearance.ts';

function createMedia(matches = false) {
  return Object.assign(new EventTarget(), {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  });
}

describe('useAppearance', () => {
  let media: ReturnType<typeof createMedia>;

  beforeEach(() => {
    localStorage.clear();
    media = createMedia();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => media),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(['light', 'dark'] as const)('restores the saved %s preference', (appearance) => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
    media.matches = appearance === 'light';
    const { result } = renderHook(useAppearance);
    expect(result.current.appearance).toBe(appearance);
    expect(result.current.theme.palette.mode).toBe(appearance);
  });

  it.each([null, 'system', 'invalid'])('resolves %s to system and follows live OS changes', (stored) => {
    if (stored !== null) {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, stored);
    }
    media.matches = true;
    const { result } = renderHook(useAppearance);
    expect(result.current.appearance).toBe('system');
    expect(result.current.theme.palette.mode).toBe('dark');
    act(() => {
      media.matches = false;
      media.dispatchEvent(new Event('change'));
    });
    expect(result.current.theme.palette.mode).toBe('light');
  });

  it('persists updates from any caller and restores them after remounting', () => {
    const first = renderHook(useAppearance);
    act(() => first.result.current.setAppearance('dark'));
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark');
    first.unmount();
    const { result } = renderHook(useAppearance);
    expect(result.current.theme.palette.mode).toBe('dark');
    act(() => result.current.setAppearance('system'));
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('system');
    expect(result.current.theme.palette.mode).toBe('light');
  });

  it('keeps an explicit preference when the OS theme changes', () => {
    const { result } = renderHook(useAppearance);
    act(() => result.current.setAppearance('light'));
    act(() => {
      media.matches = true;
      media.dispatchEvent(new Event('change'));
    });
    expect(result.current.theme.palette.mode).toBe('light');
  });

  it('uses the system theme if storage reads are blocked', () => {
    media.matches = true;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    const { result } = renderHook(useAppearance);
    expect(result.current.appearance).toBe('system');
    expect(result.current.theme.palette.mode).toBe('dark');
  });

  it('still updates the UI if storage writes are blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    const { result } = renderHook(useAppearance);
    act(() => result.current.setAppearance('dark'));
    expect(result.current.appearance).toBe('dark');
    expect(result.current.theme.palette.mode).toBe('dark');
  });

  it('still works when accessing localStorage itself throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    const { result } = renderHook(useAppearance);
    act(() => result.current.setAppearance('dark'));
    expect(result.current.theme.palette.mode).toBe('dark');
  });

  it('rechecks system changes between rendering and subscription', () => {
    vi.spyOn(media, 'addEventListener').mockImplementation(() => {
      media.matches = true;
    });
    const { result } = renderHook(useAppearance);
    expect(result.current.theme.palette.mode).toBe('dark');
  });

  it('creates one media query and removes the subscription on unmount', () => {
    const add = vi.spyOn(media, 'addEventListener');
    const remove = vi.spyOn(media, 'removeEventListener');
    const { unmount } = renderHook(useAppearance);
    expect(window.matchMedia).toHaveBeenCalledTimes(1);
    unmount();
    expect(remove).toHaveBeenCalledWith('change', add.mock.calls[0][1]);
  });
});
