import {
  FieldTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Label } from '../util';

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldTemplateProps<T, S, F>) {
  const { children, errors, help, displayLabel, description, rawDescription, hidden, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
  );

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  return (
    <WrapIfAdditionalTemplate {...props}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {displayLabel && <Label id={props.id} text={props.label} required={props.required} />}
        {children}
        {displayLabel && rawDescription && <small>{description}</small>}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
}
