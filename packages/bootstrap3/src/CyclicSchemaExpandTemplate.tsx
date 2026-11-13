import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { expandButtonId, joinClassNames, TranslatableString } from '@rjsf/utils';

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls.
 * It keeps the top margin `@rjsf/core`'s gives its box through `rjsf.css`, which this theme doesn't load
 *
 * @param props - The `CyclicSchemaExpandProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, id, registry, onExpand } = props;
  const { translateString, classMap } = registry;
  return (
    <div className='rjsf-cyclic-schema' style={{ marginTop: '1rem' }}>
      <div className={joinClassNames('rjsf-cyclic-schema-message', classMap.cyclicSchemaMessage)}>
        {translateString(TranslatableString.CycleDetected, [name])}
      </div>
      <div>
        <button
          id={expandButtonId(id)}
          type='button'
          className={joinClassNames('rjsf-cyclic-schema-expand', classMap.cyclicSchemaExpandButton)}
          onClick={() => onExpand(id)}
        >
          {translateString(TranslatableString.ExpandButton)}
        </button>{' '}
      </div>
    </div>
  );
}
