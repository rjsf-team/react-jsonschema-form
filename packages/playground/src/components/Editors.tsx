import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { styled } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MonacoEditor from '@monaco-editor/react';
import { ErrorSchema, RJSFSchema, UiSchema } from '@rjsf/utils';
import isEqualWith from 'lodash/isEqualWith';

import ThemeSelector, { ThemesType } from './ThemeSelector';
import SubthemeSelector, { SubthemeType } from './SubthemeSelector';

const monacoEditorOptions = {
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
};

const AccordionSummary = styled(MuiAccordionSummary)({
  '.MuiAccordionSummary-content': {
    margin: 0,
  },
});

type EditorProps = {
  title: string;
  code: string;
  onChange: (data: any) => void;
};

function Editor({ title, code, onChange }: EditorProps) {
  const [valid, setValid] = useState(true);

  const onCodeChange = useCallback(
    (code: string | undefined) => {
      if (!code) {
        return;
      }

      try {
        const parsedCode = JSON.parse(code);
        setValid(true);
        onChange(parsedCode);
      } catch {
        setValid(false);
      }
    },
    [setValid, onChange],
  );

  const icon = valid ? 'ok' : 'remove';
  const cls = valid ? 'valid' : 'invalid';

  return (
    <div className='panel panel-default'>
      <div className='panel-heading'>
        <span className={`${cls} glyphicon glyphicon-${icon}`} />
        {' ' + title}
      </div>
      <MonacoEditor
        language='json'
        value={code}
        theme='vs-light'
        onChange={onCodeChange}
        height={400}
        options={monacoEditorOptions}
      />
    </div>
  );
}

const toJson = (val: unknown) => JSON.stringify(val, null, 2);

type EditorsProps = {
  schema: RJSFSchema;
  setSchema: React.Dispatch<React.SetStateAction<RJSFSchema>>;
  uiSchema: UiSchema;
  setUiSchema: React.Dispatch<React.SetStateAction<UiSchema>>;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  extraErrors: ErrorSchema | undefined;
  setExtraErrors: React.Dispatch<React.SetStateAction<ErrorSchema | undefined>>;
  setShareURL: React.Dispatch<React.SetStateAction<string | null>>;
  hasUiSchemaGenerator: boolean;
  themes: { [themeName: string]: ThemesType };
  theme: string;
  subtheme: string | null;
  onThemeSelected: (theme: string, themeObj: ThemesType) => void;
  setSubtheme: Dispatch<SetStateAction<string | null>>;
  setStylesheet: Dispatch<SetStateAction<string | null>>;
};

export default function Editors({
  extraErrors,
  formData,
  schema,
  uiSchema,
  setExtraErrors,
  setFormData,
  setSchema,
  setShareURL,
  setUiSchema,
  hasUiSchemaGenerator,
  themes,
  theme,
  subtheme,
  onThemeSelected,
  setSubtheme,
  setStylesheet,
}: EditorsProps) {
  const onSubthemeSelected = useCallback(
    (subtheme: any, { stylesheet }: SubthemeType) => {
      setSubtheme(subtheme);
      setStylesheet(stylesheet || null);
    },
    [setSubtheme, setStylesheet],
  );
  const onSchemaEdited = useCallback(
    (newSchema: any) => {
      setSchema(newSchema);
      setShareURL(null);
    },
    [setSchema, setShareURL],
  );

  const onUISchemaEdited = useCallback(
    (newUiSchema: any) => {
      setUiSchema(newUiSchema);
      setShareURL(null);
    },
    [setUiSchema, setShareURL],
  );

  const onFormDataEdited = useCallback(
    (newFormData: any) => {
      if (
        !isEqualWith(newFormData, formData, (newValue, oldValue) => {
          // Since this is coming from the editor which uses JSON.stringify to trim undefined values compare the values
          // using JSON.stringify to see if the trimmed formData is the same as the untrimmed state
          // Sometimes passing the trimmed value back into the Form causes the defaults to be improperly assigned
          return JSON.stringify(oldValue) === JSON.stringify(newValue);
        })
      ) {
        setFormData(newFormData);
        setShareURL(null);
      }
    },
    [formData, setFormData, setShareURL],
  );

  const onExtraErrorsEdited = useCallback(
    (newExtraErrors: any) => {
      setExtraErrors(newExtraErrors);
      setShareURL(null);
    },
    [setExtraErrors, setShareURL],
  );
  const uiSchemaTitle = hasUiSchemaGenerator ? 'UISchema (regenerated on theme change)' : 'UiSchema';

  return (
    <Accordion defaultExpanded disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon fontSize='large' />} title='Toggle Editors'>
        <Grid container spacing={1} sx={{ width: '100%' }}>
          <Grid size={6}>
            <Typography component='div' variant='h2' sx={{ pr: 1 }}>
              react-jsonschema-form
            </Typography>
          </Grid>
          <Grid size={3}>
            <ThemeSelector themes={themes} theme={theme} select={onThemeSelected} />
          </Grid>
          <Grid size={3}>
            {themes[theme] && themes[theme].subthemes && (
              <SubthemeSelector subthemes={themes[theme].subthemes!} subtheme={subtheme} select={onSubthemeSelected} />
            )}
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Grid container spacing={0.5}>
          <Grid size={extraErrors ? 3 : 4}>
            <Editor title='JSONSchema' code={toJson(schema)} onChange={onSchemaEdited} />
          </Grid>
          <Grid size={extraErrors ? 3 : 4}>
            <Editor title={uiSchemaTitle} code={toJson(uiSchema)} onChange={onUISchemaEdited} />
          </Grid>
          <Grid size={extraErrors ? 3 : 4}>
            <Editor title='formData' code={toJson(formData)} onChange={onFormDataEdited} />
          </Grid>
          {extraErrors && (
            <Grid size={3}>
              <Editor title='extraErrors' code={toJson(extraErrors || {})} onChange={onExtraErrorsEdited} />
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
