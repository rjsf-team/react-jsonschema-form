import { useCallback, useRef } from 'react';

import type { PendingChange } from '../formStateHelpers';

/** The shape of the callback that `usePendingChanges` invokes for each change as it is drained from the queue. */
export type ProcessPendingChange<T> = (change: PendingChange<T>, isLastInQueue: boolean) => void;

/** The return value of `usePendingChanges`. */
export interface UsePendingChangesReturn<T> {
  /** Enqueues a change. If the queue was empty, the drain loop runs synchronously until the queue is empty again. */
  enqueue: (change: PendingChange<T>) => void;
  /** Direct access to the queue for callers that need to observe its current length (e.g. to gate validation). */
  getPending: () => PendingChange<T>[];
}

/** Manages a FIFO queue of pending field changes. When `enqueue` is called on an empty queue, the hook drains all
 * changes synchronously by calling the supplied `processChange` on each one in turn. Changes enqueued *during*
 * processing are picked up by the same drain loop rather than triggering a nested drain.
 *
 * This mirrors the class component's `pendingChanges` + `processPendingChange` behavior, but flattens the recursive
 * setState-callback drain into a synchronous loop so no `useEffect` is required to sequence the work.
 *
 * @param processChange - Called with each change as it is drained. The second argument indicates whether the change
 *   is the last one in the queue at the time of processing (used to gate live validation).
 * @returns - An object with `enqueue` (to add new changes) and `getPending` (to inspect the queue).
 */
export function usePendingChanges<T>(processChange: ProcessPendingChange<T>): UsePendingChangesReturn<T> {
  const queueRef = useRef<PendingChange<T>[]>([]);

  // Keep the latest `processChange` in a ref so `enqueue` can remain referentially stable across renders without
  // getting stale closures.
  const processChangeRef = useRef(processChange);
  processChangeRef.current = processChange;

  const enqueue = useCallback((change: PendingChange<T>) => {
    queueRef.current.push(change);
    // If another drain cycle is already running (outer loop below), it will pick up this change.
    if (queueRef.current.length > 1) {
      return;
    }
    while (queueRef.current.length > 0) {
      const head = queueRef.current[0];
      const isLast = queueRef.current.length === 1;
      processChangeRef.current(head, isLast);
      queueRef.current.shift();
    }
  }, []);

  const getPending = useCallback(() => queueRef.current, []);

  return { enqueue, getPending };
}
