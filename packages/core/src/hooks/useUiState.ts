import { use, useState } from 'react';

import { createUiState } from '../components/uiState.ts';
import type { UiState } from '../components/uiState.ts';
import UiStateContext from '../components/UiStateContext.ts';

/** The option selections and cycle expansions the calling field reads and writes: the field tree's, from
 * `UiStateContext`, or, with none above, a store of the calling component's own, which lives as long as it does and
 * which an outermost `SchemaField` provides to the fields below it
 *
 * @returns - The store, and whether it is the calling component's own
 */
export default function useUiState(): { uiState: UiState; isOwn: boolean } {
  const above = use(UiStateContext);
  // The store is never replaced, only mutated through its own methods, so there is no setter to take
  // oxlint-disable-next-line react/hook-use-state
  const [own] = useState(() => above ?? createUiState());
  return above === undefined ? { uiState: own, isOwn: true } : { uiState: above, isOwn: false };
}
