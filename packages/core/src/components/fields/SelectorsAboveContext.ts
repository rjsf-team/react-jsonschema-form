import { createContext, use, useMemo } from 'react';

/** How many selectors fields above render for the id `id`: `anyOf` and `oneOf` option selectors, and the fallback UI's
 * type selectors
 */
interface SelectorsAbove {
  id: string;
  anyOf: number;
  oneOf: number;
  type: number;
}

/** Counts the selectors rendered for one id, so a selector rendered for an option that is itself an `anyOf`/`oneOf`, or
 * for a value of the fallback UI that offers types of its own, takes an id of its own. `AnyOfField` provides it around
 * the option it renders and `FallbackField` around its value field. It is read by id rather than by data path, since
 * the ids it keeps apart are built from the id: a field with an id of its own, such as a property of the option, starts
 * its count again, and so does nothing else, not even a custom field rendering `SchemaField` with the same id under
 * another path
 */
const SelectorsAboveContext = createContext<SelectorsAbove | undefined>(undefined);

/** Gets the selectors fields above render for `id`
 *
 * @param id - The id of the field asking
 * @returns - The count of each kind of selector above for `id`, none where no field above renders one
 */
export function useSelectorsAbove(id: string): SelectorsAbove {
  const above = use(SelectorsAboveContext);
  const forId = above?.id === id ? above : undefined;
  return useMemo(() => forId ?? { id, anyOf: 0, oneOf: 0, type: 0 }, [forId, id]);
}

export default SelectorsAboveContext;
