import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The own errors `SchemaField` withholds from the field it renders beside a `oneOf`/`anyOf` selector, which the
 * selector is given instead, with the path they belong to. `ArrayField` puts them back into the `ErrorSchema` it raises
 * for that path, which `Form` would otherwise read as the array dropping them.
 */
const WithheldErrorsContext = createContext<{ fieldPath: FieldPath; errors: string[] } | undefined>(undefined);

export default WithheldErrorsContext;
