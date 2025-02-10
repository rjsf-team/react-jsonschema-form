import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrowDown, faArrowUp, faCopy, faTrash, faAdd } from '@fortawesome/free-solid-svg-icons';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import DaisyUIButton from './DaisyUIButton';

library.add(faAdd, faCopy, faArrowDown, faArrowUp, faTrash);

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  className,
  onClick,
  disabled,
  registry,
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  console.log('AddButton', registry);
  return (
    <div className='row'>
      <p className={`col-xs-3 col-xs-offset-9 text-right ${className}`}>
        <DaisyUIButton
          iconType='info'
          icon={faAdd}
          className='btn-add col-xs-12 btn-primary btn-primary-content'
          title={translateString(TranslatableString.AddButton)}
          onClick={onClick}
          disabled={disabled}
          registry={registry}
        />
      </p>
    </div>
  );
}
