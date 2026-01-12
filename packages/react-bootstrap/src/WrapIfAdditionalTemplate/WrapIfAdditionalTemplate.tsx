import {
  ADDITIONAL_PROPERTY_FLAG,
  buttonId,
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
  F extends FormContextType = any,
>({
  classNames,
  style,
  children,
  disabled,
  id,
  label,
  displayLabel,
  onRemoveProperty,
  onKeyRenameBlur,
  rawDescription,
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
  const descPadding = rawDescription ? 1 : 0;
  const descMargin = rawDescription ? -24 : 0;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const keyId = `${id}-key`;
  const margin = displayLabel ? 12 + descMargin : 0;
  const padding = displayLabel ? 4 + descPadding : 1;

  return (
    <Row className={classNames} style={style} key={keyId}>
      <Col xs={5}>
        <Form.Group>
          {displayLabel && <Form.Label htmlFor={keyId}>{keyLabel}</Form.Label>}
          <Form.Control
            required={required}
            defaultValue={label}
            disabled={disabled || readonly}
            id={keyId}
            name={keyId}
            onBlur={!readonly ? onKeyRenameBlur : undefined}
            type='text'
          />
        </Form.Group>
      </Col>
      <Col xs={6}>{children}</Col>
      <Col xs={1} className={`py-${padding} d-grid gap-2`} style={{ marginTop: `${margin}px`, maxHeight: `2.5rem` }}>
        <RemoveButton
          id={buttonId(id, 'remove')}
          className='rjsf-object-property-remove w-100'
          disabled={disabled || readonly}
          onClick={onRemoveProperty}
          uiSchema={uiSchema}
          registry={registry}
        />
      </Col>
    </Row>
  );
}
