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

/** The data path a `SchemaField` above has rendered the field its `ui:field` or `$id` names for. One that declines the
 * field it names, as a `FallbackField` that yields to the `anyOf`/`oneOf` options does, claims no path. Every
 * `SchemaField` below at that same path renders as though no field were named, so a named field that renders
 * `registry.fields.SchemaField` for its own data renders once rather than until the heap runs out (#5377), and the
 * selected `anyOf`/`oneOf` option, which renders at that path too, doesn't render it a second time. `SchemaField`
 * itself names no field here, since it is the field that renders the data with none named.
 * The one the named field renders is the bare field, without a template or options: the `SchemaField` that named it
 * owns the field's label, description, help, extra-key row and option selector, so each renders once
 */
export default createContext<NamedFieldPath | undefined>(undefined);
