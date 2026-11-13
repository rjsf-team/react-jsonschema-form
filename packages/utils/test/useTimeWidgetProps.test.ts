/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { WidgetProps } from '../src/index.ts';
import { useTimeWidgetProps } from '../src/index.ts';

function makeProps(overrides: Partial<WidgetProps> = {}): WidgetProps {
  return {
    schema: { type: 'string', format: 'time' },
    value: undefined,
    ...overrides,
  } as unknown as WidgetProps;
}

describe('useTimeWidgetProps()', () => {
  it('should report isIsoTime as false for format=time', () => {
    const { result } = renderHook(() => useTimeWidgetProps(makeProps()));
    expect(result.current.isIsoTime).toBe(false);
  });

  it('should report isIsoTime as true for format=iso-time', () => {
    const { result } = renderHook(() =>
      useTimeWidgetProps(makeProps({ schema: { type: 'string', format: 'iso-time' } })),
    );
    expect(result.current.isIsoTime).toBe(true);
  });

  it('should leave a non-string value untouched for localValue', () => {
    const { result } = renderHook(() => useTimeWidgetProps(makeProps({ value: undefined })));
    expect(result.current.localValue).toBeUndefined();
  });

  it('should strip a timezone offset from a string value for localValue', () => {
    const { result } = renderHook(() => useTimeWidgetProps(makeProps({ value: '13:10:30+02:00' })));
    expect(result.current.localValue).toEqual('13:10:30');
  });

  it('should leave a string value without a timezone offset untouched for localValue', () => {
    const { result } = renderHook(() => useTimeWidgetProps(makeProps({ value: '13:10:30' })));
    expect(result.current.localValue).toEqual('13:10:30');
  });

  it('should pad seconds and append the local timezone offset for format=time', () => {
    const { result } = renderHook(() => useTimeWidgetProps(makeProps()));
    expect(result.current.computeTimeValue('11:10')).toMatch(/^11:10:00(?:Z|[+-]\d{2}:\d{2})$/);
  });

  it('should pad seconds without appending a timezone offset for format=iso-time', () => {
    const { result } = renderHook(() =>
      useTimeWidgetProps(makeProps({ schema: { type: 'string', format: 'iso-time' } })),
    );
    expect(result.current.computeTimeValue('11:10')).toEqual('11:10:00');
  });
});
