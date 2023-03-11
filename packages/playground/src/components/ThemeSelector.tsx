import Form from '@rjsf/core';
import localValidator from '@rjsf/validator-ajv8';

const ThemeSelector: React.FC<{ theme: any; themes: any; select: (...args: any[]) => void }> = ({
  theme,
  themes,
  select,
}) => {
  const schema = {
    type: 'string',
    enum: Object.keys(themes),
  };

  const uiSchema = {
    'ui:placeholder': 'Select theme',
  };

  return (
    <Form
      className='form_rjsf_themeSelector'
      idPrefix='rjsf_themeSelector'
      schema={schema}
      uiSchema={uiSchema}
      formData={theme}
      validator={localValidator}
      onChange={({ formData }: { formData: any }) => formData && select(formData, themes[formData])}
    >
      <div />
    </Form>
  );
};

export default ThemeSelector;
