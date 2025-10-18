import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import {
  ArrayFieldTemplateProps,
  buttonId,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    disabled,
    fieldPathId,
    uiSchema,
    items,
    optionalDataControl,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <div>
      <Row className='p-0 m-0'>
        <Col className='p-0 m-0'>
          <ArrayFieldTitleTemplate
            fieldPathId={fieldPathId}
            title={uiOptions.title || title}
            schema={schema}
            uiSchema={uiSchema}
            required={required}
            registry={registry}
            optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
          />
          <ArrayFieldDescriptionTemplate
            fieldPathId={fieldPathId}
            description={uiOptions.description || schema.description}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
          <Container fluid key={`array-item-list-${fieldPathId.$id}`} className='p-0 m-0'>
            {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
            {items}
            {canAdd && (
              <Container className=''>
                <Row className='mt-2'>
                  <Col xs={9}></Col>
                  <Col xs={3} className='py-4 col-lg-3 col-3'>
                    <AddButton
                      id={buttonId(fieldPathId, 'add')}
                      className='rjsf-array-item-add'
                      onClick={onAddClick}
                      disabled={disabled || readonly}
                      uiSchema={uiSchema}
                      registry={registry}
                    />
                  </Col>
                </Row>
              </Container>
            )}
          </Container>
        </Col>
      </Row>
    </div>
  );
}
