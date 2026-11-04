import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The path of a layout grid cell the layout names by an `additionalProperties` key. The grid takes the flag off the
 * cell's schema, so the cell is labelled as a declared property and its template draws no key input or remove button,
 * and an option or the fallback UI's value at that path has no flag of its own, so this tells whatever renders there
 * that a cleared value keeps the key, see `storedValue()`
 */
export default createContext<FieldPath | undefined>(undefined);
