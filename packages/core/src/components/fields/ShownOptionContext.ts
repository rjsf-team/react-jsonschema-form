import { createContext, use } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The `anyOf`/`oneOf` options `SchemaField` renders for the field at `fieldPath`, and the one it shows, see
 * `useOptionSelection()`
 */
interface ShownOption {
  fieldPath: FieldPath;
  /** The options, each retrieved for the field's data */
  options: readonly unknown[];
  /** The key the selection is stored under */
  list: string | undefined;
  selectedOption: number;
  selectOption: (index: number) => void;
}

/** Set by every `SchemaField` around its field component and its option field, undefined where it renders no options.
 * A field reads the option from here rather than working it out again, which would repeat every rule by which
 * `SchemaField` decides whether the options render, the `uiSchema`'s included
 */
const ShownOptionContext = createContext<ShownOption | undefined>(undefined);

/** The option `SchemaField` shows beside the field at `fieldPath`, undefined where it shows none. A field rendered
 * below a component that is not `SchemaField` finds the option of a field at another path, so the path is checked
 */
export function useShownOptionBeside(fieldPath: FieldPath): unknown {
  const shown = use(ShownOptionContext);
  return shown?.fieldPath === fieldPath && shown.selectedOption >= 0 ? shown.options[shown.selectedOption] : undefined;
}

export default ShownOptionContext;
