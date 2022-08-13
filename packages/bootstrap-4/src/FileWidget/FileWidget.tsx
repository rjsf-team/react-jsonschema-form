import { WidgetProps } from "@rjsf/utils";

const FileWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { BaseInputTemplate } = registry.templates;
  return <BaseInputTemplate {...props} type="file" />;
};

export default FileWidget;
