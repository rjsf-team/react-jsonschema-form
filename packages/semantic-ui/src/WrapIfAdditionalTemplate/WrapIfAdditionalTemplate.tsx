import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, buttonId, TranslatableString, getWidget } from '@rjsf/utils';
import { Form, Grid } from 'semantic-ui-react';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    style,
    disabled,
    id,
    label,
    displayLabel,
    onKeyRenameBlur,
    onRemoveProperty,
    rawDescription,
    readonly,
    required,
    schema,
    uiSchema,
    registry,
    propertyNamesEnum,
  } = props;
  const { templates, translateString, widgets } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const { readonlyAsDisabled = true, wrapperStyle } = registry.formContext;

  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const margin = rawDescription ? 4 : 24;

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

  return (
    <div className={classNames} style={style} key={`${id}-key`}>
      <Grid>
        <Grid.Row>
          <Grid.Column width={7} className='form-additional'>
            <Form.Group widths='equal' grouped>
              {SelectWidget ? (
                <SelectWidget
                  key={label}
                  id={id}
                  name={id}
                  value={label}
                  required={required}
                  disabled={disabled || (readonlyAsDisabled && readonly)}
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
                <Form.Input
                  key={label}
                  className='form-group'
                  hasFeedback
                  fluid
                  htmlFor={id}
                  label={displayLabel ? keyLabel : undefined}
                  required={required}
                  defaultValue={label}
                  disabled={disabled || (readonlyAsDisabled && readonly)}
                  id={id}
                  name={id}
                  onBlur={!readonly ? onKeyRenameBlur : undefined}
                  style={wrapperStyle}
                  type='text'
                />
              )}
            </Form.Group>
          </Grid.Column>
          <Grid.Column width={7} className='form-additional' verticalAlign='middle'>
            {children}
          </Grid.Column>
          <Grid.Column verticalAlign='middle' style={displayLabel ? { marginTop: `${margin}px` } : undefined}>
            <RemoveButton
              id={buttonId(id, 'remove')}
              iconType='mini'
              className='rjsf-object-property-remove'
              disabled={disabled || readonly}
              onClick={onRemoveProperty}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
}
