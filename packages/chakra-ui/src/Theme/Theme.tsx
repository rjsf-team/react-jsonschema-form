import * as React from "react";

import { Box, Button } from "@chakra-ui/react";

import ArrayFieldTemplate from "../ArrayFieldTemplate";
// import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";

import { ThemeProps } from "@rjsf/core";
import { utils } from "@rjsf/core";
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
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  widgets: { ...widgets, ...Widgets },
  //   ErrorList,
};

export default Theme;
