import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** What a `SchemaField` at a named field's data path renders of the field's template, which the `SchemaField` that
 * named the field has rendered already: `none` of it, below that named field, once it has rendered the whole template;
 * only the `label`, and the description a theme renders with it, when that `SchemaField` left the label to the field a
 * `ui:field` names, as `getDisplayLabel()` does; its `own`, for the selected `anyOf`/`oneOf` option, which is a field of
 * its own
 */
export type NamedFieldFraming = 'none' | 'label' | 'own';

/** The data path a `SchemaField` above has rendered the field its `ui:field` or `$id` names for */
export interface NamedFieldPath {
  fieldPath: FieldPath;
  framing: NamedFieldFraming;
  /** Whether that `SchemaField` has rendered the `anyOf`/`oneOf` options at that path beside the named field */
  optionsRendered: boolean;
}

/** The data path a `SchemaField` above has rendered the field its `ui:field` or `$id` names for. One that declines the
 * field it names, as a `FallbackField` that yields to the `anyOf`/`oneOf` options does, claims no path. Every
 * `SchemaField` below at that same path renders as though no field were named, so a named field that renders
 * `SchemaField` for its own data, as `ui:field: 'SchemaField'` does, renders once rather than until the heap runs out
 * (#5377), and the selected `anyOf`/`oneOf` option, which renders at that path too, doesn't render it a second time.
 * The one the named field renders also leaves out what the `SchemaField` that named it rendered: the template, as
 * `framing` says, and the options, so the field renders one label, description, help, extra-key row and option selector
 */
export default createContext<NamedFieldPath | undefined>(undefined);
