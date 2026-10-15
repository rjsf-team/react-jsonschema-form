import { use, useState } from 'react';

import FormDataContext from '../components/FormDataContext.ts';
import type { UiState } from '../components/uiState.ts';
import { createUiState } from '../components/uiState.ts';

/** The option selections and cycle expansions the calling field reads and writes: the form's, or outside a `Form` a
 * store of the calling component's own, which lives as long as it does
 *
 * @returns - The store
 */
export default function useUiState(): UiState {
  // The store is never replaced, only mutated through its own methods, so there is no setter to take
  // oxlint-disable-next-line react/hook-use-state
  const [own] = useState(createUiState);
  return use(FormDataContext)?.uiState ?? own;
}
