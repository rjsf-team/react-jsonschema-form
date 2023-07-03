export default {
  schema: {
    title: 'A registration form',
    description: 'A custom-field form example.',
    type: 'object',
    definitions: {
      specialString: {
        $id: '/schemas/specialString',
        type: 'string',
      },
    },
    properties: {
      mySpecialStringField: {
        $ref: '#/definitions/specialString',
      },
      mySpecialStringArray: {
        type: 'array',
        items: {
          $ref: '#/definitions/specialString',
        },
      },
    },
  },
  uiSchema: {},
  formData: {
    mySpecialStringField: 'special-text',
  },
};
