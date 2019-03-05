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
          minDate: "2019-01-01",
          formatPattern: "MM-DD-YYYY hh:mm",
          format: "date-time",
          placeholder: "10-10-2018 22:10",
          disableOpenOnEnter: true,
          animateYearScrolling: false,
          invalidLabel: "",
          invalidDateMessage: false,
          clearable: true,
          keyboard: true,
          // setDateTimeToEndOf: "day",
        },
      },
      DateTimePickerAsDatePicker: {
        "ui:options": {
          disableFuture: true,
          minDate: "2018-12-01",
          formatPattern: "MM-DD-YYYY",
          format: "date",
          placeholder: "10-10-2018",
          disableOpenOnEnter: true,
          animateYearScrolling: false,
          renderDateTimePickerAsDatePicker: true,
          invalidLabel: "",
          invalidDateMessage: false,
          clearable: true,
          keyboard: true,
          // setDateTimeToEndOf: "day",
        },
      },
      date: {
        "ui:options": {
          disableFuture: true,
          formatPattern: "MM-DD-YYYY",
          format: "date",
          placeholder: "10-10-2018",
          disableOpenOnEnter: true,
          animateYearScrolling: false,
          renderDateTimePickerAsDatePicker: false,
          invalidLabel: "",
          invalidDateMessage: false,
          clearable: true,
          keyboard: true,
        },
      },
    },
  },
  formData: {
    native: {
      DateTimePickerAsDatePicker: "2019-01-03T00:00:00.000Z",
    },
  },
};
