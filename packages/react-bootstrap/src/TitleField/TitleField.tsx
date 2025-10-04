import { FormContextType, getUiOptions, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  uiSchema,
  optionalDataControl,
}: TitleFieldProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  let heading = <h5>{uiOptions.title || title}</h5>;
  if (optionalDataControl) {
    heading = (
      <Container fluid className='p-0'>
        <Row>
          <Col xs='11'>{heading}</Col>
          <Col xs='1' style={{ marginLeft: '-5px' }}>
            {optionalDataControl}
          </Col>
        </Row>
      </Container>
    );
  }
  return (
    <div id={id} className='my-1'>
      {heading}
      <hr className='border-0 bg-secondary mt-0' style={{ height: '1px' }} />
    </div>
  );
}
