import type { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
import { Col, Container, Row } from 'react-bootstrap';

/** The `TitleField` is the template to use to render the title of a field. Its `id` goes on the title's text alone, as
 * an option selector beside a container's options is named by it, and the required marker and the optional data
 * control aren't part of that name
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, title, required, optionalDataControl }: TitleFieldProps<T, S, F>) {
  let heading = (
    <h5>
      <span id={id}>{title}</span>
      {required ? '*' : null}
    </h5>
  );
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
    <div className='my-1'>
      {heading}
      <hr className='border-0 bg-secondary mt-0' style={{ height: '1px' }} />
    </div>
  );
}
