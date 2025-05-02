import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import Fields from './Fields/index';
import ArrayField from './ArrayField';
import Field from './Field';
import ObjectField from './ObjectField';
import Select from './Select';
import TextArea from './TextArea';
import Title from './Title';
import Description from './Description';
import SubmitButton from './SubmitButton';
import TitleField from './TitleField';

export default function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Partial<TemplatesType<T, S, F>> {
  return {
    FieldTemplate: Field,
    ArrayFieldTemplate: ArrayField,
    ObjectFieldTemplate: ObjectField,
    ButtonTemplates: {
      SubmitButton,
    },
  };
}