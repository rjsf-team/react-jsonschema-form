module.exports = {
  schema: {
    title: "A <b>registration</b> form",
    description: "A <b>simple</b> form example.",
    type: "object",
    required: ["firstName", "lastName"],
    properties: {
      DOB: {
        type: "string",
        format: "date-time",
        title: "DOB"
      },
      VisitDate: {
        type: "string",
        format: "date-time",
        title: "Visit Date & Time"
      },
      blogs: {
        type: "integer",
        title: "Search Blogs",
        currentPageNumber: 1,
        pageSize: 10,
        loadOptionsCount: searchText => 100,
        isMultiselect: false,
        customClass: "async",
        // The col with primary set to true is the value which will be returned.
        // So make sure that the data type of that key matches with type specified.
        cols: [
          { name: "USER ID", key: "userId", hide: true },
          { name: "ID", key: "id", primary: true },
          { name: "Title", key: "title", displaySelected: true },
          { name: "Body", key: "body", hide: true }
        ],
        selectedOptions: [
          {
            body:
              "quia et suscipit↵suscipit recusandae consequuntur expedita et cumreprehenderit molestiae ut ut quas totamnostrum rerum est autem sunt rem eveniet architecto",
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            userid: 1
          }
        ],
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
              return result;
            });
        }
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
          { name: "Body", key: "body", hide: true }
        ],
        selectedOptions: [
          {
            body:
              "quia et suscipit↵suscipit recusandae consequuntur expedita et cumreprehenderit molestiae ut ut quas totamnostrum rerum est autem sunt rem eveniet architecto",
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            userid: 1
          }
        ],
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
              return result;
            });
        }
      },
      firstName: {
        type: "string",
        title: "First name",
        default: "Chuck"
      },
      lastName: {
        type: "string",
        title: "Last name"
      },
      age: {
        type: "integer",
        title: "Age"
      },
      password: {
        type: "string",
        title: "Password",
        minLength: 3
      },
      telephone: {
        type: "string",
        title: "Telephone",
        minLength: 10
      }
    }
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
        clearable: true,
        keyboard: true
      },
      classNames: "formControlGroup",
    },
    VisitDate: {
      "ui:options": {
        disableFuture: true,
        minDate: "2019-01-01",
        maxDate: "2019-12-31",
        ampm: false,
        formatPattern: "MM-DD-YYYY hh:mm",
        format: "date-time",
        placeholder: "MM-DD-YYYY hh:mm",
        disableOpenOnEnter: true,
        animateYearScrolling: false,
        invalidLabel: "",
        clearable: true,
        keyboard: true
      },
      classNames: "formControlGroup",
    },
    blogs: {
      "ui:emptyValue": "",
      "ui:placeholder": "Type your choice to search...",
      "ui:widget": "asyncMultiselectDropdown"
    },
    movie: {
      "ui:emptyValue": "",
      "ui:placeholder": "Type your choice to search....",
      "ui:widget": "asyncMultiselectDropdown"
    },
    firstName: {
      "ui:emptyValue": ""
    },
    age: {
      "ui:widget": "updown",
      "ui:title": "Age of <i>person</i>",
      "ui:description": "(earthian year)"
    },
    password: {
      "ui:widget": "password",
      "ui:help": "<i>Hint: Make it strong!</i>"
    },
    telephone: {
      "ui:options": {
        inputType: "tel"
      }
    }
  },
  formData: {
    lastName: "Norris",
    age: 75,
    password: "noneed"
  }
};
