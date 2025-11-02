import {
  useCallback,
  ButtonHTMLAttributes,
  Dispatch,
  MutableRefObject,
  PropsWithChildren,
  SetStateAction,
} from 'react';
import Drawer from '@mui/material/Drawer';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema, ValidatorType, DEFAULT_ID_PREFIX, DEFAULT_ID_SEPARATOR } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

import base64 from '../utils/base64';
import CopyLink from './CopyLink';
import ValidatorSelector from './ValidatorSelector';
import RawValidatorTest from './RawValidatorTest';

export const DRAWER_WIDTH = '28rem';

type HeaderButtonProps = {
  title: string;
  onClick: () => void;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function HeaderButton({ title, onClick, children, ...buttonProps }: PropsWithChildren<HeaderButtonProps>) {
  return (
    <button
      type='button'
      className='btn btn-default'
      title={title}
      onClick={onClick}
      {...buttonProps}
      style={{ marginRight: '5px' }}
    >
      {children}
    </button>
  );
}

function OptionsButtons({ playGroundFormRef }: { playGroundFormRef: MutableRefObject<any> }) {
  const submitClick = useCallback(() => {
    playGroundFormRef.current.submit();
  }, [playGroundFormRef]);
  const validateClick = useCallback(() => {
    playGroundFormRef.current.validateForm();
  }, [playGroundFormRef]);
  const resetClick = useCallback(() => {
    playGroundFormRef.current.reset();
  }, [playGroundFormRef]);
  return (
    <>
      <label className='control-label'>Programmatic</label>
      <div className='btn-group'>
        <HeaderButton title='Click me to submit the form programmatically.' onClick={submitClick}>
          Submit
        </HeaderButton>
        <HeaderButton title='Click me to validate the form programmatically.' onClick={validateClick}>
          Validate
        </HeaderButton>
        <HeaderButton title='Click me to reset the form programmatically.' onClick={resetClick}>
          Reset
        </HeaderButton>
      </div>
    </>
  );
}

const liveSettingsBooleanSchema: RJSFSchema = {
  type: 'object',
  title: 'Form Options',
  properties: {
    disabled: { type: 'boolean', title: 'Disable whole form' },
    readonly: { type: 'boolean', title: 'Readonly whole form' },
    noValidate: { type: 'boolean', title: 'Disable validation' },
    noHtml5Validate: { type: 'boolean', title: 'Disable HTML 5 validation' },
    focusOnFirstError: { type: 'boolean', title: 'Focus on 1st Error' },
    useFallbackUiForUnsupportedType: { type: 'boolean', title: 'Use Fallback UI', default: false },
    omitExtraData: { type: 'boolean', title: 'Omit extra data' },
    liveOmit: { type: 'string', title: 'Live omit', default: false, enum: [false, 'onChange', 'onBlur'] },
    liveValidate: { type: 'string', title: 'Live validation', default: false, enum: [false, 'onChange', 'onBlur'] },
    showErrorList: {
      type: 'string',
      default: 'top',
      title: 'Show Error List',
      enum: [false, 'top', 'bottom'],
    },
    experimental_defaultFormStateBehavior: {
      title: 'Default Form State Behavior (Experimental)',
      type: 'object',
      properties: {
        arrayMinItems: {
          type: 'object',
          properties: {
            populate: {
              type: 'string',
              default: 'populate',
              title: 'Populate minItems in arrays',
              oneOf: [
                {
                  type: 'string',
                  title: 'Populate remaining minItems with default values (legacy behavior)',
                  enum: ['all'],
                },
                {
                  type: 'string',
                  title: 'Only populate minItems with default values when field is required',
                  enum: ['requiredOnly'],
                },
                {
                  type: 'string',
                  title: 'Never populate minItems with default values',
                  enum: ['never'],
                },
              ],
            },
            mergeExtraDefaults: {
              title: 'Merge array defaults with formData',
              type: 'boolean',
              default: false,
            },
          },
        },
        allOf: {
          type: 'string',
          title: 'allOf defaults behaviour',
          default: 'skipDefaults',
          oneOf: [
            {
              type: 'string',
              title: 'Populate defaults with allOf',
              enum: ['populateDefaults'],
            },
            {
              type: 'string',
              title: 'Skip populating defaults with allOf',
              enum: ['skipDefaults'],
            },
          ],
        },
        constAsDefaults: {
          type: 'string',
          title: 'const as default behavior',
          default: 'always',
          oneOf: [
            {
              type: 'string',
              title: 'A const value will always be merged into the form as a default',
              enum: ['always'],
            },
            {
              type: 'string',
              title: 'If const is in a `oneOf` it will NOT pick the first value as a default',
              enum: ['skipOneOf'],
            },
            {
              type: 'string',
              title: 'A const value will never be used as a default',
              enum: ['never'],
            },
          ],
        },
        emptyObjectFields: {
          type: 'string',
          title: 'Object fields default behavior',
          default: 'populateAllDefaults',
          oneOf: [
            {
              type: 'string',
              title:
                'Assign value to formData when default is primitive, non-empty object field, or is required (legacy behavior)',
              enum: ['populateAllDefaults'],
            },
            {
              type: 'string',
              title:
                'Assign value to formData when default is an object and parent is required, or default is primitive and is required',
              enum: ['populateRequiredDefaults'],
            },
            {
              type: 'string',
              title: 'Assign value to formData when only default is set',
              enum: ['skipEmptyDefaults'],
            },
            {
              type: 'string',
              title: 'Does not set defaults',
              enum: ['skipDefaults'],
            },
          ],
        },
        mergeDefaultsIntoFormData: {
          type: 'string',
          title: 'Merge defaults into formData',
          default: 'useFormDataIfPresent',
          oneOf: [
            {
              type: 'string',
              title: 'Use undefined field value if present',
              enum: ['useFormDataIfPresent'],
            },
            {
              type: 'string',
              title: 'Use default for undefined field value',
              enum: ['useDefaultIfFormDataUndefined'],
            },
          ],
        },
      },
    },
    idPrefix: { type: 'string', title: 'ID prefix', default: DEFAULT_ID_PREFIX },
    idSeparator: { type: 'string', title: 'ID separator', default: DEFAULT_ID_SEPARATOR, maximum: 2 },
  },
};

const liveSettingsBooleanUiSchema: UiSchema = {
  showErrorList: {
    'ui:widget': 'radio',
    'ui:options': {
      inline: true,
    },
  },
  liveValidate: {
    'ui:widget': 'radio',
    'ui:options': {
      inline: true,
    },
  },
  liveOmit: {
    'ui:widget': 'radio',
    'ui:options': {
      inline: true,
    },
  },
  experimental_defaultFormStateBehavior: {
    'ui:options': {
      label: false,
    },
    arrayMinItems: {
      'ui:options': {
        label: false,
      },
    },
  },
  idPrefix: {
    'ui:options': {
      emptyValue: DEFAULT_ID_PREFIX,
    },
  },
  idSeparator: {
    'ui:options': {
      emptyValue: DEFAULT_ID_SEPARATOR,
    },
  },
};

export interface LiveSettings {
  showErrorList?: false | 'top' | 'bottom';
  [key: string]: any;
}

type OptionsDrawerProps = {
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formData: any;
  shareURL: string | null;
  theme: string;
  sampleName: string;
  validators: {
    [validatorName: string]: ValidatorType<any, RJSFSchema, any>;
  };
  validator: string;
  liveSettings: LiveSettings;
  playGroundFormRef: MutableRefObject<any>;
  setValidator: Dispatch<SetStateAction<string>>;
  setLiveSettings: Dispatch<SetStateAction<LiveSettings>>;
  setShareURL: Dispatch<SetStateAction<string | null>>;
};

export default function OptionsDrawer({
  schema,
  uiSchema,
  formData,
  shareURL,
  theme,
  validators,
  validator,
  liveSettings,
  playGroundFormRef,
  setValidator,
  setLiveSettings,
  setShareURL,
  sampleName,
}: OptionsDrawerProps) {
  const onValidatorSelected = useCallback(
    (validator: string) => {
      setValidator(validator);
    },
    [setValidator],
  );

  const handleSetLiveSettings = useCallback(
    ({ formData }: IChangeEvent) => {
      setLiveSettings((previousLiveSettings) => ({ ...previousLiveSettings, ...formData }));
    },
    [setLiveSettings],
  );

  const onShare = useCallback(() => {
    const {
      location: { origin, pathname },
    } = document;

    try {
      const hash = base64.encode(
        JSON.stringify({
          formData,
          schema,
          uiSchema,
          theme,
          liveSettings,
          validator,
          sampleName,
        }),
      );

      setShareURL(`${origin}${pathname}#${hash}`);
    } catch (error) {
      setShareURL(null);
      console.error(error);
    }
  }, [formData, liveSettings, schema, theme, uiSchema, validator, setShareURL, sampleName]);
  const drawerSx = { width: DRAWER_WIDTH, p: 1 };
  return (
    <Drawer open variant='permanent' anchor='right' sx={drawerSx} slotProps={{ paper: { sx: drawerSx } }}>
      <OptionsButtons playGroundFormRef={playGroundFormRef} />
      <CopyLink shareURL={shareURL} onShare={onShare} />
      <Form
        idPrefix='rjsf_options'
        schema={liveSettingsBooleanSchema}
        formData={liveSettings}
        validator={localValidator}
        onChange={handleSetLiveSettings}
        uiSchema={liveSettingsBooleanUiSchema}
      >
        <span />
      </Form>
      <ValidatorSelector validators={validators} validator={validator} select={onValidatorSelected} />
      <RawValidatorTest validator={validators[validator]} schema={schema} formData={formData} />
    </Drawer>
  );
}
