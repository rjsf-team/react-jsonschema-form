import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
} from '@rjsf/utils';
import { FormGroup, Label } from '@trussworks/react-uswds';
import React from 'react';

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    label,
    children,
    required,
    hidden,
    classNames,
    style,
    displayLabel,
    rawErrors = [],
    rawHelp,
    rawDescription,
    registry,
    uiSchema,
    schema,
  } = props;

  const uiOptions = uiSchema?.['ui:options'];

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  const hasErrors = rawErrors.length > 0;
  const showLabel = displayLabel && !!label;

  return (
    <div style={style} className={classNames}>
      <FormGroup error={hasErrors}>
        {showLabel && (
          <Label htmlFor={id} error={hasErrors}>
            {label}
            {required && <span className="usa-label--required">*</span>}
          </Label>
        )}
        {rawDescription && DescriptionFieldTemplate && (
          <DescriptionFieldTemplate
            id={id + '__description'}
            description={rawDescription}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        )}
        {children}
        {rawHelp && (
          <span id={`${id}__help`} className="usa-hint">
            {rawHelp}
          </span>
        )}
      </FormGroup>
    </div>
  );
}
