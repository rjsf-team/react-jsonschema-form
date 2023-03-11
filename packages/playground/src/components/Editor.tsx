import { memo, useCallback, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';

const monacoEditorOptions = {
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
};

const Editor: React.FC<{ title: string; code: string; onChange: (code: string) => void }> = memo(
  ({ title, code: initialCode, onChange }) => {
    const [valid, setValid] = useState(true);
    const [code, setCode] = useState(initialCode);

    const onCodeChange = useCallback((code: string | undefined) => {
      if (!code) return;

      try {
        const parsedCode = JSON.parse(code);
        setValid(true);
        setCode(code);
        onChange(parsedCode);
      } catch (err) {
        setValid(false);
        setCode(code);
      }
    }, []);

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
);

export default Editor;
