import { createRef, PureComponent } from 'react';
import type { ComponentType } from 'react';
import type {
  CustomValidator,
  ErrorTransformer,
  ObjectFieldTemplateProps,
  RJSFSchema,
  UiSchema,
  WidgetProps,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { expectTypeOf } from 'vitest';

import type { IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';

interface MyData {
  name: string;
}
const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
const data: MyData = { name: 'a' };

const uiSchema: UiSchema = {};
const customValidate: CustomValidator = (_formData, errors) => errors;
const transformErrors: ErrorTransformer = (errors) => errors;
const onSubmit = ({ formData }: IChangeEvent) => formData;
function BareWidget({ value }: WidgetProps) {
  return <input value={String(value)} readOnly />;
}
class ClassTemplate extends PureComponent<ObjectFieldTemplateProps> {
  render() {
    return <div>{this.props.properties.map(({ content }) => content)}</div>;
  }
}

describe('form data inference', () => {
  it('infers T from formData past unannotated configuration props', () => {
    const { container } = render(
      <Form
        schema={schema}
        validator={validator}
        formData={data}
        uiSchema={uiSchema}
        customValidate={customValidate}
        transformErrors={transformErrors}
        widgets={{ BareWidget }}
        onSubmit={onSubmit}
        onChange={({ formData }) => expectTypeOf(formData).toEqualTypeOf<MyData>()}
      />,
    );
    expect(container.querySelector('#root_name')).not.toBeNull();
  });

  it('accepts unannotated configuration values on an explicitly typed Form', () => {
    const { container } = render(
      <Form<MyData>
        schema={schema}
        validator={validator}
        uiSchema={{ ...uiSchema, 'ui:ObjectFieldTemplate': ClassTemplate }}
        customValidate={customValidate}
        transformErrors={transformErrors}
        widgets={{ BareWidget }}
        onSubmit={onSubmit}
      />,
    );
    expect(container.querySelector('#root_name')).not.toBeNull();
  });

  it('infers T from a typed handler when no formData is passed', () => {
    const handleSubmit = ({ formData }: IChangeEvent<MyData>) => formData.name;
    render(
      <Form
        schema={schema}
        validator={validator}
        onSubmit={handleSubmit}
        onChange={({ formData }) => expectTypeOf(formData).toEqualTypeOf<MyData>()}
      />,
    );
  });

  it('does not infer T from formData when an unannotated ref is passed', () => {
    const ref = createRef<Form>();
    render(
      <Form
        schema={schema}
        validator={validator}
        formData={data}
        ref={ref}
        onChange={({ formData }) => expectTypeOf(formData).toEqualTypeOf<unknown>()}
      />,
    );
    expect(ref.current).not.toBeNull();
  });

  it('accepts components annotated as a React ComponentType, typed or not', () => {
    const TypedWidget: ComponentType<WidgetProps<MyData>> = BareWidget;
    const UntypedWidget: ComponentType<WidgetProps> = BareWidget;
    const { container } = render(
      <>
        <Form<MyData> schema={schema} validator={validator} widgets={{ TypedWidget }} />
        <Form schema={schema} validator={validator} widgets={{ UntypedWidget }} />
      </>,
    );
    expect(container.querySelectorAll('#root_name')).toHaveLength(2);
  });
});
