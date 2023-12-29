import * as React from 'react';
import Input from '@mui/joy/Input';
import {
  BaseInputTemplateProps,
  examplesId,
  getInputProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { styled } from '@mui/joy/styles';

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    name, // remove this from textFieldProps
    placeholder,
    required,
    type,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  // Now we need to pull out the step, min, max into an inner `inputProps` for material-ui
  const { step, min, max, ...rest } = inputProps;
  const otherProps = {
    inputProps: {
      step,
      min,
      max,
      ...(schema.examples ? { list: examplesId<T>(id) } : undefined),
    },
    ...rest,
  };
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <>
      <Input
        slots={{ input: InnerInput }}
        slotProps={{
          input: {
            id,
            name,
            placeholder,
            type: otherProps.type,
            autoComplete: otherProps.autoComplete,
          },
        }}
        autoFocus={autofocus}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        required={required}
        sx={{
          '--Input-minHeight': '56px',
          '--Input-radius': '6px',
        }}
      />

      {/* <Input
        id={id}
        name={id}
        placeholder={placeholder}
        label={labelValue(label || undefined, hideLabel, undefined)}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        {...otherProps}
        value={value || value === 0 ? value : ""}
        error={rawErrors.length > 0}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        InputLabelProps={DisplayInputLabelProps}
        {...textFieldProps}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      /> */}
      {Array.isArray(schema.examples) && (
        <datalist id={examplesId<T>(id)}>
          {(schema.examples as string[])
            .concat(schema.default && !schema.examples.includes(schema.default) ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </>
  );
}

const StyledInput = styled('input')({
  border: 'none', // remove the native input border
  minWidth: 0, // remove the native input width
  outline: 0, // remove the native input outline
  padding: 0, // remove the native input padding
  paddingTop: '1em',
  flex: 1,
  color: 'inherit',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  fontStyle: 'inherit',
  fontWeight: 'inherit',
  lineHeight: 'inherit',
  textOverflow: 'ellipsis',
  '&::placeholder': {
    opacity: 0,
    transition: '0.1s ease-out',
  },
  '&:focus::placeholder': {
    opacity: 1,
  },
  '&:focus ~ label, &:not(:placeholder-shown) ~ label, &:-webkit-autofill ~ label': {
    top: '0.5rem',
    fontSize: '0.75rem',
  },
  '&:focus ~ label': {
    color: 'var(--Input-focusedHighlight)',
  },
  '&:-webkit-autofill': {
    alignSelf: 'stretch', // to fill the height of the root slot
  },
  '&:-webkit-autofill:not(* + &)': {
    marginInlineStart: 'calc(-1 * var(--Input-paddingInline))',
    paddingInlineStart: 'var(--Input-paddingInline)',
    borderTopLeftRadius: 'calc(var(--Input-radius) - var(--variant-borderWidth, 0px))',
    borderBottomLeftRadius: 'calc(var(--Input-radius) - var(--variant-borderWidth, 0px))',
  },
});

const StyledLabel = styled('label')(({ theme }) => ({
  position: 'absolute',
  lineHeight: 1,
  top: 'calc((var(--Input-minHeight) - 1em) / 2)',
  color: theme.vars.palette.text.tertiary,
  fontWeight: theme.vars.fontWeight.md,
  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
}));

const InnerInput = React.forwardRef(function InnerInput(props, ref: any) {
  const id = (React as any).useId();
  return (
    <>
      <StyledInput {...props} ref={ref} id={id} />
      <StyledLabel htmlFor={id}>Label</StyledLabel>
    </>
  );
});
