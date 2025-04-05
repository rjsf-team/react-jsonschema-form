import { Sample } from './Sample';

const nested: Sample = {
  schema: {
    title: 'A list of tasks',
    type: 'object',
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        title: 'Task list title',
      },
      tasks: {
        type: 'array',
        title: 'Tasks',
        items: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              title: 'Title',
              description: 'A sample title',
            },
            details: {
              type: 'string',
              title: 'Task details',
              description: 'Enter the task details',
            },
            done: {
              type: 'boolean',
              title: 'Done?',
              default: false,
            },
          },
        },
      },
    },
  },
  uiSchema: {
    title: {
      'ui:placeholder': 'Enter a title for your task list',
      'ui:className': 'font-semibold',
    },
    tasks: {
      'ui:description': 'Add your tasks below',
      items: {
        title: {
          'ui:placeholder': 'What needs to be done?',
          'ui:className': 'font-semibold',
        },
        details: {
          'ui:widget': 'textarea',
          'ui:placeholder': 'Additional details about this task...',
          'ui:options': {
            rows: 3,
          },
        },
        done: {
          'ui:widget': 'checkbox',
          'ui:options': {
            label: false, // Prevents double labeling
          },
        },
        'ui:order': ['title', 'details', 'done'],
      },
    },
  },
  formData: {
    title: 'My current tasks',
    tasks: [
      {
        title: 'My first task',
        details:
          'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        done: true,
      },
      {
        title: 'My second task',
        details:
          'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
        done: false,
      },
    ],
  },
};

export default nested;
