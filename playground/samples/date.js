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
          maxDate: "2019-12-31",
          formatPattern: "MM-DD-YYYY HH:mm",
          ampm: false,
          format: "date-time",
          placeholder: "MM-DD-YYYY HH:mm",
          disableOpenOnEnter: true,
          animateYearScrolling: false,
          invalidLabel: "",
          convertDateTimeToUtc: true,
          clearable: false,
          minDateMessage: "",
          maxDateMessage: "",
        },
      },
      DateTimePickerAsDatePicker: {
        "ui:options": {
          disableFuture: true,
          minDate: "1900-01-01",
          formatPattern: "MM-DD-YYYY",
          format: "date",
          placeholder: "MM-DD-YYYY",
          disableOpenOnEnter: true,
          animateYearScrolling: false,
          renderDateTimePickerAsDatePicker: true,
          invalidLabel: "",
          keyboard: true,
          convertDateTimeToUtc: true,
          clearable: false,
          minDateMessage: "",
          maxDateMessage: "",
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
          // invalidDateMessage: false,
          clearable: true,
          keyboard: false,
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
