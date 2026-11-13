import { Box, Grid, GridItem } from '@chakra-ui/react';
import type { FormContextType, ObjectFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  buttonId,
  descriptionId,
  getContainerAttributes,
  getTemplates,
  getUiOptions,
  titleDrawsOptionalDataControl,
  titleId,
} from '@rjsf/utils';

export default function ObjectFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    presentation,
    id,
    schema,
    formData,
    optionalDataControl,
    onAddProperty,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { TitleFieldTemplate, DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const showOptionalDataControlInTitle = titleDrawsOptionalDataControl<T, S, F>(props);
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const { schemaUtils } = registry;

  return (
    // Spaces its parts as the `FieldTemplate`'s `Fieldset.Content` around it spaces its own children
    <Box
      id={id}
      role='group'
      display='flex'
      flexDirection='column'
      gap={4}
      {...getContainerAttributes(presentation, id, title)}
    >
      {title && (
        <TitleFieldTemplate
          id={titleId(id)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={presentation?.description.id ?? descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Grid gap={description ? 2 : 4} mb={4}>
        {!showOptionalDataControlInTitle && optionalDataControl ? (
          <GridItem>{optionalDataControl}</GridItem>
        ) : undefined}
        {properties.map((element) =>
          element.hidden ? element.content : <GridItem key={element.content.key}>{element.content}</GridItem>,
        )}
        {schemaUtils.canExpand(schema, uiSchema, formData) && (
          <GridItem justifySelf='flex-end'>
            <AddButton
              id={buttonId(id, 'add')}
              className='rjsf-object-property-expand'
              onClick={onAddProperty}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          </GridItem>
        )}
      </Grid>
    </Box>
  );
}
