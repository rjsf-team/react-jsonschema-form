import { ChakraProps, shouldForwardProp } from "@chakra-ui/react";
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
  let chakraProps =
    (uiSchema["ui:options"] && uiSchema["ui:options"].chakra) ?? {};

  Object.keys(chakraProps).forEach(key => {
    /**
     * Leveraging `shouldForwardProp` to remove props
     *
     * This is a utility function that's used in `@chakra-ui/react`'s factory function.
     * Normally, it prevents ChakraProps from being passed to the DOM.
     * In this case we just want to delete the unknown props. So we flip the boolean.
     */
    if (shouldForwardProp(key)) {
      // How to type this?!... 😬
      delete (chakraProps as any)[key];
    }
  });

  return chakraProps;
}
