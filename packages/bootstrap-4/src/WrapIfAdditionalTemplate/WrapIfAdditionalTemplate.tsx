import { FocusEvent } from 'react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';

export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  classNames,
  style,
  children,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);
  const keyId = `${id}-key`;

  return (
    <Row className={classNames} style={style} key={keyId}>
      <Col xs={5}>
        <Form.Group>
          <Form.Label htmlFor={keyId}>{keyLabel}</Form.Label>
          <Form.Control
            required={required}
            defaultValue={label}
            disabled={disabled || readonly}
            id={keyId}
            name={keyId}
            onBlur={!readonly ? handleBlur : undefined}
            type='text'
          />
        </Form.Group>
      </Col>
      <Col xs={5}>{children}</Col>
      <Col xs={2} className='py-4'>
        <RemoveButton
          iconType='block'
          className='w-100'
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
          uiSchema={uiSchema}
          registry={registry}
        />
      </Col>
    </Row>
  );
}
