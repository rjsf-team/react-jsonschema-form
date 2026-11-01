import type { GridTemplateProps } from '@rjsf/utils';
import { logOnce } from '@rjsf/utils';
import { Col, Row } from 'antd';

/** Renders a `GridTemplate` for antd, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Row`/`Col`. A column's `span`, in twelfths,
 * becomes `Col`'s `span` in antd's 24ths, rounded to a whole 24th so it names one of antd's `ant-col-*` classes.
 *
 * @param props - The GridTemplateProps, including the extra props containing the antd grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, fieldId, span, ...rest } = props;
  if (column) {
    // Only a `span` written in antd's 24ths before v7 can be over 12, so this one is surely unmigrated
    if (span !== undefined && span > 12) {
      logOnce(
        `A layout grid column's \`span\` of ${span} in "${fieldId}" is more than 12: \`span\` counts twelfths of a row, ` +
          "where antd's counted 24ths before v7, so halve it",
      );
    }
    return (
      <Col span={span === undefined ? undefined : Math.round(span * 2)} {...rest}>
        {children}
      </Col>
    );
  }
  return <Row {...rest}>{children}</Row>;
}
