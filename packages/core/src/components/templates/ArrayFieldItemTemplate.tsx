import type { ArrayFieldItemTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions } from '@rjsf/utils';
import { clsx } from 'clsx';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array: the item beside its
 * toolbox of buttons, which `rjsf.css` lays out as a grid
 *
 * @param props - The `ArrayFieldItemTemplateProps` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { children, className, buttonsProps, hasToolbar, registry, uiSchema } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { ArrayFieldItemButtonsTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const { classMap } = registry;
  return (
    <div className={clsx(className, classMap.arrayItem)}>
      {children}
      {hasToolbar && (
        <div className={clsx('rjsf-array-item-toolbox', classMap.arrayItemToolbox)}>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} />
        </div>
      )}
    </div>
  );
}
