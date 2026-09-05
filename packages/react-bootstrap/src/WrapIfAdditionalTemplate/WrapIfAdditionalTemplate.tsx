import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, buttonId, TranslatableString, getWidget } from '@rjsf/utils';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

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
  propertyNamesEnum,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { templates, translateString, widgets } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const descPadding = rawDescription ? 1 : 0;
  const descMargin = rawDescription ? -24 : 0;

  // Use SelectWidget when propertyNamesEnum is available
  const SelectWidget = propertyNamesEnum && propertyNamesEnum.length > 0 ? getWidget(widgets, 'SelectWidget') : null;
  const enumOptions = propertyNamesEnum?.map((value) => ({ value, label: String(value) })) ?? [];

  // Handle onBlur for SelectWidget which expects (id: string, value: any) => void
  // but onKeyRenameBlur expects (event: FocusEvent<HTMLInputElement>) => void
  const handleSelectBlur = useCallback(
    (_id: string, value: any) => {
      onKeyRenameBlur({ target: { value } } as any);
    },
    [onKeyRenameBlur],
  );

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
          {SelectWidget ? (
            <SelectWidget
              key={label}
              id={keyId}
              name={keyId}
              value={label}
              required={required}
              disabled={disabled || readonly}
              readonly={readonly}
              options={{
                enumOptions,
                enumDisabled: [],
              }}
              onBlur={handleSelectBlur}
              onFocus={handleSelectBlur}
              onChange={(value) => {
                onKeyRenameBlur({ target: { value } } as any);
              }}
              schema={{ type: 'string', enum: propertyNamesEnum }}
              as
              any
              registry={registry as any}
              uiSchema={uiSchema as any}
              label={keyLabel}
            />
          ) : (
            <Form.Control
              key={label}
              required={required}
              defaultValue={label}
              disabled={disabled || readonly}
              id={keyId}
              name={keyId}
              onBlur={!readonly ? onKeyRenameBlur : undefined}
              type='text'
            />
          )}
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
