import { ChakraProps } from "@chakra-ui/react";
import { FormProps, UiSchema } from "@rjsf/core";

export type ThemeProps<T = any> = Omit<FormProps<T>, "schema" | "uiSchema"> & {
  uiSchema?: ChakraUiSchema;
};

export interface ChakraUiSchema extends Omit<UiSchema, "ui:options"> {
  "ui:options"?: ChakraUiOptions;
}

type ChakraUiOptions = UiSchema["ui:options"] & { chakra?: ChakraProps };

interface GetChakraProps {
  uiSchema: ChakraUiSchema;
}

export function getChakra({ uiSchema }: GetChakraProps): ChakraProps {
  const chakraProps = uiSchema["ui:options"] && uiSchema["ui:options"].chakra;
  console.log("getChakra:", chakraProps);
  return Object.assign({}, chakraProps) as ChakraProps;
}
