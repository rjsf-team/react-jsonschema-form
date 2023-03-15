import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import Button, { ButtonProps } from 'react-bootstrap/Button';
import { IoIosCopy } from '@react-icons/all-files/io/IoIosCopy';
import { IoIosRemove } from '@react-icons/all-files/io/IoIosRemove';
import { AiOutlineArrowUp } from '@react-icons/all-files/ai/AiOutlineArrowUp';
import { AiOutlineArrowDown } from '@react-icons/all-files/ai/AiOutlineArrowDown';

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F> & ButtonProps
) {
  const { icon, iconType, className, uiSchema, registry, ...otherProps } = props;
  return (
    <Button block={iconType === 'block'} {...otherProps} variant={props.variant || 'light'} size='sm'>
      {icon}
    </Button>
  );
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon={<IoIosCopy />} />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon={<AiOutlineArrowDown />} />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={<AiOutlineArrowUp />} />;
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.RemoveButton)}
      {...props}
      variant='danger'
      icon={<IoIosRemove />}
    />
  );
}
