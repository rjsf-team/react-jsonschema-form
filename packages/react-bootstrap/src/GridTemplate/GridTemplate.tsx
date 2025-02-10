import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for react-bootstrap, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Row`/`Col`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the react-bootstrap grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;
  if (column) {
    return <Col {...rest}>{children}</Col>;
  }
  return <Row {...rest}>{children}</Row>;
}
