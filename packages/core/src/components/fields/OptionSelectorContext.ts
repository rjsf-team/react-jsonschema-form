import { createContext, use, useMemo } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** How many `anyOf` and `oneOf` option selectors fields above render for the data path `fieldPath` */
interface OptionSelectorsAbove {
  fieldPath: FieldPath;
  anyOf: number;
  oneOf: number;
}

/** Counts the option selectors rendered for one data path, so a selector rendered for an option that is itself an
 * `anyOf`/`oneOf` takes an id of its own. `AnyOfField` provides it around the option it renders, and reads it by path,
 * so a field at another path, such as a property of the option, starts its count again
 */
const OptionSelectorContext = createContext<OptionSelectorsAbove | undefined>(undefined);

/** Gets the option selectors fields above render for `fieldPath`
 *
 * @param fieldPath - The data path of the field asking
 * @returns - The count of each keyword's selectors above at `fieldPath`, none where no field above renders one
 */
export function useOptionSelectorsAbove(fieldPath: FieldPath): OptionSelectorsAbove {
  const above = use(OptionSelectorContext);
  const atPath = above?.fieldPath === fieldPath ? above : undefined;
  return useMemo(() => atPath ?? { fieldPath, anyOf: 0, oneOf: 0 }, [atPath, fieldPath]);
}

export default OptionSelectorContext;
