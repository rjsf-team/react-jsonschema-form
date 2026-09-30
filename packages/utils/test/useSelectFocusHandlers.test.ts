/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { WidgetProps } from '../src/index.ts';
import { useSelectFocusHandlers } from '../src/index.ts';

function makeProps(overrides: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    value: undefined,
    options: { emptyValue: 'EMPTY' },
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  } as unknown as WidgetProps;
}

describe('useSelectFocusHandlers()', () => {
  it('should report the form data value as it is on focus and blur', () => {
    const props = makeProps({ value: { a: 1 } });
    const { result } = renderHook(() => useSelectFocusHandlers(props));

    result.current.handleFocus();
    result.current.handleBlur();

    expect(props.onFocus).toHaveBeenCalledWith('root', { a: 1 });
    expect(props.onBlur).toHaveBeenCalledWith('root', { a: 1 });
  });

  it('should report the emptyValue option when nothing is selected', () => {
    const props = makeProps();
    const { result } = renderHook(() => useSelectFocusHandlers(props));

    result.current.handleFocus();
    result.current.handleBlur();

    expect(props.onFocus).toHaveBeenCalledWith('root', 'EMPTY');
    expect(props.onBlur).toHaveBeenCalledWith('root', 'EMPTY');
  });

  it('should not throw when the widget is rendered without focus and blur handlers', () => {
    const props = makeProps({ onFocus: undefined, onBlur: undefined });
    const { result } = renderHook(() => useSelectFocusHandlers(props));

    expect(() => result.current.handleFocus()).not.toThrow();
    expect(() => result.current.handleBlur()).not.toThrow();
  });

  it('should report a falsy selection rather than the emptyValue', () => {
    const props = makeProps({ value: null });
    const { result } = renderHook(() => useSelectFocusHandlers(props));

    result.current.handleFocus();

    expect(props.onFocus).toHaveBeenCalledWith('root', null);
  });
});
