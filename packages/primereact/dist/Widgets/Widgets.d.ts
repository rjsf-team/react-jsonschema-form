/// <reference types="react" />
/// <reference types="@rjsf/core" />
declare const _default: {
    CheckboxWidget: (props: import("@rjsf/core").WidgetProps) => JSX.Element;
    CheckboxesWidget: ({ schema, label, id, disabled, options, value, readonly, required, onChange, }: import("@rjsf/core").WidgetProps) => JSX.Element;
    ColorWidget: import("react").FunctionComponent<import("@rjsf/core").WidgetProps>;
    DateWidget: (props: import("@rjsf/core").WidgetProps) => JSX.Element;
    DateTimeWidget: (props: import("@rjsf/core").WidgetProps) => JSX.Element;
    EmailWidget: (props: import("@rjsf/core").WidgetProps) => JSX.Element;
    PasswordWidget: ({ id, required, readonly, disabled, value, label, onFocus, onBlur, onChange, options, autofocus, schema, uiSchema, rawErrors, }: import("@rjsf/core").WidgetProps) => JSX.Element;
    RadioWidget: ({ id, schema, options, value, required, disabled, readonly, label, onChange, uiSchema, }: import("@rjsf/core").WidgetProps) => JSX.Element;
    RangeWidget: ({ value, readonly, disabled, onBlur, onFocus, options, schema, onChange, required, label, id, uiSchema, }: import("@rjsf/core").WidgetProps) => JSX.Element;
    SelectWidget: ({ schema, id, options, label, required, disabled, value, multiple, autofocus, onChange, onBlur, onFocus, placeholder, rawErrors, }: import("@rjsf/core").WidgetProps) => JSX.Element;
    TextareaWidget: ({ id, placeholder, value, required, disabled, autofocus, label, readonly, onBlur, onFocus, onChange, options, schema, rawErrors, uiSchema, }: import("@rjsf/core").WidgetProps & {
        options: any;
    }) => JSX.Element;
    TextWidget: ({ id, placeholder, required, readonly, disabled, type, label, value, onChange, onBlur, onFocus, autofocus, options, schema, uiSchema, rawErrors, }: import("@rjsf/core").WidgetProps) => JSX.Element;
    UpDownWidget: ({ id, required, readonly, disabled, label, value, onChange, onBlur, onFocus, autofocus, schema, uiSchema }: import("@rjsf/core").WidgetProps) => JSX.Element;
    URLWidget: (props: import("@rjsf/core").WidgetProps) => JSX.Element;
    FileWidget: (props: import("@rjsf/core").WidgetProps) => JSX.Element;
};
export default _default;
