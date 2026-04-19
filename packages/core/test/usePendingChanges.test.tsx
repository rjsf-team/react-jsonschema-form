import { act, renderHook } from '@testing-library/react';

import { usePendingChanges } from '../src/components/hooks/usePendingChanges';
import type { PendingChange } from '../src/components/formStateHelpers';

describe('usePendingChanges', () => {
  it('drains a single change synchronously', () => {
    const processed: Array<{ change: PendingChange<string>; isLast: boolean }> = [];
    const { result } = renderHook(() =>
      usePendingChanges<string>((change, isLast) => {
        processed.push({ change, isLast });
      }),
    );
    act(() => {
      result.current.enqueue({ path: [], newValue: 'a' });
    });
    expect(processed).toHaveLength(1);
    expect(processed[0].change.newValue).toBe('a');
    expect(processed[0].isLast).toBe(true);
  });

  it('drains changes enqueued during processing in FIFO order', () => {
    const processed: string[] = [];
    const { result } = renderHook(() =>
      usePendingChanges<string>((change) => {
        processed.push(change.newValue ?? '');
        // enqueue a follow-up the first time we see "first"
        if (change.newValue === 'first') {
          result.current.enqueue({ path: [], newValue: 'second' });
        }
      }),
    );
    act(() => {
      result.current.enqueue({ path: [], newValue: 'first' });
    });
    expect(processed).toEqual(['first', 'second']);
  });

  it('reports isLastInQueue correctly across a multi-change drain', () => {
    const isLastSeen: boolean[] = [];
    let enqueueTwo = false;
    const { result } = renderHook(() =>
      usePendingChanges<string>((change, isLast) => {
        isLastSeen.push(isLast);
        if (enqueueTwo && change.newValue === 'a') {
          // enqueue two more during processing of "a"
          result.current.enqueue({ path: [], newValue: 'b' });
          result.current.enqueue({ path: [], newValue: 'c' });
          enqueueTwo = false;
        }
      }),
    );
    enqueueTwo = true;
    act(() => {
      result.current.enqueue({ path: [], newValue: 'a' });
    });
    // When processing "a", it's the only item → isLast=true.
    // Then processing "b" with "c" still queued → isLast=false.
    // Then processing "c" alone → isLast=true.
    expect(isLastSeen).toEqual([true, false, true]);
  });

  it('does not start a nested drain when enqueue is called during processing', () => {
    // The outer drain must pick up inner enqueues; the inner enqueue must NOT call processChange recursively.
    let outerDepth = 0;
    let maxDepth = 0;
    const { result } = renderHook(() =>
      usePendingChanges<number>((change) => {
        outerDepth++;
        maxDepth = Math.max(maxDepth, outerDepth);
        if (change.newValue === 1) {
          result.current.enqueue({ path: [], newValue: 2 });
        }
        outerDepth--;
      }),
    );
    act(() => {
      result.current.enqueue({ path: [], newValue: 1 });
    });
    expect(maxDepth).toBe(1);
  });

  it('exposes getPending for queue length observation', () => {
    const { result } = renderHook(() => usePendingChanges<string>(() => {}));
    expect(result.current.getPending()).toEqual([]);
  });
});
