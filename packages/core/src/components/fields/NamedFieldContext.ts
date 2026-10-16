import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The data path a `SchemaField` above has rendered the field its `ui:field` or `$id` names for. One that declines the
 * field it names, as a `FallbackField` that yields to the `anyOf`/`oneOf` options does, claims no path. Every
 * `SchemaField` below at that same path renders as though no field were named, so a named field that renders
 * `SchemaField` for its own data, as `ui:field: 'SchemaField'` does, renders once rather than until the heap runs out
 * (#5377), and the selected `anyOf`/`oneOf` option, which renders at that path too, doesn't render it a second time
 */
export default createContext<FieldPath | undefined>(undefined);
