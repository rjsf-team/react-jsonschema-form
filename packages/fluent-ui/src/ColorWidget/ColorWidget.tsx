import { ColorPicker, IColorPickerProps, IColor, getColorFromString } from '@fluentui/react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import _pick from 'lodash/pick';

import FluentLabel from '../FluentLabel/FluentLabel';

const allowedProps: (keyof IColorPickerProps)[] = [
  'componentRef',
  'color',
  'strings',
  'onChange',
  'alphaType',
  'alphaSliderHidden',
  'hexLabel',
  'redLabel',
  'greenLabel',
  'blueLabel',
  'alphaLabel',
  'className',
  'theme',
  'styles',
  'showPreview',
];

export default function ColorWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  value,
  required,
  label,
  hideLabel,
  onChange,
}: WidgetProps<T, S, F>) {
  const updateColor = (_ev: any, colorObj: IColor) => {
    onChange(colorObj.hex);
  };

  const uiProps = { id, ..._pick((options.props as object) || {}, allowedProps) };

  return (
    <>
      {labelValue(<FluentLabel label={label || undefined} required={required} id={id} />, hideLabel)}
      <ColorPicker
        color={getColorFromString(value) as any}
        onChange={updateColor}
        alphaType='alpha'
        showPreview={true}
        {...uiProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}
