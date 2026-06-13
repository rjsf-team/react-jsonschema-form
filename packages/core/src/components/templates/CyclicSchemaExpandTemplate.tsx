import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, TranslatableString } from '@rjsf/utils';

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, fieldPathId, registry, onExpand } = props;
  const { translateString } = registry;
  const buttonId = `${fieldPathId[ID_KEY]}-button`;
  return (
    <div style={{ marginTop: '1rem' }}>
      <div className='text-danger'>{translateString(TranslatableString.CycleDetected, [name])}</div>
      <div>
        <button
          id={buttonId}
          type='button'
          className='btn btn-sm btn-warning'
          onClick={() => onExpand(fieldPathId[ID_KEY])}
        >
          {translateString(TranslatableString.ExpandButton)}
        </button>{' '}
      </div>
    </div>
  );
}
