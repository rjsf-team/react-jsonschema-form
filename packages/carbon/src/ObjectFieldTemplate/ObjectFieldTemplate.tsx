import { Stack } from '@carbon/react';
// @ts-expect-error miss types for `@carbon/layout`
import { spacing } from '@carbon/layout';
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
import { LayerBackground } from '../components/Layer';
import getCarbonOptions from '../utils';
import { useNestDepth } from '../contexts';

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
  const carbonOptions = getCarbonOptions<T, S, F>(registry.formContext, uiOptions);
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
  const depth = useNestDepth();

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
      {/* If this object is the very top one, add margin after title section */}
      {!depth && (title || description) && (
        <div style={{ height: `calc(${spacing[carbonOptions.gap - 1]} - 0.5rem)` }} />
      )}
      <LayerBackground padding={carbonOptions.padding}>
        <Stack gap={carbonOptions.gap}>
          {properties.length > 0 && <Stack gap={carbonOptions.gap}>{properties.map((item) => item.content)}</Stack>}
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
