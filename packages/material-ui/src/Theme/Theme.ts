import ArrayFieldTemplate from '../ArrayFieldTemplate';
import ErrorList from '../ErrorList';
import Fields from '../Fields';
import FieldTemplate from '../FieldTemplate';
import ObjectFieldTemplate from '../ObjectFieldTemplate';
import Widgets from '../Widgets';

import { ThemeProps } from 'react-jsonschema-form';
import { getDefaultRegistry } from 'react-jsonschema-form/lib/utils';

const { fields, widgets } = getDefaultRegistry();

const Theme: ThemeProps = {
  ArrayFieldTemplate,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  widgets: { ...widgets, ...Widgets },
  ErrorList,
};

export default Theme;
