import { CSSProperties, FocusEvent } from 'react';
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
  label: {
    marginBottom: '4px',
  },
});

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
    onDropPropertyClick,
    onKeyChange,
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
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);
  return (
    <Flex gap='gap.medium' vAlign='center' key={`${id}-key`} className={classNames} style={style}>
      <div>
        <Field label={keyLabel} required={required}>
          <Input
            required={required}
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? handleBlur : undefined}
            type='text'
            input={{
              className: classes.input,
            }}
          />
        </Field>
      </div>
      <div>{children}</div>
      <div>
        <RemoveButton
          id={buttonId<T>(id, 'remove')}
          iconType='default'
          className='rjsf-object-property-remove'
          style={btnStyle}
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
          uiSchema={uiSchema}
          registry={registry}
        />
      </div>
    </Flex>
  );
}
