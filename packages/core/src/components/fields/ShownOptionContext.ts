import { createContext, use } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** The `anyOf`/`oneOf` option `SchemaField` shows beside the field it renders directly below this context */
interface ShownOption {
  fieldPath: FieldPath;
  option: unknown;
}

/** Set by every `SchemaField` around its field component, undefined where it shows no option. A field reads the option
 * from here rather than working it out again, which would repeat every rule by which `SchemaField` decides whether the
 * options render, the `uiSchema`'s included
 */
const ShownOptionContext = createContext<ShownOption | undefined>(undefined);

/** The option `SchemaField` shows beside the field at `fieldPath`, undefined where it shows none. A field rendered
 * below a component that is not `SchemaField` finds the option of a field at another path, so the path is checked
 */
export function useShownOptionBeside(fieldPath: FieldPath): unknown {
  const shown = use(ShownOptionContext);
  return shown?.fieldPath === fieldPath ? shown.option : undefined;
}

export default ShownOptionContext;
