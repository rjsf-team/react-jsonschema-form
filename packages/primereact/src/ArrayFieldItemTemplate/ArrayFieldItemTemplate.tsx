import {
  ArrayFieldItemTemplateType,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { children, buttonsProps, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions
  );
  return (
    <div style={{ position: 'relative' }}>
      {hasToolbar && (
        <div style={{ position: 'absolute', right: 0, top: '-10px' }}>
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
