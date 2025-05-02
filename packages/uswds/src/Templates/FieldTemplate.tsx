import { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema, getTemplate, getUiOptions } from '@rjsf/utils';
import { FormGroup } from '@trussworks/react-uswds';

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    children, // The actual field/widget component (e.g., CheckboxWidget)
    classNames,
    style, // Keep style for potential use elsewhere, but don't pass to FormGroup
    hidden,
    errors, // Rendered ErrorList component
    help, // Rendered HelpTemplate component (Alert)
    uiSchema, // Used for WrapIfAdditionalTemplate options
    registry, // Used for WrapIfAdditionalTemplate retrieval
    rawErrors = [], // Need rawErrors to determine error state for FormGroup
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
  );

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  const hasErrors = rawErrors.length > 0;

  // FieldTemplate provides the wrapper structure.
  // WrapIfAdditionalTemplate handles layout for additional props if necessary.
  // The FormGroup handles standard field structure and error state.
  return (
    <WrapIfAdditionalTemplate {...props}>
      <FormGroup error={hasErrors} className={classNames}>
        {children} {/* Render the CheckboxWidget */}
        {errors} {/* Render ErrorList below the widget */}
        {help} {/* Render HelpTemplate (Alert) below the widget */}
      </FormGroup>
    </WrapIfAdditionalTemplate>
  );
}
