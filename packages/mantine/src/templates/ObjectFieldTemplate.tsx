import { Box, Container, Group, MantineSpacing, SimpleGrid } from '@mantine/core';
import {
  buttonId,
  canExpand,
  descriptionId,
  FormContextType,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplatePropertyType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  titleId,
} from '@rjsf/utils';

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    title,
    description,
    disabled,
    properties,
    onAddClick,
    readonly,
    required,
    schema,
    uiSchema,
    idSchema,
    formData,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const gridCols = (typeof uiOptions?.gridCols === 'number' && uiOptions?.gridCols) || undefined;
  const gridSpacing = uiOptions?.gridSpacing;
  const gridVerticalSpacing = uiOptions?.gridVerticalSpacing;

  return (
    <Container id={idSchema.$id} p={0}>
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
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <SimpleGrid
        cols={gridCols}
        spacing={gridSpacing as MantineSpacing | undefined}
        verticalSpacing={gridVerticalSpacing as MantineSpacing | undefined}
        mb='sm'
      >
        {properties
          .filter((e) => !e.hidden)
          .map((element: ObjectFieldTemplatePropertyType) => (
            <Box key={element.name}>{element.content}</Box>
          ))}
      </SimpleGrid>

      {canExpand(schema, uiSchema, formData) && (
        <Group mt='xs' justify='flex-end'>
          <AddButton
            id={buttonId<T>(idSchema, 'add')}
            disabled={disabled || readonly}
            onClick={onAddClick(schema)}
            className='rjsf-object-property-expand'
            uiSchema={uiSchema}
            registry={registry}
          />
        </Group>
      )}
    </Container>
  );
}
