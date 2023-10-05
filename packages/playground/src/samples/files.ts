import { Sample } from './Sample';

const files: Sample = {
  schema: {
    title: 'Files',
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'data-url',
        title: 'Single file',
      },
      files: {
        type: 'array',
        title: 'Multiple files',
        items: {
          type: 'string',
          format: 'data-url',
        },
      },
      filesAccept: {
        type: 'string',
        format: 'data-url',
        title: 'Single File with Accept attribute',
      },
    },
  },
  uiSchema: {
    filesAccept: {
      'ui:options': { accept: '.pdf' },
    },
  },
  formData: {},
};

export default files;
