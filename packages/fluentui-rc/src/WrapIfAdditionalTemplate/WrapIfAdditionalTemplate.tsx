import { CSSProperties } from 'react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  buttonId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import { Field, Input, makeStyles } from '@fluentui/react-components';
import { Flex } from '@fluentui/react-migration-v0-v9';

const useStyles = makeStyles({
  input: {
    width: '100%',
  },
  grow: {
    flexGrow: 1,
  },
  halfWidth: {
    width: '46%',
  },
  alignEnd: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  alignCenter: {
    alignSelf: 'center',
    marginTop: '-14px',
    justifyContent: 'flex-end',
  },
  label: {
    marginBottom: '4px',
  },
});

const containerTypes = ['object', 'array'];

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    style,
    disabled,
    id,
    label,
    displayLabel,
    onRemoveProperty,
    onKeyRenameBlur,
    rawDescription,
    readonly,
    required,
    schema,
    uiSchema,
    registry,
  } = props;
  const { templates, translateString } = registry;
  const classes = useStyles();
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const hasDescription = !!rawDescription;
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };

  if (!additional) {
    const { type } = schema;
    // Flex grow only non container classes
    const className = containerTypes.includes(type as string) ? classNames : `${classes.grow} ${classNames}`;
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <Flex gap='gap.medium' vAlign='start' key={`${id}-key`} className={classNames} style={style}>
      <div className={classes.halfWidth}>
        <Field label={displayLabel ? keyLabel : undefined} required={required}>
          <Input
            required={required}
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? onKeyRenameBlur : undefined}
            type='text'
            input={{
              className: classes.input,
            }}
          />
        </Field>
      </div>
      <div className={classes.halfWidth}>{children}</div>
      <div className={hasDescription ? classes.alignCenter : classes.alignEnd}>
        <RemoveButton
          id={buttonId(id, 'remove')}
          iconType='default'
          className='rjsf-object-property-remove'
          style={btnStyle}
          disabled={disabled || readonly}
          onClick={onRemoveProperty}
          uiSchema={uiSchema}
          registry={registry}
        />
      </div>
    </Flex>
  );
}
