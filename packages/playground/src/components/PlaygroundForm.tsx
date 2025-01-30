import { ComponentType, FormEvent, RefObject } from 'react';
import { FormProps, IChangeEvent } from '@rjsf/core';
import { ErrorSchema, RJSFSchema, RJSFValidationError, UiSchema, ValidatorType } from '@rjsf/utils';
import v8Validator from '@rjsf/validator-ajv8';
import DemoFrame from './DemoFrame';
import GeoPosition from './GeoPosition';
import SpecialInput from './SpecialInput';
import { LiveSettings } from './Header';

interface PlaygroundFormProps {
  FormComponent: ComponentType<FormProps>;
  otherFormProps: Partial<FormProps>;
  liveSettings: LiveSettings;
  extraErrors?: ErrorSchema;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formData: any;
  theme: string;
  subtheme: string | null;
  stylesheet: string | null;
  validator: string;
  validators: { [validatorName: string]: ValidatorType };
  playGroundFormRef: RefObject<any>;
  onChange: (e: IChangeEvent, id?: string) => void;
  onSubmit: (e: IChangeEvent, event: FormEvent<any>) => void;
}

export function PlaygroundForm({
  FormComponent,
  otherFormProps,
  liveSettings,
  extraErrors,
  schema,
  uiSchema,
  formData,
  theme,
  subtheme,
  stylesheet,
  validator,
  validators,
  playGroundFormRef,
  onChange,
  onSubmit,
}: PlaygroundFormProps) {
  return (
    <DemoFrame
      head={
        <>
          <link rel='stylesheet' id='theme' href={stylesheet || ''} />
        </>
      }
      style={{
        width: '100%',
        height: 1000,
        border: 0,
      }}
      theme={theme}
      subtheme={subtheme ? { dataTheme: subtheme } : null}
    >
      <FormComponent
        {...otherFormProps}
        {...liveSettings}
        extraErrors={extraErrors}
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        fields={{
          geo: GeoPosition,
          '/schemas/specialString': SpecialInput,
        }}
        validator={validators[validator] || v8Validator}
        onChange={onChange}
        onSubmit={onSubmit}
        onBlur={(id: string, value: string) => console.log(`Touched ${id} with value ${value}`)}
        onFocus={(id: string, value: string) => console.log(`Focused ${id} with value ${value}`)}
        onError={(errorList: RJSFValidationError[]) => console.log('errors', errorList)}
        ref={playGroundFormRef}
      />
    </DemoFrame>
  );
}
