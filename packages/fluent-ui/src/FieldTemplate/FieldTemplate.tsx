import {
  FieldTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { Text } from "@fluentui/react";

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    errors,
    help,
    rawDescription,
    hidden,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<
    "WrapIfAdditionalTemplate",
    T,
    S,
    F
  >("WrapIfAdditionalTemplate", registry, uiOptions);
  // TODO: do this better by not returning the form-group class from master.
  let { classNames = "" } = props;
  classNames = "ms-Grid-col ms-sm12 " + classNames.replace("form-group", "");
  return (
    <WrapIfAdditionalTemplate {...props}>
      <div
        id={id}
        className={classNames}
        style={{ marginBottom: 15, display: hidden ? "none" : undefined }}
      >
        {children}
        {rawDescription && <Text>{rawDescription}</Text>}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
}
