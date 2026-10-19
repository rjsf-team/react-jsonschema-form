import { createContext, use } from 'react';
import type { FieldPresentation } from '@rjsf/utils';

/** What a field hands the field below it that renders the same id: the selected `anyOf`/`oneOf` option, the value
 * field of the fallback UI, or the field a custom field wrapping `SchemaField` renders */
export interface InheritedPresentation {
  /** The id of the field that built the plan */
  id: string;
  /** The plan it built */
  plan: FieldPresentation;
  /** Its title, without the Deprecated marker its label may carry, which a field below titled the same takes the label
   * of
   */
  title: string;
  /** The description its schema declares, which a field below declaring the same doesn't declare of its own */
  schemaDescription: string;
}

/** Carries a field's plan to the field below it rendering the same id. `SchemaField` provides it around the field it
 * renders and reads it by id, so a field with an id of its own, such as an array item or a type selector, builds its
 * plan from scratch, and a replaced `AnyOfField`, `OneOfField` or `FallbackField` has nothing to forward
 */
const PresentationContext = createContext<InheritedPresentation | undefined>(undefined);

/** Gets what the field above handed down, when that field renders the same `id`
 *
 * @param id - The id of the field asking
 * @returns - What the field above rendering `id` handed down, if there is one
 */
export function useInheritedPresentation(id: string): InheritedPresentation | undefined {
  const inherited = use(PresentationContext);
  return inherited?.id === id ? inherited : undefined;
}

export default PresentationContext;
