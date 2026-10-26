import { use, useMemo } from 'react';
import { fieldPathToList } from '@rjsf/utils';
import type { FieldPath } from '@rjsf/utils';

import AdditionalPropertyDepthsContext from './AdditionalPropertyDepthsContext.ts';
import { isAdditionalPropertySchema } from './fieldWidgetUtils.ts';

/** The indexes of this field's path segments that are an additional property's key: the context's own, plus this
 * field's last segment where its schema is an additional property's stub, for a template-override warning to
 * collapse the way it collapses an array index. Memoized so the array handed down keeps its identity while the
 * inputs do
 *
 * @param schema - The schema the field renders
 * @param fieldPath - The `FieldPath` identifying the field in the form
 * @returns - The collapsible segment indexes, or undefined where no field at or above this one is an additional
 * property
 */
export default function useAdditionalDepths(schema: unknown, fieldPath: FieldPath): readonly number[] | undefined {
  const additionalDepthsAbove = use(AdditionalPropertyDepthsContext);
  return useMemo(() => {
    const ownDepth = fieldPathToList(fieldPath).length - 1;
    return isAdditionalPropertySchema(schema) ? [...(additionalDepthsAbove ?? []), ownDepth] : additionalDepthsAbove;
  }, [additionalDepthsAbove, schema, fieldPath]);
}
