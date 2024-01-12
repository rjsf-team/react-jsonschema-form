import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import {
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const { canAdd, disabled, idSchema, uiSchema, items, onAddClick, readonly, registry, required, schema, title } =
    props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <div>
      <Row className='p-0 m-0'>
        <Col className='p-0 m-0'>
          <ArrayFieldTitleTemplate
            idSchema={idSchema}
            title={uiOptions.title || title}
            schema={schema}
            uiSchema={uiSchema}
            required={required}
            registry={registry}
          />
          <ArrayFieldDescriptionTemplate
            idSchema={idSchema}
            description={uiOptions.description || schema.description}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
          <Container fluid key={`array-item-list-${idSchema.$id}`} className='p-0 m-0'>
            {items &&
              items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
                <ArrayFieldItemTemplate key={key} {...itemProps} />
              ))}
            {canAdd && (
              <Container className=''>
                <Row className='mt-2'>
                  <Col xs={9}></Col>
                  <Col xs={3} className='py-4 col-lg-3 col-3'>
                    <AddButton
                      className='array-item-add'
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
