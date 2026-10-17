import type { ComponentProps, ReactNode } from 'react';
import { chakra, Field as ChakraField, useFieldContext, useFieldStyles, useSlotRecipe } from '@chakra-ui/react';

export interface FieldProps extends Omit<ComponentProps<typeof ChakraField.Root>, 'label'> {
  label?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
  optionalText?: ReactNode;
  /** Draws the label with no `for`, for a control a `for` can't name, such as a group of radios or a slider's thumb,
   * which is named by pointing `aria-labelledby` at the label's id instead
   */
  labelNamesNoControl?: boolean;
}

/** A label drawn as Chakra's `Field.Label` draws one, with the `field` recipe's label class and the style it is handed,
 * for a label drawn without that component, which always gives it a `for`
 *
 * @param props - The label's attributes and children, and `css`, the recipe's label style
 */
export function RecipeLabel(props: ComponentProps<typeof chakra.label>) {
  return <chakra.label className='chakra-field__label' {...props} />;
}

/** The `*` marking a required field, styled by the `field` recipe's `requiredIndicator` slot and hidden from a name, as
 * Chakra's `Field.RequiredIndicator` draws it inside a `Field`, for a marker drawn outside one
 *
 * @param props - Style props for the marker, such as the spacing a label's own gap gives it inside a `Field`
 */
export function RequiredMarker(props: ComponentProps<typeof chakra.span>) {
  const styles = useSlotRecipe({ key: 'field' })();
  return (
    <chakra.span className='chakra-field__requiredIndicator' css={styles.requiredIndicator} aria-hidden {...props}>
      *
    </chakra.span>
  );
}

/** The field's label with no `for`: Ark's `Field.Label` always sets one, and ignores an undefined override. It keeps the
 * rest of that label's attributes, as the recipe's disabled style keys off `data-disabled`
 */
function LabelWithoutFor({ children }: { children: ReactNode }) {
  const { htmlFor: _htmlFor, ...labelProps } = useFieldContext().getLabelProps();
  const styles = useFieldStyles();
  return (
    <RecipeLabel {...labelProps} css={styles.label}>
      {children}
    </RecipeLabel>
  );
}

/**
 * Field component that serves as a wrapper for form fields, providing
 * additional functionality such as labels, helper text, and error messages.
 *
 * @param props - The properties for the field component.
 * @param [props.label] - The label for the field.
 * @param [props.helperText] - Helper text to display below the field.
 * @param [props.errorText] - Error message to display below the field.
 * @param [props.optionalText] - Text to indicate that the field is optional.
 * @param [props.labelNamesNoControl] - Whether the label is drawn with no `for`, for a control a `for` can't name.
 * @returns The rendered field component.
 */
export const Field = ({
  label,
  children,
  helperText,
  errorText,
  optionalText,
  labelNamesNoControl,
  ref,
  ...rest
}: FieldProps) => {
  const Label = labelNamesNoControl ? LabelWithoutFor : ChakraField.Label;
  return (
    <ChakraField.Root ref={ref} {...rest}>
      {label && (
        <Label>
          {label}
          <ChakraField.RequiredIndicator fallback={optionalText} />
        </Label>
      )}
      {children}
      {helperText && <ChakraField.HelperText>{helperText}</ChakraField.HelperText>}
      {errorText && <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>}
    </ChakraField.Root>
  );
};
