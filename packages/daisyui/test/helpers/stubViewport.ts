/** Runs the enclosing block with the root element's client box that of a 1024 by 768 viewport, which the date pickers
 * place their popup inside of, and with native popovers: a `showPopover()` on every element and the `:popover-open`
 * selector `CSS.supports()` tells them by. jsdom lays nothing out, so that box is otherwise empty and no popup fits
 * anywhere, and it has no popovers, without which the popup stays in the field's flow and isn't placed at all.
 */
export default function stubViewport() {
  beforeEach(() => {
    const width = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
    const height = vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
    const supports = vi
      .spyOn(CSS, 'supports')
      .mockImplementation((condition) => condition === 'selector(:popover-open)');
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { value: vi.fn(), configurable: true });
    return () => {
      width.mockRestore();
      height.mockRestore();
      supports.mockRestore();
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    };
  });
}
