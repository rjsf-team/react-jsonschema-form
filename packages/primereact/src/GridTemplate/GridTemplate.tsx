import { useEffect, useState } from 'react';
import { GridTemplateProps } from '@rjsf/utils';

const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

type Breakpoint = keyof typeof breakpoints;
type ResponsiveSpan = Partial<Record<Breakpoint, number>>;

function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.xl) {
    return 'xl';
  }
  if (width >= breakpoints.lg) {
    return 'lg';
  }
  if (width >= breakpoints.md) {
    return 'md';
  }
  if (width >= breakpoints.sm) {
    return 'sm';
  }
  return 'xs';
}

function getResponsiveSpan(spanDef: ResponsiveSpan, breakpoint: Breakpoint): number {
  return spanDef[breakpoint] ?? spanDef.xl ?? spanDef.lg ?? spanDef.md ?? spanDef.sm ?? spanDef.xs ?? 12;
}

function getInitialWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : breakpoints.xs;
}

/** Renders a `GridTemplate`, which is expecting the column size for each viewport breakpoint (xs, sm, md, lg, xl)
 *  coming in via the extra props provided by the caller.
 *  Uses a 12 column grid by default. This can be overridden by passing `layoutGrid` in `uiSchema`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the grid sizing details
 */
export default function GridTemplate(props: GridTemplateProps) {
  return props.column ? GridTemplateColumn(props) : GridTemplateRow(props);
}

function GridTemplateRow(props: GridTemplateProps) {
  const { children, column, uiSchema, style, ...rest } = props;
  const layoutGrid = uiSchema?.['ui:layoutGrid'] ?? {};
  const totalColumns = layoutGrid.columns ?? 12;
  const gap = layoutGrid.gap ?? '16px';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
        alignItems: 'start',
        gap,
        ...(style ?? {}),
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function GridTemplateColumn(props: GridTemplateProps) {
  const { children, column, uiSchema, xs, sm, md, lg, xl, style, ...rest } = props;

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => getBreakpoint(getInitialWidth()));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => setBreakpoint(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const span = getResponsiveSpan(props as ResponsiveSpan, breakpoint);

  return (
    <div style={{ gridColumn: `span ${span} / span ${span}`, ...(style ?? {}) }} {...rest}>
      {children}
    </div>
  );
}
