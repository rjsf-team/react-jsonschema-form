import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import DaisyUIButton from './DaisyUIButton';
import { faCopy, faArrowDown, faArrowUp, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <DaisyUIButton title={translateString(TranslatableString.CopyButton)} {...props} icon={faCopy} />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <DaisyUIButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon={faArrowDown} />;
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <DaisyUIButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={faArrowUp} />;
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <DaisyUIButton
      title={translateString(TranslatableString.RemoveButton)}
      {...props}
      iconType='danger'
      icon={faTrash}
    />
  );
}
