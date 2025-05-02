import React, { ComponentType } from 'react';
import {
  DescriptionFieldProps,
  SubmitButtonProps,
  TitleFieldProps,
  UnsupportedFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
  IconButtonProps,
} from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate';
import BaseInputTemplate from './BaseInputTemplate';
import DescriptionFieldTemplate from '../FieldDescriptionTemplate/FieldDescriptionTemplate';
import ErrorListTemplate from './ErrorListTemplate';
import FieldTemplate from './FieldTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import SubmitButtonTemplate from './ButtonTemplates/SubmitButton';
import TitleFieldTemplate from './TitleFieldTemplate';
import UnsupportedFieldTemplate from './UnsupportedFieldTemplate';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate';
import AddButton from './ButtonTemplates/AddButton';
import CopyButton from './ButtonTemplates/CopyButton';
import MoveDownButton from './ButtonTemplates/MoveDownButton';
import MoveUpButton from './ButtonTemplates/MoveUpButton';
import RemoveButton from './ButtonTemplates/RemoveButton';

// Define wrappers using React.createElement
function DescriptionField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: DescriptionFieldProps<T, S, F>
) {
  return React.createElement(DescriptionFieldTemplate, props as any);
}

function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: TitleFieldProps<T, S, F>
) {
  return React.createElement(TitleFieldTemplate, props as any);
}

const FixedUnsupportedFieldTemplate: ComponentType<UnsupportedFieldProps> =
  UnsupportedFieldTemplate as ComponentType<UnsupportedFieldProps>;

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate,
    BaseInputTemplate,
    ButtonTemplates: {
      SubmitButton: SubmitButtonTemplate,
      AddButton: AddButton as ComponentType<IconButtonProps<T, S, F>>,
      CopyButton: CopyButton as ComponentType<IconButtonProps<T, S, F>>,
      MoveDownButton: MoveDownButton as ComponentType<IconButtonProps<T, S, F>>,
      MoveUpButton: MoveUpButton as ComponentType<IconButtonProps<T, S, F>>,
      RemoveButton: RemoveButton as ComponentType<IconButtonProps<T, S, F>>,
    },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate,
    FieldTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate: TitleField,
    UnsupportedFieldTemplate: FixedUnsupportedFieldTemplate as any,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
