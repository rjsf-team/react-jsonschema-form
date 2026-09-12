import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `CyclicSchemaExpandProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, id, registry, onExpand } = props;
  const { translateString } = registry;
  const buttonId = `${id}-button`;
  return (
    <div className='mt-4'>
      <div className='alert alert-warning mb-2'>
        <span>{translateString(TranslatableString.CycleDetected, [name])}</span>
      </div>
      <button id={buttonId} type='button' className='btn btn-sm btn-warning' onClick={() => onExpand(id)}>
        {translateString(TranslatableString.ExpandButton)}
      </button>
    </div>
  );
}
