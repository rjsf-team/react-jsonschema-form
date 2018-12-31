module.exports = {
  schema: {
    title: "Date and time widgets",
    type: "object",
    properties: {
      native: {
        title: "Native",
        description: "Material UI datetime and date pickers.",
        type: "object",
        properties: {
          datetime: {
            type: "string",
            format: "date-time",
          },
          DateTimePickerAsDatePicker: {
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
    native: {
      datetime: {
        "ui:options": {
          disableFuture: true,
          clearable: true,
          keyboard: true,
          formatPattern: "MM-DD-YYYY hh:mm",
          format: "date-time",
          placeholder: "10-10-2018 22:10",
          disableOpenOnEnter: true,
          animateYearScrolling: false,
          invalidLabel: " ",
        },
      },
      DateTimePickerAsDatePicker: {
        "ui:options": {
          disableFuture: true,
          clearable: true,
          keyboard: true,
          formatPattern: "MM-DD-YYYY",
          format: "date",
          placeholder: "10-10-2018",
          disableOpenOnEnter: true,
          animateYearScrolling: false,
          renderDateTimePickerAsDatePicker: true,
          invalidLabel: " ",
        },
      },
      date: {
        "ui:options": {
          disableFuture: true,
          clearable: true,
          keyboard: true,
          formatPattern: "MM-DD-YYYY",
          format: "date",
          placeholder: "10-10-2018",
          disableOpenOnEnter: true,
          animateYearScrolling: false,
          renderDateTimePickerAsDatePicker: false,
          invalidLabel: " ",
        },
      },
    },
  },
  formData: {},
};
