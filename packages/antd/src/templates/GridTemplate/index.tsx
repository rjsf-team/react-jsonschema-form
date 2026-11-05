import type { GridTemplateProps } from '@rjsf/utils';
import { logGridSpanWarning, logOnce } from '@rjsf/utils';
import type { ColProps } from 'antd';
import { Col, Row } from 'antd';

const ROW_SIZE_STYLES = ['flex', 'flexBasis', 'flexGrow', 'width'] as const;

/** Renders a `GridTemplate` for antd, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Row`/`Col`. A column's `span`, in twelfths,
 * becomes `Col`'s `span` in antd's 24ths, rounded to a whole 24th so it names one of antd's `ant-col-*` classes, unless
 * the column has a `flex` or a width style of its own. A row without a flex or width style of its own grows to fill its
 * line, so a row nested in a row takes a line of its own rather than shrinking to its content.
 *
 * @param props - The GridTemplateProps, including the extra props containing the antd grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps & Pick<ColProps, 'flex'>) {
  const { children, column, fieldId, span, style, ...rest } = props;
  if (column) {
    // Only a `span` written in antd's 24ths before v7 can be over 12, so this one is surely unmigrated
    if (span !== undefined && span > 12) {
      logOnce(
        `A layout grid column's \`span\` of ${span} in "${fieldId}" is more than 12: \`span\` counts twelfths of a row, ` +
          "where antd's counted 24ths before v7, so halve it",
      );
    }
    // The `ant-col-*` class `span` names would still cap a width of the column's own with its `max-width`, so it's left off
    const ownsWidth =
      rest.flex !== undefined ||
      style?.flex !== undefined ||
      style?.flexBasis !== undefined ||
      style?.width !== undefined;
    logGridSpanWarning(fieldId, span, { ownWidth: ownsWidth ? 'a `flex` or a width' : undefined });
    if (!ownsWidth && span !== undefined && !Number.isInteger(span * 2)) {
      logOnce(
        `A layout grid column's \`span\` of ${span} in "${fieldId}" is finer than a half step, which antd's 24 columns ` +
          `need, so it is rounded to ${Math.round(span * 2) / 2}`,
      );
    }
    return (
      <Col span={span === undefined || ownsWidth ? undefined : Math.round(span * 2)} style={style} {...rest}>
        {children}
      </Col>
    );
  }
  // `flex` rather than `width: 100%`, so a row with a gutter grows by its negative margins as a block-level row does; left
  // off a row with a flex or width style of its own, which the fill would override or mix with
  const fills = ROW_SIZE_STYLES.every((key) => style?.[key] === undefined);
  return (
    <Row style={fills ? { flex: '1 1 100%', ...style } : style} {...rest}>
      {children}
    </Row>
  );
}
