/** A client rect `width` by `height` whose top left corner is at (`left`, `top`) */
export function rectAt(top: number, left: number, width = 0, height = 0): DOMRect {
  return { x: left, y: top, width, height, top, right: left + width, bottom: top + height, left, toJSON() {} };
}

/** A length snapped to the 1/64px layout unit Chrome and WebKit lay boxes out in */
const snap = (length: number) => Math.round(length * 64) / 64;

/** Has every element drawn at its own `top`, `left` and `width`, scaled by an ancestor's CSS `zoom` and snapped as a
 * browser snaps them, in client rects measured from (`left`, `top`) of the coordinates those are in, where jsdom draws
 * everything at the viewport's corner. A fixed element's client rect is measured from where its own `top` and `left`
 * are, (0, 0), in Chrome and Firefox, and from the visual viewport's corner in WebKit. Installed as a plain method
 * rather than a spy, which `vi.spyOn()` on one element would take over for every element
 */
export function measureClientRectsFrom(top: number, left: number, zoom = 1) {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    value(this: HTMLElement) {
      const drawn = (length: string) => snap((parseFloat(length) || 0) * zoom);
      return rectAt(drawn(this.style.top) - top, drawn(this.style.left) - left, drawn(this.style.width));
    },
    configurable: true,
  });
}

/** Runs the enclosing block with the root element's client box that of a 1024 by 768 viewport, which the date pickers
 * place their popup inside of, and with native popovers: a `showPopover()` on every element and the `:popover-open`
 * selector `CSS.supports()` tells them by. jsdom lays nothing out, so that box is otherwise empty and no popup fits
 * anywhere, and it has no popovers, without which the popup stays in the field's flow and isn't placed at all. Client
 * rects are measured as Chrome and Firefox measure them.
 */
export default function stubViewport() {
  beforeEach(() => {
    const width = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
    const height = vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
    const supports = vi
      .spyOn(CSS, 'supports')
      .mockImplementation((condition) => condition === 'selector(:popover-open)');
    const showPopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover');
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { value: vi.fn(), configurable: true });
    measureClientRectsFrom(0, 0);
    return () => {
      width.mockRestore();
      height.mockRestore();
      supports.mockRestore();
      // Restored rather than deleted, so a jsdom that gains its own isn't left without it for every later test
      if (showPopover) {
        Object.defineProperty(HTMLElement.prototype, 'showPopover', showPopover);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      }
      Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect');
    };
  });
}
