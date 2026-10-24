import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { expandButtonId, TranslatableString } from '@rjsf/utils';
import { clsx } from 'clsx';

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, id, registry, onExpand } = props;
  const { translateString, classMap } = registry;
  return (
    <div className='rjsf-cyclic-schema'>
      <div className={clsx('rjsf-cyclic-schema-message', classMap.cyclicSchemaMessage)}>
        {translateString(TranslatableString.CycleDetected, [name])}
      </div>
      <div>
        <button
          id={expandButtonId(id)}
          type='button'
          className={clsx('rjsf-cyclic-schema-expand', classMap.cyclicSchemaExpandButton)}
          onClick={() => onExpand(id)}
        >
          {translateString(TranslatableString.ExpandButton)}
        </button>{' '}
      </div>
    </div>
  );
}
