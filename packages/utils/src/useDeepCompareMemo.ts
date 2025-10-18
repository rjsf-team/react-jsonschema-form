import { useRef } from 'react';
import isEqual from 'lodash/isEqual';

/** Hook that stores and returns a `T` value. If `newValue` is the same as the stored one, then the stored one is
 * returned to avoid having a component rerender due it being a different object. Otherwise, the `newValue` is stored
 * and returned.
 *
 * @param newValue - The potential new `T` value
 * @returns - The latest stored `T` value
 */
export default function useDeepCompareMemo<T = unknown>(newValue: T): T {
  const valueRef = useRef<T>(newValue);
  if (!isEqual(newValue, valueRef.current)) {
    valueRef.current = newValue;
  }
  return valueRef.current;
}
