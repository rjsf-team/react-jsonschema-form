import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The data path a `SchemaField` above has rendered, or declined, the field its `ui:field` or `$id` names for. Every
 * `SchemaField` below at that same path renders as though no field were named, so a named field that renders
 * `SchemaField` for its own data, as `ui:field: 'SchemaField'` does, renders once rather than until the heap runs out
 * (#5377), and the selected `anyOf`/`oneOf` option, which renders at that path too, doesn't render it a second time
 */
export default createContext<FieldPath | undefined>(undefined);
