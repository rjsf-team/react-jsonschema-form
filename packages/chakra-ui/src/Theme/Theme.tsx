import React from "react";

import { Box, Button } from "@chakra-ui/react";

import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";
import { utils } from "@rjsf/core";
import { ThemeProps } from "../utils";

const { getDefaultRegistry } = utils;

const { fields, widgets } = getDefaultRegistry();

const SubmitButton = () => (
  <Box marginTop={3}>
    <Button type="submit" variant="solid">
      Submit
    </Button>
  </Box>
);

const Theme: ThemeProps = {
  children: <SubmitButton />,
  ArrayFieldTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  ErrorList,
  fields: { ...fields, ...Fields },
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
