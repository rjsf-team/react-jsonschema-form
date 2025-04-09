import {
  FormContextType,
  ObjectFieldTemplateProps,
  ObjectFieldTemplatePropertyType,
  RJSFSchema,
  StrictRJSFSchema,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId,
} from '@rjsf/utils';
import { Container, Box, SimpleGrid, MantineSpacing } from '@mantine/core';

export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
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
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const gridCols = (typeof uiOptions?.gridCols === 'number' && uiOptions?.gridCols) || undefined;
  const gridSpacing = uiOptions?.gridSpacing;
  const gridVerticalSpacing = uiOptions?.gridVerticalSpacing;

  return (
    <Container id={idSchema.$id}>
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
        <Box mt='xs'>
          <AddButton
            disabled={disabled || readonly}
            onClick={onAddClick(schema)}
            uiSchema={uiSchema}
            registry={registry}
          />
        </Box>
      )}
    </Container>
  );
}
