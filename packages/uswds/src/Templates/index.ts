import React, { ComponentType } from 'react'; // Ensure React is imported for React.createElement
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
  ArrayFieldDescriptionProps,
  ArrayFieldTitleProps,
} from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate';
import BaseInputTemplate from './BaseInputTemplate';
import ButtonTemplates from './ButtonTemplates';
import DescriptionFieldTemplate from './DescriptionFieldTemplate';
import ErrorListTemplate from './ErrorListTemplate';
import FieldTemplate from './FieldTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import TitleFieldTemplate from './TitleFieldTemplate';
import UnsupportedFieldTemplate from './UnsupportedFieldTemplate';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate';

// Wrapper functions to adapt props - Revert to React.createElement
function ArrayFieldDescriptionWrapper<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldDescriptionProps<T, S, F>) {
  const { description, idRegistry, registry } = props;
  const id = `${idRegistry?.root || 'array'}__description`; // Construct a suitable ID
  
  // Revert to React.createElement
  return React.createElement(ArrayFieldDescriptionTemplate, { 
    id, 
    description, 
    registry 
  });
}

function ArrayFieldTitleWrapper<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { title, idRegistry, required, registry } = props;
  const id = `${idRegistry?.root || 'array'}__title`; // Construct a suitable ID
  
  // Revert to React.createElement
  return React.createElement(ArrayFieldTitleTemplate, { 
    id, 
    title, 
    required, 
    registry 
  });
}

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): TemplatesType<T, S, F> {
  return {
    // Use the wrapper components and cast them correctly
    ArrayFieldDescriptionTemplate: ArrayFieldDescriptionWrapper as ComponentType<
      ArrayFieldDescriptionProps<T, S, F>
    >,
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate: ArrayFieldTitleWrapper as ComponentType<ArrayFieldTitleProps<T, S, F>>,
    BaseInputTemplate,
    ButtonTemplates: ButtonTemplates as unknown as TemplatesType<T, S, F>['ButtonTemplates'],
    DescriptionFieldTemplate,
    ErrorListTemplate,
    FieldTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate,
    UnsupportedFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
