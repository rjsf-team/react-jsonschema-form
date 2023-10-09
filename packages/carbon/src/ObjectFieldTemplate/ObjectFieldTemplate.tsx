// @ts-expect-error there's no type definition for Stack
import { Stack } from '@carbon/react';
import {
  canExpand,
  descriptionId,
  FormContextType,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  titleId,
} from '@rjsf/utils';
import { useCarbonOptions } from '../contexts';
import { LayerBackground } from '../components/Layer';

/** Implement `ObjectFieldTemplate`
 */
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    idSchema,
    schema,
    formData,
    onAddClick,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const carbonOptions = useCarbonOptions();
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  if (!(properties.length > 0 || canExpand(schema, uiSchema, formData))) {
    return null;
  }
  return (
    <div>
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <div style={{ marginBlockEnd: '0.5rem' }}>
          <DescriptionFieldTemplate
            id={descriptionId<T>(idSchema)}
            description={description}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      )}
      <LayerBackground>
        <Stack gap={carbonOptions.stackGap}>
          {properties.length > 0 && (
            <Stack gap={carbonOptions.stackGap}>{properties.map((item) => item.content)}</Stack>
          )}
          {canExpand(schema, uiSchema, formData) && (
            <AddButton
              onClick={onAddClick(schema)}
              disabled={disabled || readonly}
              className='object-property-expand'
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
        </Stack>
      </LayerBackground>
    </div>
  );
}
