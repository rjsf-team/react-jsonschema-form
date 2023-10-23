import { useCallback } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema, ValidatorType } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';
import base64 from '../utils/base64';

import CopyLink from './CopyLink';
import ThemeSelector, { ThemesType } from './ThemeSelector';
import Selector from './Selector';
import ValidatorSelector from './ValidatorSelector';
import SubthemeSelector from './SubthemeSelector';
import RawValidatorTest from './RawValidatorTest';

const HeaderButton: React.FC<
  {
    title: string;
    onClick: () => void;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ title, onClick, children, ...buttonProps }) => {
  return (
    <button type='button' className='btn btn-default' title={title} onClick={onClick} {...buttonProps}>
      {children}
    </button>
  );
};

function HeaderButtons({ playGroundFormRef }: { playGroundFormRef: React.MutableRefObject<any> }) {
  return (
    <>
      <label className='control-label'>Programmatic</label>
      <div className='btn-group'>
        <HeaderButton
          title='Click me to submit the form programmatically.'
          onClick={() => playGroundFormRef.current.submit()}
        >
          Submit
        </HeaderButton>
        <HeaderButton
          title='Click me to validate the form programmatically.'
          onClick={() => playGroundFormRef.current.validateForm()}
        >
          Validate
        </HeaderButton>
        <HeaderButton
          title='Click me to reset the form programmatically.'
          onClick={() => playGroundFormRef.current.reset()}
        >
          Reset
        </HeaderButton>
      </div>
    </>
  );
}

const liveSettingsBooleanSchema: RJSFSchema = {
  type: 'object',
  properties: {
    liveValidate: { type: 'boolean', title: 'Live validation' },
    disabled: { type: 'boolean', title: 'Disable whole form' },
    readonly: { type: 'boolean', title: 'Readonly whole form' },
    omitExtraData: { type: 'boolean', title: 'Omit extra data' },
    liveOmit: { type: 'boolean', title: 'Live omit' },
    noValidate: { type: 'boolean', title: 'Disable validation' },
    noHtml5Validate: { type: 'boolean', title: 'Disable HTML 5 validation' },
    focusOnFirstError: { type: 'boolean', title: 'Focus on 1st Error' },
  },
};

const liveSettingsSelectSchema: RJSFSchema = {
  type: 'object',
  properties: {
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
      },
    },
  },
};

const liveSettingsSelectUiSchema: UiSchema = {
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
};

export interface LiveSettings {
  showErrorList: false | 'top' | 'bottom';
  [key: string]: any;
}

type HeaderProps = {
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formData: any;
  shareURL: string | null;
  themes: { [themeName: string]: ThemesType };
  theme: string;
  subtheme: string | null;
  validators: {
    [validatorName: string]: ValidatorType<any, RJSFSchema, any>;
  };
  validator: string;
  liveSettings: LiveSettings;
  playGroundFormRef: React.MutableRefObject<any>;
  load: (data: any) => void;
  onThemeSelected: (theme: string, themeObj: ThemesType) => void;
  setSubtheme: React.Dispatch<React.SetStateAction<string | null>>;
  setStylesheet: React.Dispatch<React.SetStateAction<string | null>>;
  setValidator: React.Dispatch<React.SetStateAction<string>>;
  setLiveSettings: React.Dispatch<React.SetStateAction<LiveSettings>>;
  setShareURL: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function Header({
  schema,
  uiSchema,
  formData,
  shareURL,
  themes,
  theme,
  subtheme,
  validators,
  validator,
  liveSettings,
  playGroundFormRef,
  load,
  onThemeSelected,
  setSubtheme,
  setStylesheet,
  setValidator,
  setLiveSettings,
  setShareURL,
}: HeaderProps) {
  const onSubthemeSelected = useCallback(
    (subtheme: any, { stylesheet }: { stylesheet: any }) => {
      setSubtheme(subtheme);
      setStylesheet(stylesheet);
    },
    [setSubtheme, setStylesheet]
  );

  const onValidatorSelected = useCallback(
    (validator: string) => {
      setValidator(validator);
    },
    [setValidator]
  );

  const handleSetLiveSettings = useCallback(
    ({ formData }: IChangeEvent) => {
      setLiveSettings((previousLiveSettings) => ({ ...previousLiveSettings, ...formData }));
    },
    [setLiveSettings]
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
        })
      );

      setShareURL(`${origin}${pathname}#${hash}`);
    } catch (error) {
      setShareURL(null);
      console.error(error);
    }
  }, [formData, liveSettings, schema, theme, uiSchema, setShareURL]);

  return (
    <div className='page-header'>
      <h1>react-jsonschema-form</h1>
      {/* TODO remove this before merge */}
      <div
        style={{
          color: 'red',
          fontSize: '20px',
          fontWeight: 'bold',
          marginTop: '10px',
          marginBottom: '10px',
        }}
      >
        <div>
          This is a dev preview for{' '}
          <a
            style={{
              color: 'red',
              textDecoration: 'underline',
            }}
            href='https://github.com/rjsf-team/react-jsonschema-form/pull/3883'
          >
            Carbon Design System Theme (#3883)
          </a>
          , not a RJSF playground.
        </div>
        <div>
          Latest Demo Build Status:{' '}
          <a href='https://app.netlify.com/sites/taupe-gumption-4ba0b4/deploys' target='_blank' rel='noreferrer'>
            <img
              src='https://api.netlify.com/api/v1/badges/e00f6cbe-02cc-436d-b847-9e78096e746d/deploy-status'
              alt='Netlify Status'
            />
          </a>
        </div>
      </div>
      <div className='row'>
        <div className='col-sm-4'>
          <Selector onSelected={load} />
        </div>
        <div className='col-sm-2'>
          <Form
            idPrefix='rjsf_options'
            schema={liveSettingsBooleanSchema}
            formData={liveSettings}
            validator={localValidator}
            onChange={handleSetLiveSettings}
          >
            <div />
          </Form>
        </div>
        <div className='col-sm-2'>
          <Form
            idPrefix='rjsf_options'
            schema={liveSettingsSelectSchema}
            formData={liveSettings}
            validator={localValidator}
            onChange={handleSetLiveSettings}
            uiSchema={liveSettingsSelectUiSchema}
          >
            <div />
          </Form>
        </div>
        <div className='col-sm-2'>
          <ThemeSelector themes={themes} theme={theme} select={onThemeSelected} />
          {themes[theme] && themes[theme].subthemes && (
            <SubthemeSelector subthemes={themes[theme].subthemes!} subtheme={subtheme} select={onSubthemeSelected} />
          )}
          <ValidatorSelector validators={validators} validator={validator} select={onValidatorSelected} />
          <HeaderButtons playGroundFormRef={playGroundFormRef} />
          <div style={{ marginTop: '5px' }} />
          <CopyLink shareURL={shareURL} onShare={onShare} />
        </div>
        <div className='col-sm-2'>
          <RawValidatorTest validator={validators[validator]} schema={schema} formData={formData} />
        </div>
      </div>
    </div>
  );
}
