import { createContext } from 'react';

/** The id of a control that a field around it has already labelled. `SchemaField` sets it around the field component
 * and the `anyOf`/`oneOf` field it renders when its own template labels that id, because each can render a field for
 * the same id — `MultiSchemaField` the selected option, `FallbackField` the value field it renders the options within —
 * whose `FieldTemplate` would otherwise put a second `<label>` on that same control.
 * `SchemaField` turns its template's label off for the id this names. Only the template's: a theme whose widgets draw
 * their own labels never had the template's label on the control, so the widget keeps naming it there.
 */
const LabelledIdContext = createContext<string | undefined>(undefined);

export default LabelledIdContext;
