import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The data path whose object, rendered beside its `anyOf`/`oneOf` options, draws the Optional Data Controls, so the
 * selected option's own field at that path draws none and the field shows one set
 */
export default createContext<FieldPath | undefined>(undefined);
