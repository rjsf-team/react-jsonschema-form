import IconButton, { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CopyIcon from '@mui/icons-material/ContentCopy';
import RemoveIcon from '@mui/icons-material/Remove';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

export default function MuiIconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  const { icon, color, uiSchema, registry, ...otherProps } = props;
  return (
    <IconButton {...otherProps} size='small' color={color as MuiIconButtonProps['color']}>
      {icon}
    </IconButton>
  );
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <MuiIconButton
      title={translateString(TranslatableString.CopyButton)}
      {...props}
      icon={<CopyIcon fontSize='small' />}
    />
  );
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <MuiIconButton
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={<ArrowDownwardIcon fontSize='small' />}
    />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <MuiIconButton
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      icon={<ArrowUpwardIcon fontSize='small' />}
    />
  );
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const { iconType, ...otherProps } = props;
  const {
    registry: { translateString },
  } = otherProps;
  return (
    <MuiIconButton
      title={translateString(TranslatableString.RemoveButton)}
      {...otherProps}
      color='error'
      icon={<RemoveIcon fontSize={iconType === 'default' ? undefined : 'small'} />}
    />
  );
}
