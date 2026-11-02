import { Grid, GridItem } from '@chakra-ui/react';
import type { GridTemplateProps } from '@rjsf/utils';
import { logGridSpanWarning } from '@rjsf/utils';

// The props, and keys of a row's `style` or `css`, that give it a column template of its own
const TEMPLATE_KEYS = [
  'templateColumns',
  'gridTemplateColumns',
  'templateAreas',
  'gridTemplateAreas',
  'gridTemplate',
  'grid',
] as const;

/** Renders a `GridTemplate` for chakra-ui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`/`GridItem`. A column's `span` is its
 * `colSpan` unless the caller gives a `colSpan` of its own. A row without `templateColumns`, `templateAreas`,
 * `gridTemplate` or `grid` of its own, as a prop or in its `style` or `css`, lays out on 12 tracks, where each child is
 * full width unless it spans fewer.
 *
 * @param props - The GridTemplateProps, including the extra props containing the chakra-ui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, fieldId, span, ...rest } = props;
  if (column) {
    logGridSpanWarning(fieldId, span, {
      ownWidth: rest.colSpan === undefined ? undefined : 'a `colSpan`',
      wholeSpansOnly: true,
    });
    return (
      <GridItem colSpan={span} {...rest}>
        {children}
      </GridItem>
    );
  }
  const { css, ...gridProps } = rest;
  const cssList = Array.isArray(css) ? css : [css];
  // shortcut: reads only the top-level keys of `css`, so a template set under a breakpoint or condition key, such as
  // `css: { md: { gridTemplateColumns: '1fr 1fr' } }`, isn't seen and the row still gets the 12-track default; search
  // nested keys if that comes up
  const ownsTemplate = [rest, rest.style, ...cssList].some((source) =>
    TEMPLATE_KEYS.some((key) => source?.[key] !== undefined),
  );
  if (ownsTemplate) {
    return <Grid {...rest}>{children}</Grid>;
  }
  return (
    // `:where()` drops the default's specificity to zero, so any placement a child has of its own wins; the leading `*`
    // stops chakra from putting the row's class before a selector that starts with `:`. A row's own `css` is merged
    // after it rather than replacing it, which would leave its children one track wide
    <Grid
      templateColumns='repeat(12, minmax(0, 1fr))'
      css={[{ '*:where(&) > *': { gridColumn: '1 / -1' } }, ...cssList]}
      {...gridProps}
    >
      {children}
    </Grid>
  );
}
