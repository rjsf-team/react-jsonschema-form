import React, { useCallback } from 'react';
import {
  descriptionId,
  getTemplate,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  WidgetProps,
  labelValue,
  ariaDescribedByIds,
} from '@rjsf/utils';
import { Checkbox } from '@mantine/core';
import { cleanupOptions } from '../utils';

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>): React.ReactElement {
  const {
    id,
    name,
    value = false,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    schema,
    rawErrors,
    options,
    onChange,
    onBlur,
    onFocus,
    registry,
    uiSchema,
  } = props;

  const themeProps = cleanupOptions(options);

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options
  );

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled && !readonly && onChange) {
        onChange(e.currentTarget.checked);
      }
    },
    [onChange, disabled, readonly]
  );

  const handleBlur = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, target.checked);
      }
    },
    [onBlur, id]
  );

  const handleFocus = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, target.checked);
      }
    },
    [onFocus, id]
  );

  const description = options.description || schema.description;
  return (
    <>
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Checkbox
        id={id}
        name={name}
        label={labelValue(label || undefined, hideLabel, false)}
        disabled={disabled || readonly}
        required={required}
        autoFocus={autofocus}
        checked={typeof value === 'undefined' ? false : value === 'true' || value}
        onChange={handleCheckboxChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
        aria-describedby={ariaDescribedByIds<T>(id)}
        {...themeProps}
      />
    </>
  );
}
