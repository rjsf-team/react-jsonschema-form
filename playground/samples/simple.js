module.exports = {
  schema: {
    title: "A <b>registration</b> form",
    description: "A <b>simple</b> form example.",
    type: "object",
    required: ["firstName", "lastName"],
    properties: {
      blogs: {
        type: "string",
        title: "Search Movies",
        currentPageNumber: 1,
        pageSize: 5,
        loadOptionsCount: searchText => 50,
        isMultiselect: false,
        // The col with primary set to true is the value which will be returned.
        // So make sure that the data type of that key matches with type specified.
        cols: [
          { name: "USER ID", key: "userId", hide: true },
          { name: "ID", key: "id", displaySelected: true },
          { name: "Title", key: "title", primary: true },
          { name: "Body", key: "body", hide: true },
        ],
        selectedOptions: [],
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
        },
      },
      movie: {
        type: "string",
        title: "Search Movies",
        currentPageNumber: 1,
        pageSize: 5,
        loadOptionsCount: searchText => 50,
        isMultiselect: true,
        cols: [
          { name: "ID", key: "userId" },
          { name: "USER ID", key: "id" },
          { name: "Title", key: "title", primary: true },
          { name: "Body", key: "body" },
        ],
        selectedOptions: [],
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
        },
        onSelect: currentSelectedOption => {
          console.log("currentSelectedOption111 ==> ", currentSelectedOption);
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
    blogs: {
      "ui:autofocus": true,
      "ui:emptyValue": "",
      "ui:placeholder": "Type your choice to search....",
      "ui:widget": "asyncMultiselectDropdown",
    },
    movie: {
      "ui:autofocus": true,
      "ui:emptyValue": "",
      "ui:placeholder": "Type your choice to search....",
      "ui:widget": "asyncMultiselectDropdown",
    },
    firstName: {
      "ui:autofocus": true,
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
    lastName: "Norris",
    age: 75,
    password: "noneed",
  },
};
