/** Runs the enclosing block with the root element's client box that of a 1024 by 768 viewport, which the date pickers
 * place their popup inside of. jsdom lays nothing out, so that box is otherwise empty and no popup fits anywhere.
 */
export default function stubViewport() {
  beforeEach(() => {
    const width = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
    const height = vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
    return () => {
      width.mockRestore();
      height.mockRestore();
    };
  });
}
