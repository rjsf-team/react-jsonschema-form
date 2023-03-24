import { FocusEvent } from 'react';
import Checkbox from 'antd/lib/checkbox';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  getTemplate,
  optionId,
  titleId,
  FormContextType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
  GenericObjectType,
} from '@rjsf/utils';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  autofocus,
  disabled,
  formContext,
  id,
  label,
  hideLabel,
  onBlur,
  onChange,
  onFocus,
  options,
  readonly,
  registry,
  schema,
  uiSchema,
  value,
}: WidgetProps<T, S, F>) {
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, options);

  const { enumOptions, enumDisabled, inline, emptyValue } = options;

  const handleChange = (nextValue: any) => onChange(enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target.value, enumOptions, emptyValue));

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target.value, enumOptions, emptyValue));

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    id,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, true) as string[];

  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <>
      {!hideLabel && !!label && (
        <div>
          <TitleFieldTemplate
            id={titleId<T>(id)}
            title={label}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      )}
      <Checkbox.Group
        disabled={disabled || (readonlyAsDisabled && readonly)}
        name={id}
        onChange={!readonly ? handleChange : undefined}
        value={selectedIndexes}
        {...extraProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, i) => (
            <span key={i}>
              <Checkbox
                id={optionId(id, i)}
                name={id}
                autoFocus={i === 0 ? autofocus : false}
                disabled={Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1}
                value={String(i)}
              >
                {option.label}
              </Checkbox>
              {!inline && <br />}
            </span>
          ))}
      </Checkbox.Group>
    </>
  ) : null;
}
