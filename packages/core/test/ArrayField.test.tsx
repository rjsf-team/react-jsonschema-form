import {
  ArrayFieldTemplateProps,
  ArrayFieldItemButtonsTemplateProps,
  ArrayFieldItemTemplateProps,
  DescriptionFieldProps,
  ErrorSchema,
  FieldPathList,
  FieldProps,
  GenericObjectType,
  RJSFSchema,
  TitleFieldProps,
  UiSchema,
  WidgetProps,
  FormValidation,
} from '@rjsf/utils';
import { fireEvent, act } from '@testing-library/react';

import { createFormComponent, expectToHaveBeenCalledWithFormData, submitForm } from './testUtils';
import SchemaField from '../src/components/fields/SchemaField';
import ArrayField from '../src/components/fields/ArrayField';
import { TextWidgetTest } from './StringField.test';

const ArrayKeyDataAttr = 'data-rjsf-itemkey';
const ExposedArrayKeyItemTemplate = function (props: ArrayFieldItemTemplateProps) {
  return (
    <div className='rjsf-array-item' data-rjsf-itemkey={props.itemKey}>
      <div>{props.children}</div>
      {(props.buttonsProps.hasMoveUp || props.buttonsProps.hasMoveDown) && (
        <button className='rjsf-array-item-move-down' onClick={props.buttonsProps.onMoveDownItem}>
          Down
        </button>
      )}
      {(props.buttonsProps.hasMoveUp || props.buttonsProps.hasMoveDown) && (
        <button className='rjsf-array-item-move-up' onClick={props.buttonsProps.onMoveUpItem}>
          Up
        </button>
      )}
      {props.buttonsProps.hasCopy && (
        <button className='rjsf-array-item-copy' onClick={props.buttonsProps.onCopyItem}>
          Copy
        </button>
      )}
      {props.buttonsProps.hasRemove && (
        <button className='rjsf-array-item-remove' onClick={props.buttonsProps.onRemoveItem}>
          Remove
        </button>
      )}
      <hr />
    </div>
  );
};

const ExposedArrayKeyTemplate = function (props: ArrayFieldTemplateProps) {
  return (
    <div className='array'>
      {props.items}
      {props.canAdd && (
        <div className='rjsf-array-item-add'>
          <button onClick={props.onAddClick} type='button'>
            Add New
          </button>
        </div>
      )}
    </div>
  );
};

const CustomOnAddClickItemTemplate = function (props: ArrayFieldItemTemplateProps) {
  return (
    <div className='rjsf-array-item'>
      <div>{props.children}</div>
    </div>
  );
};

const CustomOnAddClickTemplate = function (props: ArrayFieldTemplateProps) {
  return (
    <div className='array'>
      {props.items}
      {props.canAdd && (
        <div className='rjsf-array-item-add'>
          <button onClick={() => props.onAddClick()} type='button'>
            Add New
          </button>
        </div>
      )}
    </div>
  );
};

const ArrayFieldTestItemButtonsTemplate = (props: ArrayFieldItemButtonsTemplateProps) => {
  const {
    disabled,
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    style,
    onAddItem,
    onCopyItem,
    onRemoveItem,
    onMoveDownItem,
    onMoveUpItem,
    readonly,
  } = props;
  return (
    <>
      {hasMoveDown && (
        <button title='move-down' style={style} disabled={disabled || readonly} onClick={onMoveDownItem}>
          move down
        </button>
      )}
      {hasMoveUp && (
        <button title='move-up' style={style} disabled={disabled || readonly} onClick={onMoveUpItem}>
          move up
        </button>
      )}
      {hasCopy && (
        <button title='copy' style={style} disabled={disabled || readonly} onClick={onCopyItem}>
          copy
        </button>
      )}
      {hasRemove && (
        <button title='remove' style={style} disabled={disabled || readonly} onClick={onRemoveItem}>
          remove
        </button>
      )}
      {hasMoveDown && (
        <button title='insert' style={style} disabled={disabled || readonly} onClick={onAddItem}>
          insert
        </button>
      )}
    </>
  );
};

