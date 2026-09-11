'use client';

import { useCallback } from 'react';

import localTimeToOffsetTime from './localTimeToOffsetTime.ts';
import offsetTimeToLocalTime from './offsetTimeToLocalTime.ts';
import padTimeSeconds from './padTimeSeconds.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

export interface UseTimeWidgetPropsResult {
  /** True when `schema.format` is `iso-time`, meaning a timezone offset is optional rather than required */
  isIsoTime: boolean;
  /** The `value` with any timezone offset stripped, suitable for display in a native or theme time input */
  localValue: string | undefined;
  /** Given the non-empty raw value from a time input, pads missing seconds and, unless `isIsoTime`, appends the
   * local UTC offset, returning a `time` string compliant with the JSON Schema `time`/`iso-time` format */
  computeTimeValue: (newValue: string) => string;
}

/** Hook which encapsulates the logic needed to compute the local (offset-free) display value of a `time` widget,
 * and to transform a newly entered value into a value compliant with the JSON Schema `time` format (RFC 3339
 * `full-time`, which requires seconds and a timezone) or, when `schema.format` is `iso-time`, into one still padded
 * with seconds but without a forced timezone, since that format's timezone is optional. To be used by theme
 * specific `TimeWidget` implementations.
 *
 * @param props - The `WidgetProps` for the `TimeWidget`
 * @returns - The `UseTimeWidgetPropsResult` to be used within a `TimeWidget` implementation
 */
export default function useTimeWidgetProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>): UseTimeWidgetPropsResult {
  const { schema, value } = props;
  const isIsoTime = schema.format === 'iso-time';
  const localValue = typeof value === 'string' ? offsetTimeToLocalTime(value) : undefined;
  const computeTimeValue = useCallback(
    (newValue: string) => {
      const timeValue = padTimeSeconds(newValue);
      return isIsoTime ? timeValue : localTimeToOffsetTime(timeValue);
    },
    [isIsoTime],
  );

  return { isIsoTime, localValue, computeTimeValue };
}
