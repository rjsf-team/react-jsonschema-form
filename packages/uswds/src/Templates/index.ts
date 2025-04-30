import React, { ComponentType } from 'react'; // Ensure React is imported for React.createElement
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
  ArrayFieldDescriptionProps,
  ArrayFieldTitleProps,
  UnsupportedFieldProps,
  DescriptionFieldProps,
  TitleFieldProps,
} from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate';
import BaseInputTemplate from './BaseInputTemplate';
import ButtonTemplates from './ButtonTemplates';
import DescriptionFieldTemplate from '../FieldDescriptionTemplate/FieldDescriptionTemplate'; // Corrected path
import ErrorListTemplate from './ErrorListTemplate';
import FieldTemplate from './FieldTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import TitleFieldTemplate from './TitleFieldTemplate';
import UnsupportedFieldTemplate from './UnsupportedFieldTemplate';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate';
import SubmitButton from './ButtonTemplates/SubmitButton';
import AddButton from './ButtonTemplates/AddButton';
import CopyButton from './ButtonTemplates/CopyButton';
import MoveDownButton from './ButtonTemplates/MoveDownButton';
import MoveUpButton from './ButtonTemplates/MoveUpButton';
import RemoveButton from './ButtonTemplates/RemoveButton';
import HelpTemplate from './HelpTemplate'; // Import the new HelpTemplate

function DescriptionField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: DescriptionFieldProps<T, S, F>
) {
  const { id, description } = props;
  // Use React.createElement instead of JSX syntax
  return React.createElement(DescriptionFieldTemplate, { id, description, ...props });
}

function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: TitleFieldProps<T, S, F>
) {
  const { id, title, required } = props;
  // Use React.createElement instead of JSX syntax
  return React.createElement(TitleFieldTemplate, { id, title, required, ...props });
}

// Make UnsupportedField match the expected signature
const FixedUnsupportedFieldTemplate: ComponentType<UnsupportedFieldProps> = UnsupportedFieldTemplate;

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): TemplatesType<T, S, F> {
  return {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate,
    BaseInputTemplate,
    ButtonTemplates: {
      AddButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      SubmitButton,
    },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate,
    FieldTemplate,
    HelpTemplate, // Add HelpTemplate to exports
    ObjectFieldTemplate,
    TitleFieldTemplate: TitleField,
    UnsupportedFieldTemplate: FixedUnsupportedFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
