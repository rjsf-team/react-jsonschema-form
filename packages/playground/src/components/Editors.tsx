import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { ErrorSchema, RJSFSchema, UiSchema } from '@rjsf/utils';
import { isObject } from '@rjsf/utils';
import { Panel, Group, Separator } from 'react-resizable-panels';

import type { SubthemeType } from './SubthemeSelector.tsx';
import SubthemeSelector from './SubthemeSelector.tsx';
import type { ThemesType } from './ThemeSelector.tsx';
import ThemeSelector from './ThemeSelector.tsx';

const monacoEditorOptions = {
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
};

const AccordionSummary = styled(MuiAccordionSummary)({
  '.MuiAccordionSummary-content': {
    margin: 0,
  },
});

/** Parses what an editor holds, giving `undefined` for text that is not JSON or holds a value `accepts` rejects, such
 * as a number where a schema belongs.
 */
export function parseEdited<T>(code: string, accepts: (data: unknown) => data is T): T | undefined {
  try {
    const parsedCode: unknown = JSON.parse(code);
    return accepts(parsedCode) ? parsedCode : undefined;
  } catch {
    return undefined;
  }
}

const anyJson = (_data: unknown): _data is unknown => true;

interface EditorProps<T> {
  title: string;
  code: string;
  /** Narrows the parsed JSON to what `onChange` takes; the editor marks anything else invalid and keeps it to itself */
  accepts: (data: unknown) => data is T;
  onChange: (data: T) => void;
}

function Editor<T>({ title, code, accepts, onChange }: EditorProps<T>) {
  const [valid, setValid] = useState(true);

  const onCodeChange = useCallback(
    (newCode: string | undefined) => {
      if (!newCode) {
        return;
      }

      const parsedCode = parseEdited(newCode, accepts);
      setValid(parsedCode !== undefined);
      if (parsedCode !== undefined) {
        onChange(parsedCode);
      }
    },
    [setValid, accepts, onChange],
  );

  const icon = valid ? 'ok' : 'remove';
  const cls = valid ? 'valid' : 'invalid';

  return (
    <div className='panel panel-default' style={{ marginBottom: 0 }}>
      <div className='panel-heading'>
        <span className={`${cls} glyphicon glyphicon-${icon}`} />
        {` ${title}`}
      </div>
      <div style={{ overscrollBehavior: 'auto' }}>
        <MonacoEditor
          language='json'
          value={code}
          theme='vs-light'
          onChange={onCodeChange}
          height={400}
          options={monacoEditorOptions}
        />
      </div>
    </div>
  );
}

const toJson = (val: unknown) => JSON.stringify(val, null, 2);

interface EditorsProps {
  /** Changes whenever the playground loads a sample or a shared link, which remounts the selector forms it seeds */
  loadKey: number;
  schema: RJSFSchema;
  setSchema: React.Dispatch<React.SetStateAction<RJSFSchema>>;
  uiSchema: UiSchema;
  setUiSchema: React.Dispatch<React.SetStateAction<UiSchema>>;
  formData: unknown;
  setFormData: React.Dispatch<React.SetStateAction<unknown>>;
  extraErrors: ErrorSchema | undefined;
  setExtraErrors: React.Dispatch<React.SetStateAction<ErrorSchema | undefined>>;
  setShareURL: React.Dispatch<React.SetStateAction<string | null>>;
  hasUiSchemaGenerator: boolean;
  themes: Record<string, ThemesType>;
  theme: string;
  subtheme: string | null;
  onThemeSelected: (theme: string, themeObj: ThemesType) => void;
  setSubtheme: Dispatch<SetStateAction<string | null>>;
  setStylesheet: Dispatch<SetStateAction<string | null>>;
}

export default function Editors({
  loadKey,
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
    (newSubtheme: string, { stylesheet }: SubthemeType) => {
      setSubtheme(newSubtheme);
      setStylesheet(stylesheet || null);
    },
    [setSubtheme, setStylesheet],
  );
  const onSchemaEdited = useCallback(
    (newSchema: RJSFSchema) => {
      setSchema(newSchema);
      setShareURL(null);
    },
    [setSchema, setShareURL],
  );

  const onUISchemaEdited = useCallback(
    (newUiSchema: UiSchema) => {
      setUiSchema(newUiSchema);
      setShareURL(null);
    },
    [setUiSchema, setShareURL],
  );

  const onFormDataEdited = useCallback(
    (newFormData: unknown) => {
      // Since this is coming from the editor which uses JSON.stringify to trim undefined values compare the values
      // using JSON.stringify to see if the trimmed formData is the same as the untrimmed state
      // Sometimes passing the trimmed value back into the Form causes the defaults to be improperly assigned
      if (JSON.stringify(formData) !== JSON.stringify(newFormData)) {
        setFormData(newFormData);
        setShareURL(null);
      }
    },
    [formData, setFormData, setShareURL],
  );

  const onExtraErrorsEdited = useCallback(
    (newExtraErrors: ErrorSchema) => {
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
            <ThemeSelector key={loadKey} themes={themes} theme={theme} select={onThemeSelected} />
          </Grid>
          <Grid size={3}>
            {themes[theme] && themes[theme].subthemes && (
              <SubthemeSelector
                key={`${theme}-${loadKey}`}
                subthemes={themes[theme].subthemes}
                subtheme={subtheme}
                select={onSubthemeSelected}
              />
            )}
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Group orientation='horizontal'>
          <Panel defaultSize={extraErrors ? '34%' : '25%'} minSize='10%'>
            <Editor title='JSONSchema' code={toJson(schema)} accepts={isObject} onChange={onSchemaEdited} />
          </Panel>
          <Separator style={{ width: '4px', cursor: 'col-resize' }} />
          <Panel defaultSize={extraErrors ? '33%' : '25%'} minSize='10%'>
            <Editor title={uiSchemaTitle} code={toJson(uiSchema)} accepts={isObject} onChange={onUISchemaEdited} />
          </Panel>
          <Separator style={{ width: '4px', cursor: 'col-resize' }} />
          <Panel defaultSize={extraErrors ? '33%' : '25%'} minSize='10%'>
            <Editor title='formData' code={toJson(formData)} accepts={anyJson} onChange={onFormDataEdited} />
          </Panel>
          {extraErrors && (
            <>
              <Separator style={{ width: '4px', cursor: 'col-resize' }} />
              <Panel defaultSize='25%' minSize='10%'>
                <Editor
                  title='extraErrors'
                  code={toJson(extraErrors)}
                  accepts={isObject}
                  onChange={onExtraErrorsEdited}
                />
              </Panel>
            </>
          )}
        </Group>
      </AccordionDetails>
    </Accordion>
  );
}
