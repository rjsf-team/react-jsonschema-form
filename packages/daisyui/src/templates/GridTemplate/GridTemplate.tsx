import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for DaisyUI, which follows the same pattern as other RJSF themes.
 * This uses DaisyUI's grid system with flexbox for responsive layouts.
 *
 * @param props - The GridTemplateProps, including children and column flag
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;

  if (column) {
    // For columns, use DaisyUI's flex classes
    return (
      <div className='flex-grow' {...rest}>
        {children}
      </div>
    );
  }

  // For rows, use DaisyUI's flex container with wrap
  return (
    <div className='flex flex-wrap gap-4' {...rest}>
      {children}
    </div>
  );
}
