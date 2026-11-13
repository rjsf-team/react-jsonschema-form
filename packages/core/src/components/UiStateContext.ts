import { createContext } from 'react';

import type { UiState } from './uiState.ts';

/** The option selections and cycle expansions of the field tree: the form's, or outside a `Form` the outermost
 * `SchemaField`'s, see `useUiState()`
 */
export default createContext<UiState | undefined>(undefined);
