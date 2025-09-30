import { Sample } from './Sample';

const widgets: Sample = {
  schema: {
    title: 'Widgets',
    type: 'object',
    properties: {
      stringFormats: {
        type: 'object',
        title: 'String formats',
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          uri: {
            type: 'string',
            format: 'uri',
          },
        },
      },
      boolean: {
        type: 'object',
        title: 'Boolean field',
        properties: {
          default: {
            type: 'boolean',
            title: 'checkbox (default)',
            description: 'This is the checkbox-description',
          },
          radio: {
            type: 'boolean',
            title: 'radio buttons',
            description: 'This is the radio-description',
          },
          select: {
            type: 'boolean',
            title: 'select box',
            description: 'This is the select-description',
          },
        },
      },
      string: {
        type: 'object',
        title: 'String field',
        properties: {
          default: {
            type: 'string',
            title: 'text input (default)',
          },
          textarea: {
            type: 'string',
            title: 'textarea',
          },
          placeholder: {
            type: 'string',
          },
          color: {
            type: 'string',
            title: 'color picker',
            default: '#151ce6',
          },
        },
      },
      customWidgets: {
        type: 'object',
        title: 'Custom widgets',
        properties: {
          rating: {
            type: 'integer',
            title: 'Rating (Stars - Default)',
            description: 'Rate this from 1 to 5 stars',
            minimum: 1,
            maximum: 5,
            default: 3,
          },
          ratingCustomStars: {
            type: 'integer',
            title: 'Rating (3 stars)',
            description: 'Custom number of stars example',
            minimum: 1,
            maximum: 3,
            default: 2,
          },
          ratingHearts: {
            type: 'integer',
            title: 'Rating (Hearts)',
            description: 'Hearts instead of stars',
            minimum: 1,
            maximum: 5,
            default: 3,
          },
          ratingColor: {
            type: 'integer',
            title: 'Rating (Green stars)',
            description: 'Custom color example',
            minimum: 1,
            maximum: 5,
            default: 4,
          },
          ratingGradient: {
            type: 'integer',
            title: 'Rating (Color gradient)',
            description: 'Stars with gradient colors',
            minimum: 1,
            maximum: 5,
            default: 3,
          },
          ratingSize: {
            type: 'integer',
            title: 'Rating (Large size)',
            description: 'Stars with larger size',
            minimum: 1,
            maximum: 5,
            default: 3,
          },
          ratingSmall: {
            type: 'integer',
            title: 'Rating (Small size)',
            description: 'Stars with smaller size',
            minimum: 1,
            maximum: 5,
            default: 3,
          },
        },
      },
      secret: {
        type: 'string',
        default: "I'm a hidden string.",
      },
      disabled: {
        type: 'string',
        title: 'A disabled field',
        default: 'I am disabled.',
      },
      readonly: {
        type: 'string',
        title: 'A readonly field',
        default: 'I am read-only.',
      },
      readonly2: {
        type: 'string',
        title: 'Another readonly field',
        default: 'I am also read-only.',
        readOnly: true,
      },
      widgetOptions: {
        title: 'Custom widget with options',
        type: 'string',
        default: 'I am yellow',
      },
      selectWidgetOptions: {
        title: 'Custom select widget with options',
        type: 'string',
        enum: ['foo', 'bar'],
      },
      selectWidgetOptions2: {
        title: 'Custom select widget with options, overriding the enum titles.',
        type: 'string',
        oneOf: [
          {
            const: 'foo',
            title: 'Foo',
          },
          {
            const: 'bar',
            title: 'Bar',
          },
        ],
      },
    },
  },
  uiSchema: {
    boolean: {
      'ui:widget': 'toggle',
    },
    string: {
      'ui:widget': 'textarea',
    },
    customWidgets: {
      rating: {
        'ui:widget': 'RatingWidget',
      },
      ratingCustomStars: {
        'ui:widget': 'RatingWidget',
        'ui:options': {
          stars: 3,
        },
      },
      ratingHearts: {
        'ui:widget': 'RatingWidget',
        'ui:options': {
          shape: 'heart',
          color: 'red',
        },
      },
      ratingColor: {
        'ui:widget': 'RatingWidget',
        'ui:options': {
          color: 'green',
        },
      },
      ratingGradient: {
        'ui:widget': 'RatingWidget',
        'ui:options': {
          colorGradient: true,
        },
      },
      ratingSize: {
        'ui:widget': 'RatingWidget',
        'ui:options': {
          size: 'lg',
        },
      },
      ratingSmall: {
        'ui:widget': 'RatingWidget',
        'ui:options': {
          size: 'xs',
        },
      },
    },
    secret: {
      'ui:widget': 'hidden',
    },
    disabled: {
      'ui:disabled': true,
    },
    readonly: {
      'ui:readonly': true,
    },
    widgetOptions: {
      'ui:widget': ({
        value,
        onChange,
        options,
      }: {
        value: any;
        onChange: (value: any) => void;
        options: { backgroundColor: string };
      }) => {
        const { backgroundColor } = options;
        return (
          <input
            className='form-control'
            onChange={(event) => onChange(event.target.value)}
            style={{ backgroundColor }}
            value={value}
          />
        );
      },
      'ui:options': {
        backgroundColor: 'yellow',
      },
    },
    selectWidgetOptions: {
      'ui:widget': ({
        value,
        onChange,
        options,
      }: {
        value: any;
        onChange: (value: any) => void;
        options: { enumOptions: { label: string; value: any }[]; backgroundColor: string };
      }) => {
        const { enumOptions, backgroundColor } = options;
        return (
          <select
            className='form-control'
            style={{ backgroundColor }}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            {enumOptions.map(({ label, value }, i) => {
              return (
                <option key={i} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        );
      },
      'ui:options': {
        backgroundColor: 'pink',
      },
    },
  },
  formData: {
    stringFormats: {
      email: 'chuck@norris.net',
      uri: 'http://chucknorris.com/',
    },
    boolean: {
      default: true,
      radio: true,
      select: true,
    },
    string: {
      default: 'Hello...',
      textarea: '... World',
    },
    customWidgets: {
      rating: 3,
      ratingCustomStars: 2,
      ratingHearts: 3,
      ratingColor: 4,
      ratingGradient: 3,
      ratingSize: 3,
      ratingSmall: 3,
    },
    secret: "I'm a hidden string.",
  },
};

export default widgets;
