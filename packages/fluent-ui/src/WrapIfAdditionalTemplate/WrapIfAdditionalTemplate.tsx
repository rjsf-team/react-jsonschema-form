import React from "react";
import { WrapIfAdditionalTemplateProps } from "@rjsf/utils";

export default function WrapIfAdditionalTemplate(
  props: WrapIfAdditionalTemplateProps
) {
  const { children } = props;
  // TODO Implement WrapIfAdditionalTemplate features in FluentUI (#2777)
  return <>{children}</>;
}
