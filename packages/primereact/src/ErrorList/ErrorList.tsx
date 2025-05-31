import { Message } from 'primereact/message';
import { TimesCircleIcon } from 'primereact/icons/timescircle';
import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** The `ErrorList` component is the template that renders all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
        <TimesCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />
        <div className='p-message-summary'>{translateString(TranslatableString.ErrorsLabel)}</div>
      </div>
      <ul className='p-message-list'>
        {errors.map((error, index) => (
          <li key={`error-${index}`}>{error.stack}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <Message
      className='p-message'
      style={{
        borderStyle: 'solid',
        borderColor: '#ff5757',
        borderWidth: '0 0 0 6px',
        width: '100%',
        justifyContent: 'start',
        marginBottom: '1rem',
      }}
      severity='error'
      content={content}
    />
  );
}
