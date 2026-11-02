import type { GridTemplateProps } from '@rjsf/utils';
import { logGridSpanWarning } from '@rjsf/utils';
import { Col, Row } from 'react-bootstrap';

/** Renders a `GridTemplate` for react-bootstrap, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Row`/`Col`. A column's `span` is its `xs`
 * unless the caller gives an `xs` of its own.
 *
 * @param props - The GridTemplateProps, including the extra props containing the react-bootstrap grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, fieldId, span, ...rest } = props;
  if (column) {
    logGridSpanWarning(fieldId, span, {
      ownWidth: rest.xs === undefined ? undefined : 'an `xs`',
      wholeSpansOnly: true,
    });
    return (
      <Col xs={span} {...rest}>
        {children}
      </Col>
    );
  }
  return <Row {...rest}>{children}</Row>;
}
