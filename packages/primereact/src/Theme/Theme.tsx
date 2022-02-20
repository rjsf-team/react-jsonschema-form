import React from "react";

import { Button } from "primereact/button";

import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";

import { ThemeProps } from "@rjsf/core";
import { utils } from "@rjsf/core";

const { getDefaultRegistry } = utils;

const { fields, widgets } = getDefaultRegistry();

const DefaultChildren = (
  <Button className="mt-3" type="submit" label="Submit" />
);

const Theme: ThemeProps = {
  children: DefaultChildren,
  ArrayFieldTemplate,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  ErrorList,
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
