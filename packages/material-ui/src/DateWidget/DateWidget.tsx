import { WidgetProps } from "@rjsf/utils";

const DateWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { BaseInputTemplate } = registry.templates;
  return (
    <BaseInputTemplate
      type="date"
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
    />
  );
};

export default DateWidget;
