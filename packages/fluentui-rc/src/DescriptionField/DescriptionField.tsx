import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { RichDescription } from '@rjsf/core';

const useStyles = makeStyles({
  label: {
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM,
  },
});

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, registry, uiSchema } = props;
  const classes = useStyles();
  if (!description) {
    return null;
  }

  return (
    <Text block id={id} className={classes.label}>
      <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
    </Text>
  );
}
