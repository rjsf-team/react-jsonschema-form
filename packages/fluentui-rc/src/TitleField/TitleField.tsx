import { Text, Divider, makeStyles, tokens } from '@fluentui/react-components';
import { Flex } from '@fluentui/react-migration-v0-v9';
import type { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

const useStyles = makeStyles({
  root: {
    marginTop: '8px',
    marginBottom: '8px',
  },
  // Fluent's `Label` draws its required `*` this way
  required: {
    color: tokens.colorPaletteRedForeground3,
    paddingLeft: tokens.spacingHorizontalXS,
  },
});

/** The `TitleField` is the template to use to render the title of a field. Its `id` goes on the title's text alone, as
 * an option selector beside a container's options is named by it, and the required marker and the optional data
 * control aren't part of that name
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, title, required, optionalDataControl }: TitleFieldProps<T, S, F>) {
  const classes = useStyles();
  let heading = (
    <Text as='h5' size={600} style={{ marginBlock: 0 }}>
      <span id={id}>{title}</span>
      {required && (
        <span aria-hidden className={classes.required}>
          *
        </span>
      )}
    </Text>
  );
  if (optionalDataControl) {
    heading = (
      <Flex>
        <Flex fill>{heading}</Flex>
        <Flex hAlign='end'>{optionalDataControl}</Flex>
      </Flex>
    );
  }
  return (
    <div className={classes.root}>
      {heading}
      <Divider />
    </div>
  );
}
