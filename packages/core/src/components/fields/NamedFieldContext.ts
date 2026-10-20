import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The data path a `SchemaField` above has rendered the field its `ui:field` or `$id` names for */
export interface NamedFieldPath {
  fieldPath: FieldPath;
  /** Whether a `SchemaField` at that path renders inside the template of the one that named the field, which is so for
   * the one the named field renders and not for the selected `anyOf`/`oneOf` option, a field of its own
   */
  framedAbove: boolean;
  /** Whether that `SchemaField` has rendered the `anyOf`/`oneOf` options at that path beside the named field */
  optionsRendered: boolean;
}

/** The data path a `SchemaField` above has rendered the field its `ui:field` or `$id` names for. `SchemaField` and
 * `FallbackField` claim no path, since neither is a field written for the schema: `SchemaField` is the field that
 * renders the data with none named, and `FallbackField` renders as it does for a schema whose type sends it there, so
 * the selected option's own `ui:field` still applies below one that yields to the `anyOf`/`oneOf` options. Every
 * `SchemaField` below at a claimed path renders as though no field were named, so a named field that renders
 * `registry.fields.SchemaField` for its own data renders once rather than until the heap runs out (#5377), and the
 * selected `anyOf`/`oneOf` option, which renders at that path too, doesn't render it a second time.
 * The one the named field renders draws its label, description and help as the plan handed down to it says, and leaves
 * the extra-key row and the option selector to the `SchemaField` that named the field, so each renders once
 */
export default createContext<NamedFieldPath | undefined>(undefined);
