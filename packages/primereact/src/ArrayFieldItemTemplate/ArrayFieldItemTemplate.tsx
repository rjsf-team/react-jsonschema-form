import {
  ArrayFieldItemTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateProps` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { children, buttonsProps, displayLabel, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );
  return (
    <div style={{ position: 'relative' }}>
      {hasToolbar && (
        <div style={{ position: 'absolute', right: 0, top: displayLabel ? '24px' : 0 }}>
          {hasToolbar && (
            <div style={{ flexDirection: 'row' }}>
              <ArrayFieldItemButtonsTemplate {...buttonsProps} />
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
