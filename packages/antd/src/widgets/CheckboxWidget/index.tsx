import { FocusEvent } from 'react';
import Checkbox, { CheckboxChangeEvent } from 'antd/lib/checkbox';
import {
  ariaDescribedByIds,
  descriptionId,
  getTemplate,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  GenericObjectType,
} from '@rjsf/utils';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    formContext,
    id,
    label,
    displayLabel = true,
    onBlur,
    onChange,
    onFocus,
    readonly,
    value,
    registry,
    options,
    schema,
    uiSchema,
  } = props;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options
  );

  const handleChange = ({ target }: CheckboxChangeEvent) => onChange(target.checked);

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target.checked);

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target.checked);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };
  const description = options.description ?? schema.description;

  return (
    <>
      {displayLabel && !!description && (
        <div>
          <DescriptionFieldTemplate
            id={descriptionId<T>(id)}
            description={description}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      )}
      <Checkbox
        autoFocus={autofocus}
        checked={typeof value === 'undefined' ? false : value}
        disabled={disabled || (readonlyAsDisabled && readonly)}
        id={id}
        name={id}
        onChange={!readonly ? handleChange : undefined}
        {...extraProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        {displayLabel ? label : ''}
      </Checkbox>
    </>
  );
}
