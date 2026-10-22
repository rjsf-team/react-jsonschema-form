import type { FormContextType, ObjectFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  buttonId,
  descriptionId,
  getTemplates,
  getUiOptions,
  titleDrawsOptionalDataControl,
  titleId,
} from '@rjsf/utils';
import { Col, Container, Row } from 'react-bootstrap';

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
    uiSchema,
    presentation,
    id,
    schema,
    formData,
    optionalDataControl,
    onAddProperty,
    disabled,
    readonly,
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
    <>
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
      <Container fluid className='p-0'>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {properties.map((element) => (
          <Row key={element.name} style={{ marginBottom: '10px' }} className={element.hidden ? 'd-none' : undefined}>
            <Col xs={12}> {element.content}</Col>
          </Row>
        ))}
        {schemaUtils.canExpand(schema, uiSchema, formData) ? (
          <Row>
            <Col xs={{ offset: 11, span: 1 }} className='py-0.5'>
              <AddButton
                id={buttonId(id, 'add')}
                onClick={onAddProperty}
                disabled={disabled || readonly}
                className='rjsf-object-property-expand'
                uiSchema={uiSchema}
                registry={registry}
              />
            </Col>
          </Row>
        ) : null}
      </Container>
    </>
  );
}