const ArrayFieldTestItemTemplate = (props: ArrayFieldItemTemplateProps) => {
  const { children, buttonsProps, className, hasToolbar } = props;
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };
  return (
    <div className={className}>
      <div className={hasToolbar ? 'col-xs-9' : 'col-xs-12'}>{children}</div>
      {hasToolbar && (
        <div className='col-xs-3 array-item-toolbox'>
          <div
            className='btn-group'
            style={{
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <ArrayFieldTestItemButtonsTemplate {...buttonsProps} style={btnStyle} />
          </div>
        </div>
      )}
    </div>
  );
};

const ArrayFieldTest = (props: FieldProps<any[]>) => {
  const onChangeTest = (newFormData: any, path: FieldPathList, errorSchema?: ErrorSchema<any[]>, id?: string) => {
    let newErrorSchema = errorSchema;
    if (newFormData !== 'Appie') {
      newErrorSchema = {
        __errors: ['Value must be "Appie"'],
      } as ErrorSchema<any[]>;
    }
    props.onChange(newFormData, path, newErrorSchema, id);
  };
  return <ArrayField {...props} onChange={onChangeTest} />;
};

const mockFileReader = {
  // eslint-disable-next-line no-unused-vars
  set onload(fn: (event: { target: { result: string } }) => void) {
    fn({ target: { result: 'data:text/plain;base64,x=' } });
  },
  readAsDataURL() {
    return;
  },
} as unknown as FileReader;

describe('ArrayField', () => {
  const CustomComponent = (props: WidgetProps) => {
    return <div id='custom'>{props.rawErrors}</div>;
  };

  const CustomSelectComponent = (props: WidgetProps) => {
    return (
      <select>
        {props.value.map((item: any, index: number) => (
          <option key={index} id='custom-select'>
            {item}
          </option>
        ))}
      </select>
    );
  };
  beforeAll(() => {
    jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader);
  });

  describe('Unsupported array schema', () => {
    it('should warn on missing items descriptor', () => {
      const { node } = createFormComponent({ schema: { type: 'array' } });

      expect(node.querySelector('.rjsf-field-array > .unsupported-field')).toHaveTextContent(
        'Missing items definition',
      );
    });

    it('should be able to be overwritten with a custom UnsupportedField component', () => {
      const CustomUnsupportedField = function () {
        return <span id='custom'>Custom UnsupportedField</span>;
      };

      const templates = { UnsupportedFieldTemplate: CustomUnsupportedField };
      const { node } = createFormComponent({
        schema: { type: 'array' },
        templates,
      });

      expect(node.querySelectorAll('#custom')[0]).toHaveTextContent('Custom UnsupportedField');
    });
  });

  describe('Malformed nested array formData', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };

    it('should contain no field in the list when nested array formData is explicitly null', () => {
      const { node } = createFormComponent({
        schema,
        formData: { foo: null },
      });
      expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(0);
    });
  });

  describe('Nullable array formData', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: ['array', 'null'],
          items: { type: 'string' },
        },
      },
    };

    it('should contain no field in the list when nested array formData is explicitly null', () => {
      const { node } = createFormComponent({
        schema,
        formData: { foo: null },
      });
      expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(0);
    });
    it('should contain a field in the list when nested array formData is a single item', () => {
      const { node } = createFormComponent({
        schema,
        formData: { foo: ['test'] },
      });
      expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(1);
    });
  });

  describe('List of inputs', () => {
    const schema: RJSFSchema = {
      type: 'array',
      title: 'my list',
      description: 'my description',
      items: { type: 'string' },
    };

    it('should render a fieldset', () => {
      const { node } = createFormComponent({ schema });

      const fieldset = node.querySelectorAll('fieldset');
      expect(fieldset).toHaveLength(1);
      expect(fieldset[0]).toHaveAttribute('id', 'root');
    });

    it('should render a fieldset legend', () => {
      const { node } = createFormComponent({ schema });

      const legend = node.querySelector('fieldset > legend');

      expect(legend).toHaveTextContent('my list');
      expect(legend).toHaveAttribute('id', 'root__title');
    });

    it('should render a description', () => {
      const { node } = createFormComponent({ schema });

      const description = node.querySelector('fieldset > .field-description');

      expect(description).toHaveTextContent('my description');
      expect(description).toHaveAttribute('id', 'root__description');
    });

    it('should not render a description when label is false', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:label': false },
      });

      const description = node.querySelector('fieldset > .field-description');

      expect(description).toBeNull();
    });

    it('should render a hidden list', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:widget': 'hidden',
        },
      });
      expect(node.querySelector('div.hidden > fieldset')).toBeInTheDocument();
    });

    it('should render a customized title', () => {
      const CustomTitleField = ({ title }: TitleFieldProps) => <div id='custom'>{title}</div>;

      const { node } = createFormComponent({
        schema,
        templates: { TitleFieldTemplate: CustomTitleField },
      });
      expect(node.querySelector('fieldset > #custom')).toHaveTextContent('my list');
    });

    it('should render a customized description', () => {
      const CustomDescriptionField = ({ description }: DescriptionFieldProps) => <div id='custom'>{description}</div>;

      const { node } = createFormComponent({
        schema,
        templates: {
          DescriptionFieldTemplate: CustomDescriptionField,
        },
      });
      expect(node.querySelector('fieldset > #custom')).toHaveTextContent('my description');
    });

    it('should render a customized file widget', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:widget': 'files',
        },
        widgets: { FileWidget: CustomComponent },
      });
      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    it('should pass uiSchema to normal array field', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          items: {
            'ui:placeholder': 'Placeholder...',
          },
        },
        formData: ['foo', 'barr'],
      });

      expect(node.querySelectorAll("input[placeholder='Placeholder...']")).toHaveLength(2);
    });

    it('should pass rawErrors down to custom array field templates', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'my list',
        description: 'my description',
        items: { type: 'string' },
        minItems: 2,
      };

      const { node } = createFormComponent({
        schema,
        templates: {
          ArrayFieldTemplate: CustomComponent,
        },
        formData: [1],
        liveValidate: true,
      });

      // trigger the errors by submitting the form
      submitForm(node);

      const matches = node.querySelectorAll('#custom');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('must NOT have fewer than 2 items');
    });

    it('should contain no field in the list by default', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(0);
    });

    it('should have an add button', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-array-item-add button')).not.toBeNull();
    });

    it('should not have an add button if addable is false', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:options': { addable: false } },
      });

      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('should add a new field when clicking the add button', () => {
      const { node } = createFormComponent({ schema });

      act(() => {
        fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
      });

      expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(1);
    });

    it('should assign new keys/ids when clicking the add button', () => {
      const { node } = createFormComponent({
        schema,
        templates: { ArrayFieldTemplate: ExposedArrayKeyTemplate, ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate },
      });

      act(() => {
        fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
      });

      expect(node.querySelector('.rjsf-array-item')).toHaveAttribute(ArrayKeyDataAttr);
    });

    it('should add a field when clicking add button even if event is not passed to onAddClick', () => {
      const { node } = createFormComponent({
        schema,
        templates: {
          ArrayFieldTemplate: CustomOnAddClickTemplate,
          ArrayFieldItemTemplate: CustomOnAddClickItemTemplate,
        },
      });

      act(() => {
        fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
      });

      expect(node.querySelector('.rjsf-array-item')).not.toBeNull();
    });

    it('should not provide an add button if length equals maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo', 'bar'],
      });

      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('should provide an add button if length is lesser than maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo'],
      });

      expect(node.querySelector('.rjsf-array-item-add button')).not.toBeNull();
    });

    it('should retain existing row keys/ids when adding new row', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo'],
        templates: { ArrayFieldTemplate: ExposedArrayKeyTemplate, ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate },
      });

      const startRows = node.querySelectorAll('.rjsf-array-item');
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1] ? startRows[1].getAttribute(ArrayKeyDataAttr) : undefined;

      act(() => {
        fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
      });

      const endRows = node.querySelectorAll('.rjsf-array-item');
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
      const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);

      expect(startRow1_key).toEqual(endRow1_key);
      expect(startRow2_key).not.toEqual(endRow2_key);

      expect(startRow2_key).toBeUndefined();
      expect(endRows[0]).toHaveAttribute(ArrayKeyDataAttr);
      expect(endRows[1]).toHaveAttribute(ArrayKeyDataAttr);
    });

    it('should not provide an add button if addable is explicitly false regardless maxItems value', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo'],
        uiSchema: {
          'ui:options': {
            addable: false,
          },
        },
      });

      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('should ignore addable value if maxItems constraint is not satisfied', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo', 'bar'],
        uiSchema: {
          'ui:options': {
            addable: true,
          },
        },
      });

      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('should mark a non-null array item widget as required', () => {
      const { node } = createFormComponent({ schema });

      act(() => {
        fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
      });

      expect(node.querySelector('.rjsf-field-string input[type=text]')).toBeRequired();
    });

    it('should fill an array field with data', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
      });
      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');

      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toHaveValue('foo');
      expect(inputs[1]).toHaveValue('bar');
    });

    it("shouldn't have reorder buttons when list length <= 1", () => {
      const { node } = createFormComponent({ schema, formData: ['foo'] });

      expect(node.querySelector('.rjsf-array-item-move-up')).toBeNull();
      expect(node.querySelector('.rjsf-array-item-move-down')).toBeNull();
    });

    it('should have reorder buttons when list length >= 2', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
      });

      expect(node.querySelector('.rjsf-array-item-move-up')).not.toBeNull();
      expect(node.querySelector('.rjsf-array-item-move-down')).not.toBeNull();
    });

    it('should move down a field from the list', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar', 'baz'],
      });
      const moveDownBtns = node.querySelectorAll('.rjsf-array-item-move-down');

      act(() => {
        fireEvent.click(moveDownBtns[0]);
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      expect(inputs).toHaveLength(3);
      expect(inputs[0]).toHaveValue('bar');
      expect(inputs[1]).toHaveValue('foo');
      expect(inputs[2]).toHaveValue('baz');
    });

    it('should move up a field from the list', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar', 'baz'],
      });
      const moveUpBtns = node.querySelectorAll('.rjsf-array-item-move-up');

      act(() => {
        fireEvent.click(moveUpBtns[2]);
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      expect(inputs).toHaveLength(3);
      expect(inputs[0]).toHaveValue('foo');
      expect(inputs[1]).toHaveValue('baz');
      expect(inputs[2]).toHaveValue('bar');
    });

    it('should retain row keys/ids when moving down', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar', 'baz'],
        templates: { ArrayFieldTemplate: ExposedArrayKeyTemplate, ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate },
      });
      const moveDownBtns = node.querySelectorAll('.rjsf-array-item-move-down');
      const startRows = node.querySelectorAll('.rjsf-array-item');
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);
      const startRow3_key = startRows[2].getAttribute(ArrayKeyDataAttr);

      act(() => {
        fireEvent.click(moveDownBtns[0]);
      });

      const endRows = node.querySelectorAll('.rjsf-array-item');
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
      const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);
      const endRow3_key = endRows[2].getAttribute(ArrayKeyDataAttr);

      expect(startRow1_key).toEqual(endRow2_key);
      expect(startRow2_key).toEqual(endRow1_key);
      expect(startRow3_key).toEqual(endRow3_key);

      expect(endRows[0]).toHaveAttribute(ArrayKeyDataAttr);
      expect(endRows[1]).toHaveAttribute(ArrayKeyDataAttr);
      expect(endRows[2]).toHaveAttribute(ArrayKeyDataAttr);
    });

    it('should retain row keys/ids when moving up', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar', 'baz'],
        templates: { ArrayFieldTemplate: ExposedArrayKeyTemplate, ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate },
      });
      const moveUpBtns = node.querySelectorAll('.rjsf-array-item-move-up');
      const startRows = node.querySelectorAll('.rjsf-array-item');
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);
      const startRow3_key = startRows[2].getAttribute(ArrayKeyDataAttr);

      act(() => {
        fireEvent.click(moveUpBtns[2]);
      });

      const endRows = node.querySelectorAll('.rjsf-array-item');
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
      const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);
      const endRow3_key = endRows[2].getAttribute(ArrayKeyDataAttr);

      expect(startRow1_key).toEqual(endRow1_key);
      expect(startRow2_key).toEqual(endRow3_key);
      expect(startRow3_key).toEqual(endRow2_key);

      expect(endRows[0]).toHaveAttribute(ArrayKeyDataAttr);
      expect(endRows[1]).toHaveAttribute(ArrayKeyDataAttr);
      expect(endRows[2]).toHaveAttribute(ArrayKeyDataAttr);
    });

    it('should disable move buttons on the ends of the list', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
      });
      const moveUpBtns = node.querySelectorAll('.rjsf-array-item-move-up');
      const moveDownBtns = node.querySelectorAll('.rjsf-array-item-move-down');

      expect(moveUpBtns[0]).toBeDisabled();
      expect(moveDownBtns[0]).not.toBeDisabled();
      expect(moveUpBtns[1]).not.toBeDisabled();
      expect(moveDownBtns[1]).toBeDisabled();
    });

    it('should not show move up/down buttons if global orderable is false', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:globalOptions': { orderable: false } },
      });
      const moveUpBtns = node.querySelector('.rjsf-array-item-move-up');
      const moveDownBtns = node.querySelector('.rjsf-array-item-move-down');

      expect(moveUpBtns).toBeNull();
      expect(moveDownBtns).toBeNull();
    });

    it('should not show move up/down buttons if orderable is false', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:options': { orderable: false } },
      });
      const moveUpBtns = node.querySelector('.rjsf-array-item-move-up');
      const moveDownBtns = node.querySelector('.rjsf-array-item-move-down');

      expect(moveUpBtns).toBeNull();
      expect(moveDownBtns).toBeNull();
    });

    it('should not show move up/down buttons if ui:orderable is false', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:orderable': false },
      });
      const moveUpBtns = node.querySelector('.rjsf-array-item-move-up');
      const moveDownBtns = node.querySelector('.rjsf-array-item-move-down');

      expect(moveUpBtns).toBeNull();
      expect(moveDownBtns).toBeNull();
    });

    it('should remove a field from the list', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
      });
      const dropBtns = node.querySelectorAll('.rjsf-array-item-remove');

      act(() => {
        fireEvent.click(dropBtns[0]);
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      expect(inputs).toHaveLength(1);
      expect(inputs[0]).toHaveValue('bar');
    });

    it('should delete item from list and correct indices', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar', 'baz'],
      });
      const deleteBtns = node.querySelectorAll('.rjsf-array-item-remove');

      act(() => {
        fireEvent.click(deleteBtns[0]);
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');

      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'fuzz' } });
      });

      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toHaveValue('fuzz');
      expect(inputs[1]).toHaveValue('baz');
    });

    it('should retain row keys/ids of remaining rows when a row is removed', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        templates: { ArrayFieldTemplate: ExposedArrayKeyTemplate, ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate },
      });

      const startRows = node.querySelectorAll('.rjsf-array-item');
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);

      const dropBtns = node.querySelectorAll('.rjsf-array-item-remove');
      act(() => {
        fireEvent.click(dropBtns[0]);
      });

      const endRows = node.querySelectorAll('.rjsf-array-item');
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);

      expect(startRow2_key).toEqual(endRow1_key);
      expect(endRows[0]).toHaveAttribute(ArrayKeyDataAttr);
    });

    it('should not show remove button if global removable is false', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:globalOptions': { removable: false } },
      });
      const dropBtn = node.querySelector('.rjsf-array-item-remove');

      expect(dropBtn).toBeNull();
    });

    it('should not show remove button if removable is false', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:options': { removable: false } },
      });
      const dropBtn = node.querySelector('.rjsf-array-item-remove');

      expect(dropBtn).toBeNull();
    });

    it('should not show remove button if ui:removable is false', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:removable': false },
      });
      const dropBtn = node.querySelector('.rjsf-array-item-remove');

      expect(dropBtn).toBeNull();
    });

    it('should force revalidation when a field is removed', () => {
      // refs #195
      const { node } = createFormComponent({
        schema: {
          ...schema,
          items: { ...(schema.items as GenericObjectType), minLength: 4 },
        },
        formData: ['foo', 'bar!'],
      });

      try {
        act(() => {
          fireEvent.submit(node);
        });
      } catch {
        // Silencing error thrown as failure is expected here
      }

      expect(node.querySelectorAll('.has-error .error-detail')).toHaveLength(1);

      const dropBtns = node.querySelectorAll('.rjsf-array-item-remove');

      act(() => {
        fireEvent.click(dropBtns[0]);
      });

      expect(node.querySelectorAll('.has-error .error-detail')).toHaveLength(0);
    });

    it('should not show copy button by default', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
      });
      const dropBtn = node.querySelector('.rjsf-array-item-copy');

      expect(dropBtn).toBeNull();
    });

    it('should show copy button if global options copyable is true', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:globalOptions': { copyable: true } },
      });
      const dropBtn = node.querySelector('.rjsf-array-item-copy');

      expect(dropBtn).not.toBeNull();
    });

    it('should show copy button if copyable is true', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:options': { copyable: true } },
      });
      const dropBtn = node.querySelector('.rjsf-array-item-copy');

      expect(dropBtn).not.toBeNull();
    });

    it('should show copy button if ui:copyable is true', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:copyable': true },
      });
      const dropBtn = node.querySelector('.rjsf-array-item-copy');

      expect(dropBtn).not.toBeNull();
    });

    it('should copy a field in the list just below the item clicked', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:copyable': true },
      });
      const copyBtns = node.querySelectorAll('.rjsf-array-item-copy');

      act(() => {
        fireEvent.click(copyBtns[0]);
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      expect(inputs).toHaveLength(3);
      expect(inputs[0]).toHaveValue('foo');
      expect(inputs[1]).toHaveValue('foo');
      expect(inputs[2]).toHaveValue('bar');
    });

    it('should handle cleared field values in the array', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: { type: 'integer' },
      };
      const formData = [1, 2, 3];
      const { node, onChange, onError } = createFormComponent({
        liveValidate: true,
        schema,
        formData,
      });

      act(() => {
        fireEvent.change(node.querySelector('#root_1')!, {
          target: { value: '' },
        });
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          errorSchema: { 1: { __errors: ['must be integer'] } },
          errors: [
            {
              message: 'must be integer',
              name: 'type',
              params: { type: 'integer' },
              property: '.1',
              schemaPath: '#/items/type',
              stack: '.1 must be integer',
              title: '',
            },
          ],
          formData: [1, null, 3],
        }),
        'root_1',
      );

      submitForm(node);
      expect(onError).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          {
            message: 'must be integer',
            name: 'type',
            params: { type: 'integer' },
            property: '.1',
            schemaPath: '#/items/type',
            stack: '.1 must be integer',
            title: '',
          },
        ]),
      );
    });

    it('should render the input widgets with the expected ids', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
      });

      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs[0]).toHaveAttribute('id', 'root_0');
      expect(inputs[1]).toHaveAttribute('id', 'root_1');
    });

    it('should render nested input widgets with the expected ids', () => {
      const complexSchema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                bar: { type: 'string' },
                baz: { type: 'string' },
              },
            },
          },
        },
      };
      const { node } = createFormComponent({
        schema: complexSchema,
        formData: {
          foo: [
            { bar: 'bar1', baz: 'baz1' },
            { bar: 'bar2', baz: 'baz2' },
          ],
        },
      });

      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs[0]).toHaveAttribute('id', 'root_foo_0_bar');
      expect(inputs[1]).toHaveAttribute('id', 'root_foo_0_baz');
      expect(inputs[2]).toHaveAttribute('id', 'root_foo_1_bar');
      expect(inputs[3]).toHaveAttribute('id', 'root_foo_1_baz');
    });

    it('should render enough inputs with proper defaults to match minItems in schema when no formData is set', () => {
      const complexSchema: RJSFSchema = {
        type: 'object',
        definitions: {
          Thing: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'Default name',
              },
            },
          },
        },
        properties: {
          foo: {
            type: 'array',
            minItems: 2,
            items: {
              $ref: '#/definitions/Thing',
            },
          },
        },
      };
      const form = createFormComponent({
        schema: complexSchema,
        formData: {},
      });
      const inputs = form.node.querySelectorAll('input[type=text]');
      expect(inputs[0]).toHaveValue('Default name');
      expect(inputs[1]).toHaveValue('Default name');
    });

    it('should render an input for each default value, even when this is greater than minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          turtles: {
            type: 'array',
            minItems: 2,
            default: ['Raphael', 'Michaelangelo', 'Donatello', 'Leonardo'],
            items: {
              type: 'string',
            },
          },
        },
      };
      const { node } = createFormComponent({ schema: schema });
      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs).toHaveLength(4);
      expect(inputs[0]).toHaveValue('Raphael');
      expect(inputs[1]).toHaveValue('Michaelangelo');
      expect(inputs[2]).toHaveValue('Donatello');
      expect(inputs[3]).toHaveValue('Leonardo');
    });

    it('should render enough input to match minItems, populating the first with default values, and the rest empty', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          turtles: {
            type: 'array',
            minItems: 4,
            default: ['Raphael', 'Michaelangelo'],
            items: {
              type: 'string',
            },
          },
        },
      };
      const { node } = createFormComponent({ schema });
      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs).toHaveLength(4);
      expect(inputs[0]).toHaveValue('Raphael');
      expect(inputs[1]).toHaveValue('Michaelangelo');
      expect(inputs[2]).toHaveValue('');
      expect(inputs[3]).toHaveValue('');
    });

    it('should render enough input to match minItems, populating the first with default values, and the rest with the item default', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          turtles: {
            type: 'array',
            minItems: 4,
            default: ['Raphael', 'Michaelangelo'],
            items: {
              type: 'string',
              default: 'Unknown',
            },
          },
        },
      };
      const { node } = createFormComponent({ schema });
      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs).toHaveLength(4);
      expect(inputs[0]).toHaveValue('Raphael');
      expect(inputs[1]).toHaveValue('Michaelangelo');
      expect(inputs[2]).toHaveValue('Unknown');
      expect(inputs[3]).toHaveValue('Unknown');
    });

    it('should not add minItems extra formData entries when schema item is a multiselect', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          multipleChoicesList: {
            type: 'array',
            minItems: 3,
            uniqueItems: true,
            items: {
              type: 'string',
              enum: ['Aramis', 'Athos', 'Porthos', "d'Artagnan"],
            },
          },
        },
        required: ['multipleChoicesList'],
      };
      const uiSchema: UiSchema = {
        multipleChoicesList: {
          'ui:widget': 'checkboxes',
        },
      };
      let form = createFormComponent({
        schema: schema,
        uiSchema: uiSchema,
        formData: {},
        liveValidate: true,
        noValidate: true,
      });
      submitForm(form.node);

      expectToHaveBeenCalledWithFormData(form.onSubmit, { multipleChoicesList: [] }, true);

      form = createFormComponent({
        schema: schema,
        uiSchema: uiSchema,
        formData: {},
        liveValidate: true,
        noValidate: false,
      });
      submitForm(form.node);

      expect(form.onError).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          {
            message: 'must NOT have fewer than 3 items',
            name: 'minItems',
            params: { limit: 3 },
            property: '.multipleChoicesList',
            schemaPath: '#/properties/multipleChoicesList/minItems',
            stack: '.multipleChoicesList must NOT have fewer than 3 items',
            title: '',
          },
        ]),
      );
    });

    it('should honor given formData, even when it does not meet ths minItems-requirement', () => {
      const complexSchema: RJSFSchema = {
        type: 'object',
        definitions: {
          Thing: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'Default name',
              },
            },
          },
        },
        properties: {
          foo: {
            type: 'array',
            minItems: 2,
            items: {
              $ref: '#/definitions/Thing',
            },
          },
        },
      };
      const form = createFormComponent({
        schema: complexSchema,
        formData: { foo: [] },
      });
      const inputs = form.node.querySelectorAll('input[type=text]');
      expect(inputs).toHaveLength(0);
    });
  });

  describe('Multiple choices list', () => {
    const schema: RJSFSchema = {
      type: 'array',
      title: 'My field',
      items: {
        enum: ['foo', 'bar', 'fuzz'],
        type: 'string',
      },
      uniqueItems: true,
    };

    describe('Select multiple widget', () => {
      it('should render a select widget', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelectorAll('select')).toHaveLength(1);
      });

      it('should render a select widget with a label', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelector('.rjsf-field label')).toHaveTextContent('My field');
      });

      it('should render a select widget with multiple attribute', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelector('.rjsf-field select')).toHaveAttribute('multiple');
      });

      it('should render options', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelectorAll('select option')).toHaveLength(3);
      });

      it('should handle a change event', async () => {
        const { node, onChange } = createFormComponent({ schema });

        const select = node.querySelector<HTMLSelectElement>('.rjsf-field select')!;
        const options = select.querySelectorAll('option');
        act(() => {
          // Preselect the options on the select before firing the evant
          options[0].selected = true;
          options[1].selected = true;
          options[2].selected = false;

          fireEvent.change(select);
        });

        expectToHaveBeenCalledWithFormData(onChange, ['foo', 'bar'], 'root');
      });

      it('should handle a blur event', () => {
        const onBlur = jest.fn();
        const { node } = createFormComponent({ schema, onBlur });

        const select = node.querySelector('.rjsf-field select')!;
        const options = select.querySelectorAll('option');
        act(() => {
          options[0].selected = true;
          options[1].selected = true;
          options[2].selected = false;

          fireEvent.blur(select);
        });

        expect(onBlur).toHaveBeenLastCalledWith(select?.id, ['foo', 'bar']);
      });

      it('should handle a focus event', () => {
        const onFocus = jest.fn();
        const { node } = createFormComponent({ schema, onFocus });

        const select = node.querySelector('.rjsf-field select')!;
        const options = select.querySelectorAll('option');
        act(() => {
          options[0].selected = true;
          options[1].selected = true;
          options[2].selected = false;

          fireEvent.focus(select);
        });

        expect(onFocus).toHaveBeenLastCalledWith(select?.id, ['foo', 'bar']);
      });

      it('should fill field with data', () => {
        const { node } = createFormComponent({
          schema,
          formData: ['foo', 'bar'],
        });

        const options = node.querySelectorAll<HTMLOptionElement>('.rjsf-field select option');
        expect(options).toHaveLength(3);
        expect(options[0].selected).toBe(true); // foo
        expect(options[1].selected).toBe(true); // bar
        expect(options[2].selected).toBe(false); // fuzz
      });

      it('should render the select widget with the expected id', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelector('select')).toHaveAttribute('id', 'root');
      });

      it('should pass rawErrors down to custom widgets', () => {
        const { node } = createFormComponent({
          schema,
          widgets: {
            SelectWidget: CustomComponent,
          },
          formData: ['foo', 'foo'],
          liveValidate: true,
        });
        // trigger the errors by submitting the form since initial render no longer shows them
        submitForm(node);

        const matches = node.querySelectorAll('#custom');
        expect(matches).toHaveLength(1);
        expect(matches[0]).toHaveTextContent('must NOT have duplicate items (items ## 1 and 0 are identical)');
      });

      it('should pass a label as prop to custom widgets', () => {
        const LabelComponent = ({ label }: WidgetProps) => <div id='test'>{label}</div>;
        const { node } = createFormComponent({
          schema,
          widgets: {
            SelectWidget: LabelComponent,
          },
        });

        const matches = node.querySelectorAll('#test');
        expect(matches).toHaveLength(1);
        expect(matches[0]).toHaveTextContent(schema.title!);
      });

      it('should pass uiSchema to multiselect', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: {
            'ui:enumDisabled': ['bar'],
          },
        });

        expect(node.querySelector("option[value='1']")).toBeDisabled(); // use index
      });
    });

    describe('CheckboxesWidget', () => {
      const uiSchema: UiSchema = {
        'ui:widget': 'checkboxes',
      };

      it('should render the expected number of checkboxes', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=checkbox]')).toHaveLength(3);
      });

      it('should render the expected labels', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        const labels = [].map.call(node.querySelectorAll('.checkbox label'), (node: Element) => node.textContent);
        expect(labels).toEqual(['foo', 'bar', 'fuzz']);
      });

      it('should handle a change event', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
        });

        act(() => {
          fireEvent.click(node.querySelectorAll('[type=checkbox]')[0]);
        });
        act(() => {
          fireEvent.click(node.querySelectorAll('[type=checkbox]')[2]);
        });

        expectToHaveBeenCalledWithFormData(onChange, ['foo', 'fuzz'], 'root');
      });

      it('should fill properly field with data that is not an array and handle change event', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          formData: 'foo',
        });

        let labels = [].map.call(node.querySelectorAll('[type=checkbox]'), (node: HTMLInputElement) => node.checked);
        expect(labels).toEqual([true, false, false]);

        act(() => {
          fireEvent.click(node.querySelectorAll('[type=checkbox]')[2]);
        });

        expectToHaveBeenCalledWithFormData(onChange, ['foo', 'fuzz'], 'root');
        labels = [].map.call(node.querySelectorAll('[type=checkbox]'), (node: HTMLInputElement) => node.checked);
        expect(labels).toEqual([true, false, true]);
      });

      it('should fill field with array of data', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: ['foo', 'fuzz'],
        });

        const labels = [].map.call(node.querySelectorAll('[type=checkbox]'), (node: HTMLInputElement) => node.checked);
        expect(labels).toEqual([true, false, true]);
      });

      it('should render the widget with the expected id', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelector('.checkboxes')).toHaveAttribute('id', 'root');
      });

      it('should support inline checkboxes', () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: {
            'ui:widget': 'checkboxes',
            'ui:options': {
              inline: true,
            },
          },
        });

        expect(node.querySelectorAll('.checkbox-inline')).toHaveLength(3);
      });

      it('should pass rawErrors down to custom widgets', () => {
        const schema: RJSFSchema = {
          type: 'array',
          title: 'My field',
          items: {
            enum: ['foo', 'bar', 'fuzz'],
            type: 'string',
          },
          minItems: 3,
          uniqueItems: true,
        };

        const { node } = createFormComponent({
          schema,
          widgets: {
            CheckboxesWidget: CustomComponent,
          },
          uiSchema,
          formData: [],
          liveValidate: true,
        });

        // trigger the errors by submitting the form since initial render no longer shows them
        submitForm(node);

        const matches = node.querySelectorAll('#custom');
        expect(matches).toHaveLength(1);
        expect(matches[0]).toHaveTextContent('must NOT have fewer than 3 items');
      });

      it('should pass uiSchema to checkboxes', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'array',
            items: {
              enum: ['foo', 'bar', 'fuzz'],
              type: 'string',
            },
            uniqueItems: true,
          },
          uiSchema: {
            'ui:widget': 'checkboxes',
            'ui:options': {
              inline: true,
            },
          },
        });

        expect(node.querySelectorAll('.checkbox-inline')).toHaveLength(3);
      });
    });
  });

  describe('Multiple files field', () => {
    const schema: RJSFSchema = {
      type: 'array',
      title: 'My field',
      items: {
        type: 'string',
        format: 'data-url',
      },
    };

    it('should render an input[type=file] widget', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=file]')).toHaveLength(1);
    });

    it('should render a select widget with a label', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('My field');
    });

    it('should render a file widget with multiple attribute', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-field [type=file]')).toHaveAttribute('multiple');
    });

    it('should handle a two change events that results in two items in the list', async () => {
      const { node, onChange } = createFormComponent({ schema });

      act(() => {
        fireEvent.change(node.querySelector('.rjsf-field input[type=file]')!, {
          target: {
            files: [{ name: 'file1.txt', size: 1, type: 'type' }],
          },
        });
      });

      await act(() => {
        new Promise(setImmediate);
      });

      expectToHaveBeenCalledWithFormData(onChange, ['data:text/plain;name=file1.txt;base64,x='], 'root');

      act(() => {
        fireEvent.change(node.querySelector('.rjsf-field input[type=file]')!, {
          target: {
            files: [{ name: 'file2.txt', size: 2, type: 'type' }],
          },
        });
      });

      await act(() => {
        new Promise(setImmediate);
      });

      expectToHaveBeenCalledWithFormData(
        onChange,
        ['data:text/plain;name=file1.txt;base64,x=', 'data:text/plain;name=file2.txt;base64,x='],
        'root',
      );
    });

    it('should handle a change event with multiple files that results the same items in the list', async () => {
      const { node, onChange } = createFormComponent({ schema });

      act(() => {
        fireEvent.change(node.querySelector('.rjsf-field input[type=file]')!, {
          target: {
            files: [
              { name: 'file1.txt', size: 1, type: 'type' },
              { name: 'file2.txt', size: 2, type: 'type' },
            ],
          },
        });
      });

      await act(() => {
        new Promise(setImmediate);
      });

      expectToHaveBeenCalledWithFormData(
        onChange,
        ['data:text/plain;name=file1.txt;base64,x=', 'data:text/plain;name=file2.txt;base64,x='],
        'root',
      );
    });

    it('should fill field with data', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          'data:text/plain;name=file1.txt;base64,dGVzdDE=',
          'data:image/png;name=file2.png;base64,ZmFrZXBuZw==',
        ],
      });

      const li = node.querySelectorAll('.file-info li');

      expect(li).toHaveLength(2);
      expect(li[0]).toHaveTextContent('file1.txt (text/plain, 5 bytes)');
      expect(li[1]).toHaveTextContent('file2.png (image/png, 7 bytes)');
    });

    it('should render the file widget with the expected id', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input[type=file]')).toHaveAttribute('id', 'root');
    });

    it('should pass uiSchema to files array', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        uiSchema: {
          items: {
            'ui:widget': 'file',
            'ui:options': { accept: '.pdf' },
          },
        },
        formData: [
          'data:text/plain;name=file1.pdf;base64,dGVzdDE=',
          'data:image/png;name=file2.pdf;base64,ZmFrZXBuZw==',
        ],
      });

      expect(node.querySelector('input[type=file]')).toHaveAttribute('accept', '.pdf');
    });

    it('should pass rawErrors down to custom widgets', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'My field',
        items: {
          type: 'string',
          format: 'data-url',
        },
        minItems: 5,
      };

      const { node } = createFormComponent({
        schema,
        widgets: {
          FileWidget: CustomComponent,
        },
        formData: [],
        liveValidate: true,
      });

      // trigger the errors by submitting the form since initial render no longer shows them
      submitForm(node);

      const matches = node.querySelectorAll('#custom');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('must NOT have fewer than 5 items');
    });
  });

  describe('Nested lists', () => {
    const schema: RJSFSchema = {
      type: 'array',
      title: 'A list of arrays',
      items: {
        type: 'array',
        title: 'A list of numbers',
        items: {
          type: 'number',
        },
      },
    };

    it('should render two lists of inputs inside of a list', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          [1, 2],
          [3, 4],
        ],
      });
      expect(node.querySelectorAll('fieldset fieldset')).toHaveLength(2);
    });

    it('should add an inner list when clicking the add button', () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelectorAll('fieldset fieldset')).toHaveLength(0);

      act(() => {
        fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
      });

      expect(node.querySelectorAll('fieldset fieldset')).toHaveLength(1);
    });

    it('should pass rawErrors down to every level of custom widgets', () => {
      const CustomItem = (props: FieldProps) => <div id='custom-item'>{props.children}</div>;
      const CustomTemplate = (props: ArrayFieldTemplateProps) => {
        return (
          <div id='custom'>
            {props.items}
            <div id='custom-error'>{props.rawErrors && props.rawErrors.join(', ')}</div>
          </div>
        );
      };

      const schema: RJSFSchema = {
        type: 'array',
        title: 'A list of arrays',
        items: {
          type: 'array',
          title: 'A list of numbers',
          items: {
            type: 'number',
          },
          minItems: 3,
        },
        minItems: 2,
      };

      const { node } = createFormComponent({
        schema,
        templates: { ArrayFieldTemplate: CustomTemplate, ArrayFieldItemTemplate: CustomItem },
        formData: [[]],
        liveValidate: true,
      });

      // trigger the errors by submitting the form since initial render no longer shows them
      submitForm(node);

      const matches = node.querySelectorAll('#custom-error');
      expect(matches).toHaveLength(2);
      expect(matches[0]).toHaveTextContent('must NOT have fewer than 3 items');
      expect(matches[1]).toHaveTextContent('must NOT have fewer than 2 items');
    });
  });

  describe('Fixed items lists', () => {
    const schema: RJSFSchema = {
      type: 'array',
      title: 'List of fixed items',
      items: [
        {
          type: 'string',
          title: 'Some text',
        },
        {
          type: 'number',
          title: 'A number',
        },
      ],
    };

    const schemaAdditional: RJSFSchema = {
      type: 'array',
      title: 'List of fixed items',
      items: [
        {
          type: 'number',
          title: 'A number',
        },
        {
          type: 'number',
          title: 'Another number',
        },
      ],
      additionalItems: {
        type: 'string',
        title: 'Additional item',
      },
    };

    it('should render a fieldset', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('fieldset')).toHaveLength(1);
    });

    it('should render a fieldset legend', () => {
      const { node } = createFormComponent({ schema });
      const legend = node.querySelector('fieldset > legend');
      expect(legend).toHaveTextContent('List of fixed items');
      expect(legend).toHaveAttribute('id', 'root__title');
    });

    it('should render field widgets', () => {
      const { node } = createFormComponent({ schema });
      const strInput = node.querySelector('fieldset .rjsf-field-string input[type=text]');
      const numInput = node.querySelector('fieldset .rjsf-field-number input[type=number]');
      expect(strInput).toHaveAttribute('id', 'root_0');
      expect(numInput).toHaveAttribute('id', 'root_1');
    });

    it('should mark non-null item widgets as required', () => {
      const { node } = createFormComponent({ schema });
      const strInput = node.querySelector('fieldset .rjsf-field-string input[type=text]');
      const numInput = node.querySelector('fieldset .rjsf-field-number input[type=number]');
      expect(strInput).toBeRequired();
      expect(numInput).toBeRequired();
    });

    it('should fill fields with data', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 42],
      });
      const strInput = node.querySelector('fieldset .rjsf-field-string input[type=text]');
      const numInput = node.querySelector('fieldset .rjsf-field-number input[type=number]');
      expect(strInput).toHaveValue('foo');
      expect(numInput).toHaveValue(42);
    });

    it('should handle change events', () => {
      const { node, onChange } = createFormComponent({ schema });
      const strInput = node.querySelector('fieldset .rjsf-field-string input[type=text]');
      const numInput = node.querySelector('fieldset .rjsf-field-number input[type=number]');

      act(() => {
        fireEvent.change(strInput!, { target: { value: 'bar' } });
      });

      act(() => {
        fireEvent.change(numInput!, { target: { value: '101' } });
      });

      expectToHaveBeenCalledWithFormData(onChange, ['bar', 101], 'root_1');
    });

    it('should generate additional fields and fill data', () => {
      const { node } = createFormComponent({
        schema: schemaAdditional,
        formData: [1, 2, 'bar'],
      });
      const addInput = node.querySelector('fieldset .rjsf-field-string input[type=text]');
      expect(addInput).toHaveAttribute('id', 'root_2');
      expect(addInput).toHaveValue('bar');
    });

    it('should apply uiSchema to additionalItems', () => {
      const { node } = createFormComponent({
        schema: schemaAdditional,
        uiSchema: {
          additionalItems: {
            'ui:title': 'Custom title',
          },
        },
        formData: [1, 2, 'bar'],
      });
      const label = node.querySelector('fieldset .rjsf-field-string label.control-label');
      expect(label).toHaveTextContent('Custom title*');
    });

    it('should have an add button if additionalItems is an object', () => {
      const { node } = createFormComponent({ schema: schemaAdditional });
      expect(node.querySelector('.rjsf-array-item-add button')).not.toBeNull();
    });

    it('should not have an add button if additionalItems is not set', () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('should not have an add button if global addable is false', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:globalOptions': { addable: false } },
      });
      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('should not have an add button if addable is false', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:options': { addable: false } },
      });
      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('[fixed-noadditional] should not provide an add button regardless maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 3, ...schema },
      });

      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('[fixed] should not provide an add button if length equals maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schemaAdditional },
      });

      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('[fixed] should provide an add button if length is lesser than maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 3, ...schemaAdditional },
      });

      expect(node.querySelector('.rjsf-array-item-add button')).not.toBeNull();
    });

    it('[fixed] should not provide an add button if addable is expliclty false regardless maxItems value', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        uiSchema: {
          'ui:options': {
            addable: false,
          },
        },
      });

      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('[fixed] should ignore addable value if maxItems constraint is not satisfied', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        uiSchema: {
          'ui:options': {
            addable: true,
          },
        },
      });

      expect(node.querySelector('.rjsf-array-item-add button')).toBeNull();
    });

    it('[fixed] should pass uiSchema to fixed array', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'array',
          items: [
            {
              type: 'string',
            },
            {
              type: 'string',
            },
          ],
        },
        uiSchema: {
          items: {
            'ui:widget': 'textarea',
          },
        },
        formData: ['foo', 'bar'],
      });
      expect(node.querySelectorAll('textarea')).toHaveLength(2);
    });

    it('[fixed] should silently handle additional formData not covered by fixed array', () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'array',
          items: [
            {
              type: 'string',
            },
            {
              type: 'string',
            },
          ],
        },
        formData: ['foo', 'bar', 'baz'],
      });
      expect(node.querySelectorAll('input')).toHaveLength(2);
      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, ['foo', 'bar', 'baz'], true);
    });

    describe('operations for additional items', () => {
      it('should add a field when clicking add button', () => {
        const { node, onChange } = createFormComponent({
          schema: schemaAdditional,
          formData: [1, 2, 'foo'],
          templates: {
            ArrayFieldTemplate: ExposedArrayKeyTemplate,
            ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate,
          },
        });

        const addBtn = node.querySelector('.rjsf-array-item-add button');

        act(() => {
          fireEvent.click(addBtn!);
        });

        expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(2);

        expectToHaveBeenCalledWithFormData(onChange, [1, 2, 'foo', undefined], 'root');
      });

      it('should retain existing row keys/ids when adding additional items', () => {
        const { node } = createFormComponent({
          schema: schemaAdditional,
          formData: [1, 2, 'foo'],
          templates: {
            ArrayFieldTemplate: ExposedArrayKeyTemplate,
            ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate,
          },
        });

        const startRows = node.querySelectorAll('.rjsf-array-item');
        const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
        const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);
        const startRow3_key = startRows[2].getAttribute(ArrayKeyDataAttr);
        const startRow4_key = startRows[3] ? startRows[3].getAttribute(ArrayKeyDataAttr) : undefined;

        const addBtn = node.querySelector('.rjsf-array-item-add button');

        act(() => {
          fireEvent.click(addBtn!);
        });

        const endRows = node.querySelectorAll('.rjsf-array-item');
        const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
        const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);
        const endRow3_key = endRows[2].getAttribute(ArrayKeyDataAttr);
        const endRow4_key = endRows[3].getAttribute(ArrayKeyDataAttr);

        expect(startRow1_key).toEqual(endRow1_key);
        expect(startRow2_key).toEqual(endRow2_key);
        expect(startRow3_key).toEqual(endRow3_key);

        expect(startRow4_key).not.toEqual(endRow4_key);
        expect(startRow4_key).toBeUndefined();
        expect(endRows[0]).toHaveAttribute(ArrayKeyDataAttr);
        expect(endRows[1]).toHaveAttribute(ArrayKeyDataAttr);
        expect(endRows[2]).toHaveAttribute(ArrayKeyDataAttr);
        expect(endRows[3]).toHaveAttribute(ArrayKeyDataAttr);
      });

      it('should change the state when changing input value', () => {
        const { node, onChange } = createFormComponent({
          schema: schemaAdditional,
          formData: [1, 2, 'foo'],
          templates: {
            ArrayFieldTemplate: ExposedArrayKeyTemplate,
            ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate,
          },
        });

        const addBtn = node.querySelector('.rjsf-array-item-add button');

        act(() => {
          fireEvent.click(addBtn!);
        });

        const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');

        act(() => {
          fireEvent.change(inputs[0], { target: { value: 'bar' } });
        });

        act(() => {
          fireEvent.change(inputs[1], { target: { value: 'baz' } });
        });

        expectToHaveBeenCalledWithFormData(onChange, [1, 2, 'bar', 'baz'], 'root_3');
      });

      it('should remove array items when clicking remove buttons', () => {
        const { node, onChange } = createFormComponent({
          schema: schemaAdditional,
          formData: [1, 2, 'foo'],
          templates: {
            ArrayFieldTemplate: ExposedArrayKeyTemplate,
            ArrayFieldItemTemplate: ExposedArrayKeyItemTemplate,
          },
        });

        const addBtn = node.querySelector('.rjsf-array-item-add button');

        act(() => {
          fireEvent.click(addBtn!);
        });

        let dropBtns = node.querySelectorAll('.rjsf-array-item-remove');

        act(() => {
          fireEvent.click(dropBtns[0]);
        });

        expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(1);
        const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
        act(() => {
          fireEvent.change(inputs[0], { target: { value: 'baz' } });
        });

        expectToHaveBeenCalledWithFormData(onChange, [1, 2, 'baz'], 'root_2');

        dropBtns = node.querySelectorAll('.rjsf-array-item-remove');
        act(() => {
          fireEvent.click(dropBtns[0]);
        });

        expect(node.querySelectorAll('.rjsf-field-string')).toHaveLength(0);
        expectToHaveBeenCalledWithFormData(onChange, [1, 2], 'root');
      });
    });
  });

  describe('Multiple number choices list', () => {
    const schema: RJSFSchema = {
      type: 'array',
      title: 'My field',
      items: {
        enum: [1, 2, 3],
        type: 'integer',
      },
      uniqueItems: true,
    };

    it("should convert array of strings to numbers if type of items is 'number'", () => {
      const { node, onChange } = createFormComponent({ schema });

      const select = node.querySelector('.rjsf-field select')!;
      const options = select.querySelectorAll('option');
      act(() => {
        options[0].selected = true;
        options[1].selected = true;
        options[2].selected = false;

        fireEvent.change(select);
      });

      expectToHaveBeenCalledWithFormData(onChange, [1, 2], 'root');
    });
  });

  describe('Custom Widget', () => {
    it('if it does not contain enums or uniqueItems=true, it should still render the custom widget.', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:widget': 'CustomSelect',
        },
        formData: ['foo', 'bar'],
        widgets: {
          CustomSelect: CustomSelectComponent,
        },
      });

      expect(node.querySelectorAll('#custom-select')).toHaveLength(2);
    });

    it('should pass uiSchema to custom widget', () => {
      const CustomWidget = ({ uiSchema }: WidgetProps) => {
        return <div id='custom-ui-option-value'>{uiSchema?.custom_field_key['ui:options'].test}</div>;
      };

      const { node } = createFormComponent({
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        widgets: {
          CustomWidget: CustomWidget,
        },
        uiSchema: {
          'ui:widget': 'CustomWidget',
          custom_field_key: {
            'ui:options': {
              test: 'foo',
            },
          },
        },
        formData: ['foo', 'bar'],
      });

      expect(node.querySelector('#custom-ui-option-value')).toHaveTextContent('foo');
    });

    it('if the schema has fixed items, it should still render the custom widget.', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: [
          {
            type: 'string',
            title: 'Some text',
          },
          {
            type: 'number',
            title: 'A number',
          },
        ],
      };

      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:widget': 'CustomSelect',
        },
        formData: ['foo', 'bar'],
        widgets: {
          CustomSelect: CustomSelectComponent,
        },
      });

      expect(node.querySelectorAll('#custom-select')).toHaveLength(2);
    });
  });

  describe('Title', () => {
    const TitleFieldTemplate = (props: TitleFieldProps) => <div id={`title-${props.title}`} />;

    const templates = { TitleFieldTemplate };

    it('should pass field name to TitleFieldTemplate if there is no title', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          array: {
            type: 'array',
            items: {},
          },
        },
      };

      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-array')).not.toBeNull();
    });

    it('should pass schema title to TitleFieldTemplate', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'test',
        items: {},
      };

      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-test')).not.toBeNull();
    });

    it('should pass empty schema title to TitleFieldTemplate', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: '',
        items: {},
      };
      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-')).toBeNull();
    });

    it('should not render a TitleFieldTemplate when label is false', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'test',
        items: {},
      };
      const { node } = createFormComponent({
        schema,
        templates,
        uiSchema: { 'ui:label': false },
      });
      expect(node.querySelector('#title-test')).toBeNull();
    });
  });

  describe('Tests for item title', () => {
    describe('Should show indexed title for widgets when necessary', () => {
      const widgetTestData: { widgetName: string; itemSchema: RJSFSchema; itemUiSchema?: UiSchema }[] = [
        {
          widgetName: 'AltDateWidget',
          itemSchema: {
            type: 'string',
            format: 'alt-date',
          },
        },
        {
          widgetName: 'AltDateTimeWidget',
          itemSchema: {
            type: 'string',
            format: 'alt-datetime',
          },
        },
        {
          widgetName: 'CheckboxesWidget',
          itemSchema: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['foo', 'bar', 'fuzz', 'qux'],
            },
            uniqueItems: true,
          },
        },
        {
          widgetName: 'ColorWidget',
          itemSchema: {
            type: 'string',
          },
          itemUiSchema: {
            'ui:widget': 'color',
          },
        },
        {
          widgetName: 'DateWidget',
          itemSchema: {
            type: 'string',
            format: 'date',
          },
        },
        {
          widgetName: 'DateTimeWidget',
          itemSchema: {
            type: 'string',
            format: 'datetime',
          },
        },
        {
          widgetName: 'EmailWidget',
          itemSchema: {
            type: 'string',
            format: 'email',
          },
        },
        {
          widgetName: 'FileWidget',
          itemSchema: {
            type: 'string',
          },
          itemUiSchema: {
            'ui:widget': 'file',
          },
        },
        {
          widgetName: 'PasswordWidget',
          itemSchema: {
            type: 'string',
          },
          itemUiSchema: {
            'ui:widget': 'password',
          },
        },
        {
          widgetName: 'RadioWidget',
          itemSchema: {
            type: 'boolean',
          },
          itemUiSchema: {
            'ui:widget': 'radio',
          },
        },
        {
          widgetName: 'RangeWidget',
          itemSchema: {
            type: 'number',
          },
          itemUiSchema: {
            'ui:widget': 'range',
          },
        },
        {
          widgetName: 'SelectWidget',
          itemSchema: {
            type: 'string',
            enum: ['A', 'B'],
          },
        },
        {
          widgetName: 'TextWidget',
          itemSchema: {
            type: 'string',
          },
        },
        {
          widgetName: 'TextareaWidget',
          itemSchema: {
            type: 'string',
          },
          itemUiSchema: {
            'ui:widget': 'textarea',
          },
        },
        {
          widgetName: 'TimeWidget',
          itemSchema: {
            type: 'string',
            format: 'time',
          },
        },
        {
          widgetName: 'UpDownWidget',
          itemSchema: {
            type: 'number',
          },
          itemUiSchema: {
            'ui:widget': 'updown',
          },
        },
        {
          widgetName: 'UrlWidget',
          itemSchema: {
            type: 'string',
            format: 'url',
          },
        },
      ];

      it("Should show indexed title for the `CheckboxWidget` widget if no title is mentioned in it's UI Schema", () => {
        const CheckboxWidget = (props: WidgetProps) => <div id={`title-${props.label}`} />;

        const widgets = { CheckboxWidget };

        const schema: RJSFSchema = {
          type: 'array',
          title: 'Array',
          items: {
            type: 'boolean',
          },
        };

        const { node } = createFormComponent({
          schema,
          widgets,
        });

        act(() => {
          fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
        });

        expect(node.querySelector('#title-Array-1')).not.toBeNull();
      });

      it("Should not show indexed title for the `CheckboxWidget` widget if title is mentioned in it's UI Schema", () => {
        const CheckboxWidget = (props: WidgetProps) => <div id={`title-${props.label}`} />;

        const widgets = { CheckboxWidget };

        const schema: RJSFSchema = {
          type: 'array',
          title: 'Array',
          items: {
            title: 'Boolean',
            type: 'boolean',
          },
        };

        const { node } = createFormComponent({
          schema,
          widgets,
        });

        act(() => {
          fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
        });

        expect(node.querySelector('#title-Boolean')).not.toBeNull();
        expect(node.querySelector('#title-Array-1')).toBeNull();
      });

      it.each(widgetTestData)(
        "Should show indexed title for the `$widgetName` widget if no title is mentioned in it's UI Schema",
        ({ itemSchema, itemUiSchema }) => {
          const schema: RJSFSchema = {
            type: 'array',
            title: 'Array',
            items: itemSchema,
          };

          const uiSchema: UiSchema = {
            items: itemUiSchema,
          };

          const { node } = createFormComponent({
            schema,
            uiSchema,
          });

          act(() => {
            fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
          });

          expect(node.querySelector('label[for="root_0"]')).toHaveTextContent('Array-1');
        },
      );

      it.each(widgetTestData)(
        "Should not show indexed title for the `$widgetName` widget if title is mentioned in it's UI Schema",
        ({ itemSchema, itemUiSchema }) => {
          const schema: RJSFSchema = {
            type: 'array',
            title: 'Array',
            items: {
              ...itemSchema,
              title: 'Item Title',
            },
          };

          const uiSchema: UiSchema = {
            items: itemUiSchema,
          };

          const { node } = createFormComponent({
            schema,
            uiSchema,
          });

          act(() => {
            fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
          });

          const widgetLabelText = node.querySelector('label[for="root_0"]');

          expect(widgetLabelText).not.toHaveTextContent('Array-1');
          expect(widgetLabelText).toHaveTextContent('Item Title');
        },
      );
    });

    describe('Should show indexed title for fields when necessary', () => {
      const fieldTestDataWithLegend: { fieldName: string; itemSchema: RJSFSchema }[] = [
        {
          fieldName: 'ObjectField',
          itemSchema: {
            properties: {
              string: {
                type: 'string',
              },
            },
          },
        },
        {
          fieldName: 'ArrayField',
          itemSchema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        {
          fieldName: 'MultiSchemaField(AllOf)',
          itemSchema: {
            allOf: [
              {
                properties: {
                  lorem: {
                    type: ['string', 'boolean'],
                    default: true,
                  },
                },
              },
              {
                properties: {
                  lorem: {
                    type: 'boolean',
                  },
                  ipsum: {
                    type: 'string',
                  },
                },
              },
            ],
          },
        },
      ];

      const fieldTestDataWithLabel: { fieldName: string; itemSchema: RJSFSchema }[] = [
        {
          fieldName: 'MultiSchemaField(OneOf)',
          itemSchema: {
            oneOf: [
              {
                type: 'string',
              },
              {
                type: 'number',
              },
            ],
          },
        },
        {
          fieldName: 'MultiSchemaField(AnyOf)',
          itemSchema: {
            anyOf: [
              {
                type: 'string',
              },
              {
                type: 'number',
              },
            ],
          },
        },
      ];

      it.each(fieldTestDataWithLegend)(
        "Should show indexed title for the $fieldName field if no title is mentioned in it's UI Schema",
        ({ itemSchema }) => {
          const schema: RJSFSchema = {
            type: 'array',
            title: 'Array',
            items: itemSchema,
          };

          const { node } = createFormComponent({
            schema,
          });

          act(() => {
            fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
          });

          expect(node.querySelector('legend#root_0__title')).toHaveTextContent('Array-1');
        },
      );

      it.each(fieldTestDataWithLegend)(
        "Should not show indexed title for the $fieldName field if title is mentioned in it's UI Schema",
        ({ itemSchema }) => {
          const schema: RJSFSchema = {
            type: 'array',
            title: 'Array',
            items: {
              ...itemSchema,
              title: 'Item Field Title',
            },
          };

          const { node } = createFormComponent({
            schema,
          });

          act(() => {
            fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
          });

          const legendText = node.querySelector('legend#root_0__title');

          expect(legendText).toHaveTextContent('Item Field Title');
          expect(legendText).not.toHaveTextContent('Array-1');
        },
      );

      it.each(fieldTestDataWithLabel)(
        "Should show indexed title for the $fieldName field if no title is mentioned in it's UI Schema",
        ({ itemSchema }) => {
          const schema: RJSFSchema = {
            type: 'array',
            title: 'Array',
            items: itemSchema,
          };

          const { node } = createFormComponent({
            schema,
          });

          act(() => {
            fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
          });

          expect(node.querySelector('label[for="root_0"]')).toHaveTextContent('Array-1');
        },
      );

      it.each(fieldTestDataWithLabel)(
        "Should not show indexed title for the $fieldName field if title is mentioned in it's UI Schema",
        ({ itemSchema }) => {
          const schema: RJSFSchema = {
            type: 'array',
            title: 'Array',
            items: {
              ...itemSchema,
              title: 'Item Field Title',
            },
          };

          const { node } = createFormComponent({
            schema,
          });

          act(() => {
            fireEvent.click(node.querySelector('.rjsf-array-item-add button')!);
          });

          const labelText = node.querySelector('label[for="root_0"]');

          expect(labelText).toHaveTextContent('Item Field Title');
          expect(labelText).not.toHaveTextContent('Array-1');
        },
      );
    });
  });

  describe('should handle nested idPrefix and idSeparator parameter', () => {
    it('should render nested input widgets with the expected ids', () => {
      const complexSchema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                bar: { type: 'string' },
                baz: { type: 'string' },
              },
            },
          },
        },
      };
      const { node } = createFormComponent({
        schema: complexSchema,
        formData: {
          foo: [
            { bar: 'bar1', baz: 'baz1' },
            { bar: 'bar2', baz: 'baz2' },
          ],
        },
        idSeparator: '/',
        idPrefix: 'base',
      });

      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs[0]).toHaveAttribute('id', 'base/foo/0/bar');
      expect(inputs[1]).toHaveAttribute('id', 'base/foo/0/baz');
      expect(inputs[2]).toHaveAttribute('id', 'base/foo/1/bar');
      expect(inputs[3]).toHaveAttribute('id', 'base/foo/1/baz');
    });
  });

  describe("should handle nested 'hideError: true' uiSchema value", () => {
    const complexSchema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
        },
      },
    };
    function customValidate(_: any | undefined, errors: FormValidation) {
      errors.foo?.[0]?.bar?.addError('test');
      errors.foo?.[1]?.bar?.addError('test');
      return errors;
    }

    it('should render nested error decorated input widgets with the expected ids', () => {
      const { node } = createFormComponent({
        schema: complexSchema,
        formData: {
          foo: [{ bar: 'bar1' }, { bar: 'bar2' }],
        },
        customValidate,
      });

      act(() => {
        fireEvent.submit(node);
      });

      const inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=text]');
      expect(inputs[0]).toHaveAttribute('id', 'root_foo_0_bar');
      expect(inputs[1]).toHaveAttribute('id', 'root_foo_1_bar');
    });
    it('must NOT render nested error decorated input widgets', () => {
      const { node } = createFormComponent({
        schema: complexSchema,
        uiSchema: {
          'ui:hideError': true,
        },
        formData: {
          foo: [{ bar: 'bar1' }, { bar: 'bar2' }],
        },
        customValidate,
        showErrorList: false,
      });
      fireEvent.submit(node);

      const inputsNoError = node.querySelectorAll('.form-group.rjsf-field-error input[type=text]');
      expect(inputsNoError).toHaveLength(0);
    });
  });
  describe('FormContext gets passed', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: [
        {
          type: 'string',
          title: 'Some text',
        },
        {
          type: 'number',
          title: 'A number',
        },
      ],
    };
    it('should pass form context to schema field for the root AND array schema fields', () => {
      const formContext: GenericObjectType = {
        root: 'root-id',
        root_0: 'root_0-id',
        root_1: 'root_1-id',
      };
      function CustomSchemaField(props: FieldProps) {
        const {
          registry: { formContext },
          fieldPathId,
        } = props;
        return (
          <>
            <code id={formContext[fieldPathId.$id]}>Ha</code>
            <SchemaField {...props} />
          </>
        );
      }
      const { node } = createFormComponent({
        schema,
        formContext,
        fields: { SchemaField: CustomSchemaField },
      });

      const codeBlocks = node.querySelectorAll('code');
      expect(codeBlocks).toHaveLength(3);
      Object.keys(formContext).forEach((key) => {
        expect(node.querySelector(`code#${formContext[key]}`)).toBeInTheDocument();
      });
    });
    it('should pass form context to array schema field only', () => {
      const formContext: GenericObjectType = {
        root: 'root-id',
        root_0: 'root_0-id',
        root_1: 'root_1-id',
      };
      function CustomSchemaField(props: FieldProps) {
        const {
          registry: { formContext },
          fieldPathId,
        } = props;
        return (
          <>
            <code id={formContext[fieldPathId.$id]}>Ha</code>
            <SchemaField {...props} />
          </>
        );
      }
      const { node } = createFormComponent({
        schema,
        formContext,
        fields: { ArraySchemaField: CustomSchemaField },
      });

      const codeBlocks = node.querySelectorAll('code');
      expect(codeBlocks).toHaveLength(2);
      Object.keys(formContext).forEach((key) => {
        if (key === 'root') {
          expect(node.querySelector(`code#${formContext[key]}`)).not.toBeInTheDocument();
        } else {
          expect(node.querySelector(`code#${formContext[key]}`)).toBeInTheDocument();
        }
      });
    });
  });

  describe('ErrorSchema gets updated', () => {
    const templates = {
      ArrayFieldItemTemplate: ArrayFieldTestItemTemplate,
      ArrayFieldItemButtonsTemplate: ArrayFieldTestItemButtonsTemplate,
    };
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
          },
        },
        required: ['text'],
      },
    };
    const uiSchema: UiSchema = {
      'ui:copyable': true,
    };

    const formData = [
      {},
      {
        text: 'y',
      },
    ];

    it('swaps errors when swapping elements', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData,
        templates,
      });

      act(() => {
        submitForm(node);
      });

      const button = node.querySelector('[title="move-up"]');

      act(() => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: [{ text: 'y' }, {}],
          errorSchema: {
            1: {
              text: {
                __errors: ["must have required property 'text'"],
              },
            },
          },
        }),
        'root',
      );
    });

    it('leaves errors when removing higher elements', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData,
        templates,
      });

      act(() => {
        submitForm(node);
      });

      const button = node.querySelectorAll('[title="remove"]')[1];

      act(() => {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: [{}],
          errorSchema: {
            0: {
              text: {
                __errors: ["must have required property 'text'"],
              },
            },
          },
        }),
        'root',
      );
    });

    it('removes errors when removing elements', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData,
        templates,
      });

      act(() => {
        submitForm(node);
      });

      const button = node.querySelector('[title="remove"]');

      act(() => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: [{ text: 'y' }],
          errorSchema: {},
        }),
        'root',
      );
    });

    it('leaves errors in place when inserting elements', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData,
        templates,
      });

      act(() => {
        submitForm(node);
      });

      const button = node.querySelector('[title="insert"]');

      act(() => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: [{}, {}, { text: 'y' }],
          errorSchema: {
            0: {
              text: {
                __errors: ["must have required property 'text'"],
              },
            },
          },
        }),
        'root',
      );
    });

    it('moves errors when inserting elements', () => {
      const { node, onChange } = createFormComponent({
        schema,
        formData: [{ text: 'y' }, {}],
        templates,
      });

      act(() => {
        submitForm(node);
      });

      const button = node.querySelector('[title="insert"]');

      act(() => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: [{ text: 'y' }, {}, {}],
          errorSchema: {
            2: {
              text: {
                __errors: ["must have required property 'text'"],
              },
            },
          },
        }),
        'root',
      );
    });

    it('leaves errors in place when copying elements', () => {
      const { node, onChange } = createFormComponent({
        schema,
        uiSchema,
        formData,
        templates,
      });

      act(() => {
        submitForm(node);
      });

      const button = node.querySelector('[title="copy"]');

      act(() => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: [{}, {}, { text: 'y' }],
          errorSchema: {
            0: {
              text: {
                __errors: ["must have required property 'text'"],
              },
            },
          },
        }),
        'root',
      );
    });

    it('moves errors when copying elements', () => {
      const { node, onChange } = createFormComponent({
        schema,
        uiSchema,
        formData: [{ text: 'y' }, {}],
        templates,
      });

      act(() => {
        submitForm(node);
      });

      const button = node.querySelector('[title="copy"]');

      act(() => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: [{ text: 'y' }, { text: 'y' }, {}],
          errorSchema: {
            2: {
              text: {
                __errors: ["must have required property 'text'"],
              },
            },
          },
        }),
        'root',
      );
    });

    it('Check that when formData changes, the form should re-validate', () => {
      const { node, rerender } = createFormComponent({
        schema,
        formData: [{}],
        liveValidate: true,
      });

      // trigger the errors by submitting the form since initial render no longer shows them
      submitForm(node);

      const errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessage = node.querySelector('#root_0_text__error .text-danger');
      expect(errorMessage).toHaveTextContent("must have required property 'text'");

      rerender({ schema, formData: [{ text: 'test' }], liveValidate: true });

      expect(node.querySelectorAll('#root_0_text__error')).toHaveLength(0);
    });

    it('raise an error and check if the error is displayed', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          {
            text: 'y',
          },
        ],
        templates,
        fields: {
          ArrayField: ArrayFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      const errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessage = node.querySelector('#root_0_text__error .text-danger');
      expect(errorMessage).toHaveTextContent('Value must be "Appie"');
    });

    it('should not raise an error if value is correct', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          {
            text: 'y',
          },
        ],
        templates,
        fields: {
          ArrayField: ArrayFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'Appie' } });
      });

      const errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('should clear an error if value is entered correctly', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          {
            text: 'y',
          },
        ],
        templates,
        fields: {
          ArrayField: ArrayFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      let errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessage = node.querySelector('#root_0_text__error .text-danger');
      expect(errorMessage).toHaveTextContent('Value must be "Appie"');

      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'Appie' } });
      });

      errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('raise an error and check if the error is displayed using custom text widget', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          {
            text: 'y',
          },
        ],
        templates,
        widgets: {
          TextWidget: TextWidgetTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      const errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessage = node.querySelector('#root_0_text__error .text-danger');
      expect(errorMessage).toHaveTextContent('Value must be "test"');
    });

    it('should not raise an error if value is correct using custom text widget', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          {
            text: 'y',
          },
        ],
        templates,
        widgets: {
          TextWidget: TextWidgetTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      const errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('should clear an error if value is entered correctly using custom text widget', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          {
            text: 'y',
          },
        ],
        templates,
        widgets: {
          TextWidget: TextWidgetTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      let errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessage = node.querySelector('#root_0_text__error .text-danger');
      expect(errorMessage).toHaveTextContent('Value must be "test"');

      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      errorMessages = node.querySelectorAll('#root_0_text__error');
      expect(errorMessages).toHaveLength(0);
    });
  });

  describe('Dynamic uiSchema.items function', () => {
    it('should support static uiSchema.items object for backward compatibility', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
        },
      };

      const uiSchema: UiSchema = {
        items: {
          name: {
            'ui:widget': 'textarea',
          },
        },
      };

      const formData = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const { node } = createFormComponent({ schema, uiSchema, formData });

      // Should render textareas for name fields based on static uiSchema
      const textareas = node.querySelectorAll('textarea');
      expect(textareas).toHaveLength(2);
    });

    it('should call dynamic uiSchema.items function with correct parameters', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
          },
        },
      };

      const dynamicUiSchemaFunction = jest.fn((itemData) => {
        return {
          name: {
            'ui:widget': itemData.role === 'admin' ? 'textarea' : 'text',
          },
        };
      });

      const uiSchema: UiSchema = {
        items: dynamicUiSchemaFunction,
      };

      const formData = [
        { name: 'John', role: 'admin' },
        { name: 'Jane', role: 'user' },
      ];

      const formContext = { testContext: 'value' };

      createFormComponent({ schema, uiSchema, formData, formContext });

      // Should be called twice (once for each array item)
      expect(dynamicUiSchemaFunction).toHaveBeenCalledTimes(2);

      // Check first call
      expect(dynamicUiSchemaFunction).toHaveBeenNthCalledWith(1, { name: 'John', role: 'admin' }, 0, {
        testContext: 'value',
      });

      // Check second call
      expect(dynamicUiSchemaFunction).toHaveBeenNthCalledWith(2, { name: 'Jane', role: 'user' }, 1, {
        testContext: 'value',
      });
    });

    it('should apply dynamic uiSchema correctly based on item data', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'normal', 'low'] },
          },
        },
      };

      const uiSchema: UiSchema = {
        items: (itemData) => {
          if (itemData.priority === 'high') {
            return {
              name: {
                'ui:widget': 'textarea',
                'ui:options': {
                  rows: 5,
                },
              },
              priority: {
                'ui:widget': 'select',
                'ui:classNames': 'priority-high',
              },
            };
          }
          return {
            name: {
              'ui:widget': 'text',
            },
          };
        },
      };

      const formData = [
        { name: 'Critical Task', priority: 'high' },
        { name: 'Regular Task', priority: 'normal' },
      ];

      const { node } = createFormComponent({ schema, uiSchema, formData });

      // First item should have textarea due to high priority
      const firstItemTextarea = node.querySelectorAll('.rjsf-array-item')[0].querySelector('textarea');
      expect(firstItemTextarea).toBeInTheDocument();
      expect(firstItemTextarea).toHaveAttribute('rows', '5');

      // Second item should have text input
      const secondItemInput = node.querySelectorAll('.rjsf-array-item')[1].querySelector('input[type="text"]');
      expect(secondItemInput).toBeInTheDocument();

      // High priority item should have custom className
      const highPrioritySelect = node.querySelector('.priority-high select');
      expect(highPrioritySelect).toBeInTheDocument();
    });

    it('should handle errors in dynamic uiSchema function gracefully', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      const consoleErrorStub = jest.spyOn(console, 'error');

      const uiSchema: UiSchema = {
        items: (_: any, index) => {
          if (index === 1) {
            throw new Error('Test error');
          }
          return {
            name: {
              'ui:widget': 'textarea',
            },
          };
        },
      };

      const formData = [{ name: 'First' }, { name: 'Second' }, { name: 'Third' }];

      const { node } = createFormComponent({ schema, uiSchema, formData });

      // Should log error for second item
      expect(consoleErrorStub).toHaveBeenLastCalledWith(
        'Error executing dynamic uiSchema.items function for item at index 1:',
        expect.any(Error),
      );

      // All items should still render (with fallback for errored item)
      const arrayItems = node.querySelectorAll('.rjsf-array-item');
      expect(arrayItems).toHaveLength(3);

      // First and third items should have textareas
      expect(arrayItems[0].querySelector('textarea')).toBeInTheDocument();
      expect(arrayItems[2].querySelector('textarea')).toBeInTheDocument();

      // Second item should fall back to default text input
      expect(arrayItems[1].querySelector('input[type="text"]')).toBeInTheDocument();
      expect(arrayItems[1].querySelector('textarea')).not.toBeInTheDocument();

      consoleErrorStub.mockRestore();
    });

    it('should handle errors in dynamic uiSchema function gracefully for fixed arrays', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: [{ type: 'string' }, { type: 'string' }],
      };

      const consoleErrorStub = jest.spyOn(console, 'error');

      const uiSchema: UiSchema = {
        items: (_: any, index) => {
          if (index === 1) {
            throw new Error('Test error in fixed array');
          }
          return { 'ui:widget': 'textarea' };
        },
      };

      const formData = ['First', 'Second'];
      const { node } = createFormComponent({ schema, uiSchema, formData });

      // Should log error for second item
      expect(consoleErrorStub).toHaveBeenLastCalledWith(
        'Error executing dynamic uiSchema.items function for item at index 1:',
        expect.any(Error),
      );

      // All items should still render
      const arrayItems = node.querySelectorAll('.rjsf-array-item');
      expect(arrayItems).toHaveLength(2);

      // First item should have textarea
      expect(arrayItems[0].querySelector('textarea')).toBeInTheDocument();

      // Second item should fall back to default text input
      expect(arrayItems[1].querySelector('input[type="text"]')).toBeInTheDocument();
      expect(arrayItems[1].querySelector('textarea')).not.toBeInTheDocument();

      consoleErrorStub.mockRestore();
    });

    it('should handle falsy return values from dynamic uiSchema function', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            visible: { type: 'boolean' },
          },
        },
      };

      const uiSchema: UiSchema = {
        items: (itemData: any) => {
          // Return empty uiSchema for items where visible is false
          if (!itemData.visible) {
            return {};
          }
          return {
            name: {
              'ui:widget': 'textarea',
            },
          };
        },
      };

      const formData = [
        { name: 'Visible Item', visible: true },
        { name: 'Hidden Item', visible: false },
      ];

      const { node } = createFormComponent({ schema, uiSchema, formData });

      // Both items should render
      const arrayItems = node.querySelectorAll('.rjsf-array-item');
      expect(arrayItems).toHaveLength(2);

      // First item should have textarea
      expect(arrayItems[0].querySelector('textarea')).toBeInTheDocument();

      // Second item should have default input (falsy return handled gracefully)
      expect(arrayItems[1].querySelector('input[type="text"]')).toBeInTheDocument();
      expect(arrayItems[1].querySelector('textarea')).not.toBeInTheDocument();
    });

    it('should work with empty arrays', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      const dynamicUiSchemaFunction = jest.fn(() => ({
        name: {
          'ui:widget': 'textarea',
        },
      }));

      const uiSchema: UiSchema = {
        items: dynamicUiSchemaFunction,
      };

      const formData: any[] = [];

      const { node } = createFormComponent({ schema, uiSchema, formData });

      // Function should not be called for empty array
      expect(dynamicUiSchemaFunction).toHaveBeenCalledTimes(0);

      // Should still render the add button
      const addButton = node.querySelector('.rjsf-array-item-add button');
      expect(addButton).toBeInTheDocument();
    });

    it('should update dynamically when array items are added', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      let callCount = 0;
      const uiSchema: UiSchema = {
        items: (_: any, index) => {
          callCount++;
          return {
            name: {
              'ui:widget': 'textarea',
              'ui:placeholder': `Item ${index + 1}`,
            },
          };
        },
      };

      const formData = [{ name: 'First' }];

      const { node } = createFormComponent({ schema, uiSchema, formData });

      // Initial render should call function once
      expect(callCount).toEqual(1);

      // Add a new item
      const addButton = node.querySelector('.rjsf-array-item-add button');
      act(() => {
        fireEvent.click(addButton!);
      });

      // Should now have called function for both items (3 total: 1 initial + 2 for re-render)
      expect(callCount).toBeGreaterThanOrEqual(3);

      // Check placeholders are set correctly
      const textareas = node.querySelectorAll('textarea');
      expect(textareas).toHaveLength(2);
      expect(textareas[0].placeholder).toEqual('Item 1');
      expect(textareas[1].placeholder).toEqual('Item 2');
    });

    it('should work with nested arrays', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      };

      const uiSchema: UiSchema = {
        items: (_: any, index) => ({
          title: {
            'ui:widget': index === 0 ? 'textarea' : 'text',
          },
          tags: {
            items: {
              'ui:widget': 'text',
              'ui:placeholder': 'Tag',
            },
          },
        }),
      };

      const formData = [
        { title: 'First Post', tags: ['react', 'form'] },
        { title: 'Second Post', tags: ['javascript'] },
      ];

      const { node } = createFormComponent({ schema, uiSchema, formData });

      // First item title should be textarea
      const firstItemTitle = node
        .querySelectorAll('.rjsf-array-item')[0]
        .querySelector('.rjsf-field-object .rjsf-field-string:first-of-type textarea');
      expect(firstItemTitle).toBeInTheDocument();

      // Second item title should be text input
      const secondItemTitle = node
        .querySelectorAll('.rjsf-array-item')[1]
        .querySelector('.rjsf-field-object .rjsf-field-string:first-of-type input[type="text"]');
      expect(secondItemTitle).toBeInTheDocument();

      // Verify that tag inputs exist
      const tagInputs = node.querySelectorAll('.rjsf-field-array .rjsf-field-array input[type="text"]');
      expect(tagInputs.length).toBeGreaterThanOrEqual(3); // 2 tags in first item + 1 tag in second item
    });
  });
});
