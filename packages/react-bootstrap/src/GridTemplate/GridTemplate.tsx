import type { GridTemplateProps } from '@rjsf/utils';
import { logOnce } from '@rjsf/utils';
import { Col, Row } from 'react-bootstrap';

/** Renders a `GridTemplate` for react-bootstrap, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Row`/`Col`. A column's `span` is its `xs`
 * unless the caller gives an `xs` of its own.
 *
 * @param props - The GridTemplateProps, including the extra props containing the react-bootstrap grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, fieldId, span, ...rest } = props;
  const spanned = column && span !== undefined;
  if (spanned && rest.xs !== undefined) {
    logOnce(`A layout grid column's \`span\` in "${fieldId}" is ignored, since the column has an \`xs\` of its own`);
  } else if (spanned && !Number.isInteger(span)) {
    logOnce(
      `A layout grid column's \`span\` of ${span} in "${fieldId}" is not a whole number, which this theme's grid needs`,
    );
  }
  if (column) {
    return (
      <Col xs={span} {...rest}>
        {children}
      </Col>
    );
  }
  return <Row {...rest}>{children}</Row>;
}
