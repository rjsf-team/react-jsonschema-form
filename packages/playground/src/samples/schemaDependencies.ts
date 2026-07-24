import type { Sample } from './Sample';

const schemaDependencies: Sample = {
  schema: {
    title: 'Schema dependencies',
    description: 'These samples are best viewed without live validation.',
    type: 'object',
    properties: {
      billingDetails: {
        title: 'Billing details',
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          credit_card: {
            type: 'number',
          },
        },
        required: ['name'],
        dependencies: {
          credit_card: {
            properties: {
              billing_address: {
                type: 'string',
              },
            },
            required: ['billing_address'],
          },
        },
      },
      petOwner: {
        title: 'Pet owner',
        $ref: '#/definitions/person',
      },
      petOwners: {
        title: 'Pet owners',
        type: 'array',
        items: {
          $ref: '#/definitions/person',
        },
      },
      householdMembers: {
        title: 'Household members',
        type: 'array',
        items: [
          {
            title: 'Primary person',
            $ref: '#/definitions/person',
          },
        ],
        additionalItems: {
          title: 'Additional person',
          $ref: '#/definitions/person',
        },
      },
    },
    definitions: {
      person: {
        title: 'Person',
        type: 'object',
        properties: {
          'Do you have any pets?': {
            type: 'string',
            enum: ['No', 'Yes: One', 'Yes: More than one'],
            default: 'No',
          },
        },
        required: ['Do you have any pets?'],
        dependencies: {
          'Do you have any pets?': {
            oneOf: [
              {
                properties: {
                  'Do you have any pets?': {
                    enum: ['No'],
                  },
                },
              },
              {
                properties: {
                  'Do you have any pets?': {
                    enum: ['Yes: One'],
                  },
                  'How old is your pet?': {
                    type: 'number',
                  },
                },
                required: ['How old is your pet?'],
              },
              {
                properties: {
                  'Do you have any pets?': {
                    enum: ['Yes: More than one'],
                  },
                  'Do you want to get rid of any?': {
                    type: 'boolean',
                  },
                },
                required: ['Do you want to get rid of any?'],
              },
            ],
          },
        },
      },
    },
  },
  uiSchema: {
    billingDetails: {
      credit_card: {
        'ui:help': 'If you enter anything here then billing_address will be dynamically added to the form.',
      },
    },
    petOwner: {
      'Do you want to get rid of any?': {
        'ui:widget': 'radio',
      },
    },
    petOwners: {
      items: {
        'Do you want to get rid of any?': {
          'ui:widget': 'radio',
        },
      },
    },
    householdMembers: {
      items: {
        'Do you want to get rid of any?': {
          'ui:widget': 'radio',
        },
      },
      additionalItems: {
        'Do you want to get rid of any?': {
          'ui:widget': 'radio',
        },
      },
    },
  },
  formData: {
    billingDetails: {
      name: 'Randy',
    },
    petOwner: {
      'Do you have any pets?': 'No',
    },
    petOwners: [
      {
        'Do you have any pets?': 'Yes: One',
        'How old is your pet?': 6,
      },
      {
        'Do you have any pets?': 'Yes: More than one',
        'Do you want to get rid of any?': false,
      },
    ],
    householdMembers: [
      {
        'Do you have any pets?': 'No',
      },
      {
        'Do you have any pets?': 'Yes: One',
        'How old is your pet?': 6,
      },
      {
        'Do you have any pets?': 'Yes: More than one',
        'Do you want to get rid of any?': true,
      },
    ],
  },
};

export default schemaDependencies;
