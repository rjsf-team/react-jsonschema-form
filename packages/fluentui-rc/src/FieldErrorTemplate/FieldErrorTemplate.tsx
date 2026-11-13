import { makeStyles, tokens } from '@fluentui/react-components';
import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';

const useStyles = makeStyles({
  list: { marginTop: 0, marginBottom: 0, paddingLeft: 0, listStyleType: 'none' },
  listItem: {
    paddingLeft: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
  },
  errorLabel: { color: tokens.colorPaletteRedForeground1 },
});

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], id: fieldId } = props;
  const classes = useStyles();

  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldId);

  // One element carries the id a control is described by, so the id appears once and describes every message
  return (
    <ul className={classes.list} id={id}>
      {errors.map((error, i: number) => (
        // oxlint-disable-next-line react/no-array-index-key
        <li key={i} className={classes.listItem}>
          <small className={classes.errorLabel}>{error}</small>
        </li>
      ))}
    </ul>
  );
}
