/** The `localStorage` key the chosen DaisyUI theme is kept under */
const THEME_KEY = 'daisyui-theme';

/** The theme shown where none is stored, or where the storage can't be read, as on the server */
export const DEFAULT_THEME = 'cupcake';

/** Everyone in this document showing the stored theme. They are told of a theme stored here directly, since the
 * `storage` event that tells every other document sharing the storage never fires in the one that wrote it
 */
const listeners = new Set<() => void>();

/** Reads the stored theme
 *
 * @returns - The stored theme, or the default where none is stored or the storage can't be read
 */
export function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Stores a theme, and tells everyone in this document who shows the stored one. A storage that can't be written, as
 * in a sandboxed frame or once its quota is spent, keeps the theme it holds, so nobody is told
 *
 * @param theme - The theme to store
 */
export function storeTheme(theme: string) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

/** Subscribes to the stored theme, as `useSyncExternalStore` asks: to a theme stored in this document, and to one
 * another tab or window stores, which arrives as a `storage` event
 *
 * @param onStoreChange - Called whenever the stored theme may have changed
 * @returns - The function that ends the subscription
 */
export function subscribeToStoredTheme(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}
