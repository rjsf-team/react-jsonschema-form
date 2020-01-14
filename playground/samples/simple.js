let optionsForMultiSelect = [];
let optionsForSingleSelect = [];
module.exports = {
  schema: {
    title: "A <b>registration</b> form",
    description: "A <b>simple</b> form example.",
    type: "object",
    required: ["firstName", "lastName"],
    properties: {
      HeyThere: {
        type: "description",
        title: "Good evening",
      },
      DOB: {
        type: "string",
        format: "date-time",
        title: "DOB",
      },
      integerRangeSteps: {
        title: "Integer range (by 10)",
        type: "integer",
        minimum: 0,
        maximum: 10,
        multipleOf: 1,
      },
      VisitDate: {
        type: "string",
        format: "date-time",
        title: "Visit Date & Time",
      },
      blogs: {
        type: "integer",
        title: "Search Blogs",
        currentPageNumber: 1,
        pageSize: 10,
        loadOptionsCount: searchText => 10,
        isMultiselect: false,
        customClass: "async",
        // The col with primary set to true is the value which will be returned.
        // So make sure that the data type of that key matches with type specified.
        cols: [
          { name: "USER ID", key: "userId", hide: true },
          { name: "ID", key: "id", primary: true },
          { name: "Title", key: "title", displaySelected: true },
          { name: "Body", key: "body", hide: true },
        ],
        getSelectedOptionDetails: selectedPrimaryKey => {
          const result = {
            body:
              "quia et suscipit↵suscipit recusandae consequuntur expedita et cumreprehenderit molestiae ut ut quas totamnostrum rerum est autem sunt rem eveniet architecto",
            id: 2,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            userid: 1,
          };
          console.log("selectedPrimaryKey ==> ", selectedPrimaryKey);
          return result;
        },

        loadOptions: (searchText, pageNumber, pageSize) => {
          return fetch(`https://jsonplaceholder.typicode.com/posts`)
            .then(response => {
              return response.json();
            })
            .then(json => {
              const searched = json.filter(value =>
                value.title.toLowerCase().includes(searchText.toLowerCase())
              );
              const result = searched.splice(pageNumber * pageSize, pageSize);
              optionsForSingleSelect = optionsForSingleSelect.concat(result);
              return result;
            });
        },
        getChipDisplayText: selectedPrimaryKey => {
          let lookupString = "";
          optionsForSingleSelect.forEach(value => {
            if (value.id === selectedPrimaryKey) {
              lookupString = value.title;
            }
          });
          return lookupString + "(" + selectedPrimaryKey + ")";
        },
        onDeleteChoice: selectedValue => {
          console.log("Async select on delete called");
        },
        onSelectChoice: selectedValue => {
          console.log("Async select on select called");
        },
      },
      movie: {
        type: "string",
        title: "Search Movies",
        currentPageNumber: 1,
        pageSize: 10,
        loadOptionsCount: searchText => 100,
        isMultiselect: true,
        customClass: "asyncSelect",
        cols: [
          { name: "ID", key: "userId", hide: true },
          { name: "USER ID", key: "id", primary: true },
          { name: "Title", key: "title", displaySelected: true },
          { name: "Body", key: "body", hide: true },
        ],
        getSelectedOptionDetails: selectedPrimaryKey => {
          const result = {
            body:
              "quia et suscipit↵suscipit recusandae consequuntur expedita et cumreprehenderit molestiae ut ut quas totamnostrum rerum est autem sunt rem eveniet architecto",
            id: 2,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            userid: 1,
          };
          console.log("selectedPrimaryKey ==> ", selectedPrimaryKey);
          return result;
        },
        loadOptions: (searchText, pageNumber, pageSize) => {
          return fetch(`https://jsonplaceholder.typicode.com/posts`)
            .then(response => {
              return response.json();
            })
            .then(json => {
              const searched = json.filter(value =>
                value.title.includes(searchText.toLowerCase())
              );
              const result = searched.splice(pageNumber * pageSize, pageSize);
              optionsForMultiSelect = optionsForMultiSelect.concat(result);
              return result;
            });
        },
        getChipDisplayText: selectedPrimaryKey => {
          let lookupString = "";
          optionsForMultiSelect.forEach(value => {
            if (value.id === selectedPrimaryKey) {
              lookupString = value.title;
            }
          });
          return lookupString + "(" + selectedPrimaryKey + ")";
        },
        onDeleteChoice: selectedValue => {
          console.log("Async select on delete called");
        },
        onSelectChoice: selectedValue => {
          console.log("Async select on select called");
        },
      },
      firstName: {
        type: "string",
        title: "First name",
        default: "Chuck",
      },
      lastName: {
        type: "string",
        title: "Last name",
      },
      age: {
        type: "integer",
        title: "Age",
      },
      password: {
        type: "string",
        title: "Password",
        minLength: 3,
      },
      telephone: {
        type: "string",
        title: "Telephone",
        minLength: 10,
      },
    },
  },
  uiSchema: {
    DOB: {
      "ui:options": {
        disableFuture: true,
        formatPattern: "MM-DD-YYYY",
        format: "date",
        placeholder: "MM-DD-YYYY",
        disableOpenOnEnter: true,
        animateYearScrolling: false,
        renderDateTimePickerAsDatePicker: true,
        invalidLabel: "",
        keyboard: true,
        convertDateTimeToUtc: false,
        clearable: true,
      },
      classNames: "formControlGroup",
    },
    integerRangeSteps: {
      "ui:widget": "range",
    },
    VisitDate: {
      "ui:options": {
        disableFuture: true,
        minDate: "2019-01-01",
        maxDate: "2019-12-31",
        ampm: false,
        formatPattern: "MM-DD-YYYY HH:mm",
        format: "date-time",
        placeholder: "MM-DD-YYYY HH:mm",
        disableOpenOnEnter: true,
        animateYearScrolling: false,
        invalidLabel: "",
        keyboard: true,
        convertDateTimeToUtc: true,
        clearable: false,
      },
      classNames: "formControlGroup",
    },
    blogs: {
      "ui:emptyValue": "",
      "ui:placeholder": "Type your choice to search...",
      "ui:widget": "asyncMultiselectDropdown",
      "ui:disabled": false
    },
    movie: {
      "ui:emptyValue": "",
      "ui:placeholder": "Type your choice to search....",
      "ui:widget": "asyncMultiselectDropdown",
      "ui:disabled": false
    },
    firstName: {
      "ui:emptyValue": "",
    },
    age: {
      "ui:widget": "updown",
      "ui:title": "Age of <i>person</i>",
      "ui:description": "(earthian year)",
    },
    password: {
      "ui:widget": "password",
      "ui:help": "<i>Hint: Make it strong!</i>",
    },
    telephone: {
      "ui:options": {
        inputType: "tel",
      },
    },
  },
  formData: {
    blogs: 2,
    movie: "[2]",
    lastName: "Norris",
    integerRangeSteps: 3,
    age: 75,
    password: "noneed",
  },
};
