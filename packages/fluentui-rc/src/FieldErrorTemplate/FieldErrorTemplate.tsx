import { makeStyles, tokens } from '@fluentui/react-components';
import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

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
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], idSchema } = props;
  const classes = useStyles();

  if (errors.length === 0) {
    return null;
  }
  const id = errorId<T>(idSchema);

  return (
    <ul className={classes.list}>
      {errors.map((error, i: number) => {
        return (
          <li key={i} className={classes.listItem}>
            <small className={classes.errorLabel} id={id}>
              {error}
            </small>
          </li>
        );
      })}
    </ul>
  );
}
