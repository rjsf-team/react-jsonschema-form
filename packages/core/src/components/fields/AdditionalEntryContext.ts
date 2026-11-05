import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The path of the `additionalProperties` entry `ObjectField` or a layout grid renders below it. An option or the fallback
 * UI's value at that path has no `ADDITIONAL_PROPERTY_FLAG` of its own, and a grid takes it off the cell's schema, so this
 * tells whatever renders there that a cleared value keeps the key, see `storedValue()`
 */
export default createContext<FieldPath | undefined>(undefined);
