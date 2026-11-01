import { Grid, GridItem } from '@chakra-ui/react';
import type { GridTemplateProps } from '@rjsf/utils';
import { logOnce } from '@rjsf/utils';

/** Renders a `GridTemplate` for chakra-ui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`/`GridItem`. A column's `span` is its
 * `colSpan` unless the caller gives a `colSpan` of its own. A row without `templateColumns` or `templateAreas` of its own lays
 * out on 12 tracks, where each child is full width unless it spans fewer.
 *
 * @param props - The GridTemplateProps, including the extra props containing the chakra-ui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, fieldId, span, ...rest } = props;
  const spanned = column && span !== undefined;
  if (spanned && rest.colSpan !== undefined) {
    logOnce(
      `A layout grid column's \`span\` in "${fieldId}" is ignored, since the column has a \`colSpan\` of its own`,
    );
  } else if (spanned && !Number.isInteger(span)) {
    logOnce(
      `A layout grid column's \`span\` of ${span} in "${fieldId}" is not a whole number, which this theme's grid needs`,
    );
  }
  if (column) {
    return (
      <GridItem colSpan={span} {...rest}>
        {children}
      </GridItem>
    );
  }
  const { templateColumns, gridTemplateColumns, templateAreas, gridTemplateAreas } = rest;
  if ([templateColumns, gridTemplateColumns, templateAreas, gridTemplateAreas].some((value) => value !== undefined)) {
    return <Grid {...rest}>{children}</Grid>;
  }
  const { css, ...gridProps } = rest;
  return (
    // `:where()` drops the default's specificity to zero, so any placement a child has of its own wins; the leading `*`
    // stops chakra from putting the row's class before a selector that starts with `:`. A row's own `css` is merged
    // after it rather than replacing it, which would leave its children one track wide
    <Grid
      templateColumns='repeat(12, minmax(0, 1fr))'
      css={[{ '*:where(&) > *': { gridColumn: '1 / -1' } }, ...(Array.isArray(css) ? css : [css])]}
      {...gridProps}
    >
      {children}
    </Grid>
  );
}
