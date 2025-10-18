import { FieldProps, FieldTemplateProps, ID_KEY, FieldPathId, RJSFSchema, getTemplate } from '@rjsf/utils';
import noop from 'lodash/noop';

import { Sample } from './Sample';

function UiField(props: FieldProps) {
  const { fieldPathId, formData, onChange, registry, schema, uiSchema, ...otherProps } = props;
  const { fields, schemaUtils } = registry;
  const changeHandlerFactory = (fieldName: string) => (value: any) => {
    onChange(value, [fieldName]);
  };

  const { StringField, NumberField } = fields;
  const FieldTemplate = getTemplate('FieldTemplate', registry);
  const schema1 = (schema.anyOf?.[0] || {}) as RJSFSchema;
  const schema2 = (schema.anyOf?.[1] || {}) as RJSFSchema;
  const cityLabel = 'City';
  const latLabel = 'Latitude';
  const lonLabel = 'Longitude';
  const cityKey = 'city';
  const latKey = 'lat';
  const lonKey = 'lon';
  const citySchema = schemaUtils.findFieldInSchema(schema1, cityKey, {} as RJSFSchema);
  const latSchema = schemaUtils.findFieldInSchema(schema2, latKey, {} as RJSFSchema);
  const lonSchema = schemaUtils.findFieldInSchema(schema2, lonKey, {} as RJSFSchema);
  const cityFieldPathId: FieldPathId = { [ID_KEY]: cityKey, path: [cityKey] };
  const latFieldPathId: FieldPathId = { [ID_KEY]: latKey, path: [latKey] };
  const lonFieldPathId: FieldPathId = { [ID_KEY]: lonKey, path: [lonKey] };

  const fieldTemplateProps: Omit<FieldTemplateProps, 'label' | 'id' | 'children'> = {
    registry,
    schema,
    uiSchema,
    displayLabel: true,
    disabled: false,
    readonly: false,
    onChange,
    onKeyRename: () => noop,
    onKeyRenameBlur: () => noop,
    onRemoveProperty: () => noop,
  };

  return (
    <>
      <h4>Location</h4>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            margin: '1rem',
          }}
        >
          <FieldTemplate {...fieldTemplateProps} id={cityFieldPathId[ID_KEY]} label={cityLabel}>
            <StringField
              schema={citySchema.field!}
              registry={registry}
              {...otherProps}
              name={cityLabel}
              required={citySchema.isRequired}
              fieldPathId={cityFieldPathId}
              formData={formData.city}
              onChange={changeHandlerFactory(cityKey)}
            />
          </FieldTemplate>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            margin: '1rem',
          }}
        >
          <FieldTemplate {...fieldTemplateProps} id={latFieldPathId[ID_KEY]} label={latLabel}>
            <NumberField
              schema={latSchema.field!}
              registry={registry}
              {...otherProps}
              name={latLabel}
              required={latSchema.isRequired}
              fieldPathId={latFieldPathId}
              formData={formData.lat}
              onChange={changeHandlerFactory(latKey)}
            />
          </FieldTemplate>
          <FieldTemplate {...fieldTemplateProps} id={lonFieldPathId[ID_KEY]} label={lonLabel}>
            <NumberField
              schema={lonSchema.field!}
              registry={registry}
              {...otherProps}
              name={lonLabel}
              required={lonSchema.isRequired}
              fieldPathId={lonFieldPathId}
              formData={formData.lon}
              onChange={changeHandlerFactory(lonKey)}
            />
          </FieldTemplate>
        </div>
      </div>
    </>
  );
}

const customFieldAnyOf: Sample = {
  schema: {
    title: 'Location',
    type: 'object',
    anyOf: [
      {
        title: 'City',
        properties: {
          city: {
            type: 'string',
          },
        },
        required: ['city'],
      },
      {
        title: 'Coordinates',
        properties: {
          lat: {
            type: 'number',
          },
          lon: {
            type: 'number',
          },
        },
        required: ['lat', 'lon'],
      },
    ],
  },
  uiSchema: {
    'ui:field': UiField,
    'ui:fieldReplacesAnyOrOneOf': true,
  },
  formData: {},
};

export default customFieldAnyOf;
