import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import Fields from './Fields/index';
import ArrayField from './ArrayField';
import Description from './Description';
import ErrorList from './ErrorList';
import Field from './Field';
import ObjectField from './ObjectField';
import Select from './Select';
import TextArea from './TextArea';
import Title from './Title';

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ...Fields,
    ArrayFieldTemplate: ArrayField,
    DescriptionField: Description,
    ErrorList,
    FieldTemplate: Field,
    ObjectFieldTemplate: ObjectField,
    SelectWidget: Select,
    TextAreaWidget: TextArea,
    TitleField: Title,
  };
}

export default generateTemplates();