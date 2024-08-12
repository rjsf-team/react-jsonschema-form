import '../../main.css';
import type { Meta, StoryObj } from '@storybook/react';
import BaseInputTemplate from './index';

const meta: Meta<typeof BaseInputTemplate> = {
  title: 'BaseInputTemplate',
  component: BaseInputTemplate,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: {},
    schema: {
      type: 'string',
      title: 'First name',
      default: 'Chuck',
    },
    uiSchema: {},
    id: 'root',
    name: '',
    label: 'First name',
    hideLabel: false,
    value: '',
    disabled: false,
    readonly: false,
    formContext: {},
    autofocus: false,
    placeholder: '',
  },
};
