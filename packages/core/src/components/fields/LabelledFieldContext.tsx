import type { ReactNode } from 'react';
import { createContext, useMemo } from 'react';

/** A control that a field around it has already labelled, which `SchemaField` sets around the field component and the
 * `anyOf`/`oneOf` field it renders whenever its own template labels that id. Each of them can render a field for the
 * same id — `MultiSchemaField` the selected option, `FallbackField` the value field it renders the options within —
 * whose `FieldTemplate` would otherwise put a second `<label>` on that same control, and a second description under
 * the id its `aria-describedby` names.
 *
 * Only the template's label is turned off: a theme whose widgets draw their own labels never had the template's label
 * on the control, so the widget keeps naming it there.
 */
export interface LabelledField {
  /** The id of the control the field around it labels */
  id: string;
  /** The description the field around it renders, which a field below with the same one does not render again */
  description: string;
  /** Where a field below renders a description of its own when the one around it renders one too: an id that some
   * other control's `aria-describedby` names, which `MultiSchemaField` sets to its selector's
   */
  descriptionId?: string;
}

const LabelledFieldContext = createContext<LabelledField | undefined>(undefined);

/** Provides a `LabelledField` built from its parts, keeping its identity while they are unchanged: every `SchemaField`
 * below reads it, so a new object on every render would re-render each of them past its `memo`
 */
export function LabelledFieldProvider({
  id,
  description = '',
  descriptionId,
  children,
}: Partial<LabelledField> & { children: ReactNode }) {
  const value = useMemo(
    () => (id === undefined ? undefined : { id, description, descriptionId }),
    [id, description, descriptionId],
  );
  return <LabelledFieldContext value={value}>{children}</LabelledFieldContext>;
}

export default LabelledFieldContext;
