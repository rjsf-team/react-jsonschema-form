import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The label of the uiSchema entry a field at `fieldPath` renders from, for a template-override warning. A shown
 * `anyOf`/`oneOf` option renders at the `MultiSchemaField`'s own path, so a label built from that path would name the
 * field's entry rather than the option's own `uiSchema.anyOf`/`uiSchema.oneOf` entry, and the two entries' mistakes
 * would read as one under `logOnce()`. Each `SchemaField` provides its own entry's label, which the `MultiSchemaField`
 * it renders builds the option entry's label on, so an option nested in another option's entry names both; only a
 * field at the same path reads it, so nothing below inherits an option's label
 */
export interface TemplateWarnEntry {
  /** The path of the field whose entry `label` names */
  fieldPath: FieldPath;
  /** Builds the label, which is read only when an override is actually invalid */
  label: () => string;
}

export default createContext<TemplateWarnEntry | undefined>(undefined);
