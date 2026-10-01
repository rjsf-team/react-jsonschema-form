/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { WidgetProps } from '../src/index.ts';
import { useOptionFocusHandlers } from '../src/index.ts';

function makeProps(overrides: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    options: {
      enumOptions: [
        { value: 1, label: 'Number' },
        { value: '1', label: 'String' },
      ],
    },
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  } as unknown as WidgetProps;
}

describe('useOptionFocusHandlers()', () => {
  it('should report the value of the option at each handler position on focus and blur', () => {
    const props = makeProps();
    const { result } = renderHook(() => useOptionFocusHandlers(props));

    result.current.focusHandlers[1]();
    result.current.blurHandlers[0]();

    expect(props.onFocus).toHaveBeenCalledWith('root', '1');
    expect(props.onBlur).toHaveBeenCalledWith('root', 1);
  });

  it('should return no handlers without options', () => {
    const props = makeProps({ options: {} });
    const { result } = renderHook(() => useOptionFocusHandlers(props));

    expect(result.current).toEqual({ focusHandlers: [], blurHandlers: [] });
  });

  it('should keep the same handlers across renders while its inputs are unchanged', () => {
    const props = makeProps();
    const { result, rerender } = renderHook(() => useOptionFocusHandlers(props));
    const first = result.current;

    rerender();

    expect(result.current.focusHandlers[0]).toBe(first.focusHandlers[0]);
    expect(result.current.blurHandlers[1]).toBe(first.blurHandlers[1]);
  });

  it('should not throw when the widget is rendered without focus and blur handlers', () => {
    const props = makeProps({ onFocus: undefined, onBlur: undefined });
    const { result } = renderHook(() => useOptionFocusHandlers(props));

    expect(() => result.current.focusHandlers[0]()).not.toThrow();
    expect(() => result.current.blurHandlers[0]()).not.toThrow();
  });
});
