import { useCallback, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';

const monacoEditorOptions = {
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
};

interface EditorProps {
  title: string;
  code: string;
  onChange: (code: string) => void;
}

export default function Editor({ title, code, onChange }: EditorProps) {
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
      } catch (err) {
        setValid(false);
      }
    },
    [setValid, onChange]
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
