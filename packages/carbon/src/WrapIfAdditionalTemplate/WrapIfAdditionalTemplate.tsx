import { FormGroup, Stack, TextInput } from '@carbon/react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
  getUiOptions,
} from '@rjsf/utils';
import { LayerBackground } from '../components/Layer';
import { LabelValue } from '../components/LabelValue';
import getCarbonOptions from '../utils';

export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    id,
    classNames,
    style,
    disabled,
    label,
    onKeyChange,
    onDropPropertyClick,
    readonly,
    required,
    schema,
    children,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const carbonOptions = getCarbonOptions<T, S, F>(registry.formContext, uiOptions);
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

  return (
    <div className={classNames} style={style}>
      <FormGroup legendText={<LabelValue hide={false} label={label} required={required} />}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ flex: 1 }}>
            <LayerBackground padding={carbonOptions.padding}>
              <Stack gap={carbonOptions.gap}>
                <TextInput
                  labelText={keyLabel}
                  type='text'
                  id={`${id}-key`}
                  onBlur={(event) => onKeyChange(event.target.value)}
                  defaultValue={label}
                />
                {children}
              </Stack>
            </LayerBackground>
          </div>
          <div
            style={{
              marginLeft: '1rem',
            }}
          >
            <RemoveButton
              className='additional-item-remove'
              disabled={disabled || readonly}
              onClick={onDropPropertyClick(label)}
              uiSchema={uiSchema}
              registry={registry}
            />
          </div>
        </div>
      </FormGroup>
    </div>
  );
}
