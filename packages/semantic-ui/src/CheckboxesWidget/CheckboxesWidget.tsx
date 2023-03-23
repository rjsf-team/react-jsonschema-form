import { ChangeEvent } from 'react';
import { Form } from 'semantic-ui-react';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getTemplate,
  optionId,
  titleId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { getSemanticProps } from '../util';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    disabled,
    options,
    value,
    autofocus,
    readonly,
    label,
    hideLabel,
    onChange,
    onBlur,
    onFocus,
    formContext,
    schema,
    uiSchema,
    rawErrors = [],
    registry,
  } = props;
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, options);
  const { enumOptions, enumDisabled, inline } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];
  const semanticProps = getSemanticProps<T, S, F>({
    options,
    formContext,
    uiSchema,
    defaultSchemaProps: {
      inverted: 'false',
    },
  });
  const _onChange =
    (index: number) =>
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
      // eslint-disable-next-line no-shadow
      if (checked) {
        onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
      } else {
        onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
      }
    };

  const _onBlur = () => onBlur(id, value);
  const _onFocus = () => onFocus(id, value);
  const inlineOption = inline ? { inline: true } : { grouped: true };
  return (
    <>
      {!hideLabel && !!label && (
        <TitleFieldTemplate id={titleId<T>(id)} title={label} schema={schema} uiSchema={uiSchema} registry={registry} />
      )}
      <Form.Group id={id} name={id} {...inlineOption}>
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            return (
              <Form.Checkbox
                id={optionId(id, index)}
                name={id}
                key={index}
                label={option.label}
                {...semanticProps}
                checked={checked}
                error={rawErrors.length > 0}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={_onChange(index)}
                onBlur={_onBlur}
                onFocus={_onFocus}
                aria-describedby={ariaDescribedByIds<T>(id)}
              />
            );
          })}
      </Form.Group>
    </>
  );
}
