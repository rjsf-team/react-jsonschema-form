module.exports = {
  schema: {
    title: "Fluent UI demo 3",
    type: "object",
    required: ["title"],
    properties: {
      title: {
        type: "string",
        title: "Task list title",
      },
      tasks: {
        type: "array",
        title: "Tasks",
        items: {
          type: "object",
          required: ["title"],
          properties: {
            title: {
              type: "string",
              title: "Title",
              description: "A sample title",
            },
            details: {
              type: "string",
              title: "Task details",
              description: "Enter the task details",
            },
            done: {
              type: "boolean",
              title: "Done?",
              default: false,
            },
          },
        },
      },
      boolean: {
        type: "object",
        title: "Boolean field",
        properties: {
          radio: {
            type: "boolean",
            title: "radio buttons",
            description: "This is the radio-description",
          },
          select: {
            type: "boolean",
            title: "select box",
            description: "This is the select-description",
          },
        },
      },
      native: {
        title: "Native",
        description:
          "May not work on some browsers, notably Firefox Desktop and IE.",
        type: "object",
        properties: {
          datetime: {
            type: "string",
            format: "date-time",
          },
          date: {
            type: "string",
            format: "date",
          },
        },
      },
    },
  },
  uiSchema: {
    tasks: {
      items: {
        details: {
          "ui:widget": "textarea",
        },
      },
    },
    boolean: {
      radio: {
        "ui:widget": "radio",
      },
      select: {
        "ui:widget": "select",
      },
    },
  },
  formData: {
    title: "My current tasks",
    tasks: [
      {
        title: "My first task",
        details:
          "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        done: true,
      },
      {
        title: "My second task",
        details:
          "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur",
        done: false,
      },
    ],
    boolean: {
      radio: true,
    },
  },
};
