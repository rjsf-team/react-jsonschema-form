import type { ArrayFieldItemTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions, joinClassNames } from '@rjsf/utils';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array: the item beside its
 * toolbox of buttons, which `rjsf.css` lays out as a grid. `data-display-label` and `data-has-description` let a
 * stylesheet line the toolbox up with the item's control below its label and description, for any `FieldTemplate`
 * that draws them above it
 *
 * @param props - The `ArrayFieldItemTemplateProps` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { children, className, buttonsProps, displayLabel, hasDescription, hasToolbar, registry, uiSchema } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { ArrayFieldItemButtonsTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const { classMap } = registry;
  return (
    <div
      className={joinClassNames(className, classMap.arrayItem)}
      data-display-label={displayLabel || undefined}
      data-has-description={hasDescription || undefined}
    >
      {children}
      {hasToolbar && (
        <div className={joinClassNames('rjsf-array-item-toolbox', classMap.arrayItemToolbox)}>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} />
        </div>
      )}
    </div>
  );
}
