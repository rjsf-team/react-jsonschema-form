import {
  ariaDescribedByIds,
  FormContextType,
  getInputProps,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { ChangeEvent, useState } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';

export default function AutoCompleteWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    placeholder,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    type,
    rawErrors = [],
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  const examples = (schema.examples as string[]).concat(
    schema.default && !(schema.examples as string[]).includes(schema.default.toString())
      ? [schema.default.toString()]
      : []
  );

  const [items, setItems] = useState<string[]>([]);

  const search = (event: AutoCompleteCompleteEvent) => {
    setItems(examples.filter((example) => example.toString().toLowerCase().includes(event.query.toLowerCase())));
  };

  return (
    <AutoComplete
      id={id}
      name={id}
      placeholder={placeholder}
      {...inputProps}
      loadingIcon={<></>}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      suggestions={items}
      completeMethod={search}
      value={value || value === 0 ? value : ''}
      dropdown
      invalid={rawErrors.length > 0}
      onChange={(onChangeOverride as any) || _onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      /* Make autocomplete look like a dropdown, which looks much nicer */
      pt={{
        root: {
          className: 'p-dropdown',
        },
        input: {
          root: {
            style: { border: 'none' },
          },
        },
        dropdownButton: {
          root: {
            className: 'p-button-text p-button-secondary',
          },
        },
      }}
    />
  );
}
