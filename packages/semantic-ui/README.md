[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![Apache 2.0 License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <img src="https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/semantic-ui/logo.png" alt="Logo" width="120" height="120">
  </a>

  <h3 align="center">rjsf-semantic-ui</h3>

  <p align="center">
  Semantic UI theme, fields and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
    <br />
    <a href="https://rjsf-team.github.io/react-jsonschema-form/docs/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://rjsf-team.github.io/react-jsonschema-form/">View Playground</a>
    ·
    <a href="https://github.com/rjsf-team/react-jsonschema-form/issues">Report Bug</a>
    ·
    <a href="https://github.com/rjsf-team/react-jsonschema-form/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [Table of Contents](#table-of-contents)
- [About The Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Optional Semantic UI Theme properties](#optional-semantic-ui-theme-properties)
  - [Semantic Widget Optional Properties](#semantic-widget-optional-properties)
  - [Custom Semantic Widget Properties](#custom-semantic-widget-properties)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

Exports `semantic-ui` theme, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [Semantic UI](https://react.semantic-ui.com/)

<!-- GETTING STARTED -->

## Getting Started

- See the [getting started guide](https://react.semantic-ui.com/usage) on react-semantic-ui.

### Prerequisites

- `@semantic-ui-react >= 0.87.0`
- `@semantic-ui-css >= 2.4.1` ([default theme for semantic-ui](https://github.com/Semantic-Org/Semantic-UI-CSS)); see [theming guide](https://react.semantic-ui.com/theming) if you wish to customize
- `@rjsf/core >= 2.0.0`

```sh
yarn add semantic-ui-css semantic-ui-react @rjsf/core
```

### Installation

```sh
yarn add @rjsf/semantic-ui
```

<!-- USAGE EXAMPLES -->

## Usage

```javascript
import Form from '@rjsf/semantic-ui';
```

or

```javascript
import { withTheme } from '@rjsf/core';
import { Theme as SemanticUITheme } from '@rjsf/semantic-ui';

// Make modifications to the theme with your own fields and widgets

const Form = withTheme(SemanticUITheme);
```

## Optional Semantic UI Theme properties

- To pass additional properties to widgets, see this [guide](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/objects#additional-properties).

#### Semantic Widget Optional Properties

- [Semantic props for TextWidget](https://react.semantic-ui.com/elements/input/)
- [Semantic props for CheckboxWidget](https://react.semantic-ui.com/modules/checkbox/)
- [Semantic props for SelectWidget](https://react.semantic-ui.com/modules/dropdown/)
- [Semantic props for RangeWidget](https://react.semantic-ui.com/elements/input/)
- [Semantic props for RadioWidget](https://react.semantic-ui.com/addons/radio/)
- [Semantic props for PasswordWidget](https://react.semantic-ui.com/elements/input/)
- [Semantic props for UpDownWidget](https://react.semantic-ui.com/elements/input/)
- [Semantic props for TextAreaWidget](https://react.semantic-ui.com/addons/text-area/)

#### Custom Semantic Widget Properties

Below are the current default options for all widgets:

```json
{
  "ui:options": {
    "semantic": {
      "fluid": true,
      "inverted": false,
      "errorOptions": {
        "size": "small",
        "pointing": "above"
      }
    }
  }
}
```

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/rjsf-team/react-jsonschema-form/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Read our [contributors' guide](https://rjsf-team.github.io/react-jsonschema-form/docs/contributing/) to get started.

<!-- CONTACT -->

## Contact

rjsf team: [https://github.com/orgs/rjsf-team/people](https://github.com/orgs/rjsf-team/people)

GitHub repository: [https://github.com/rjsf-team/react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[build-shield]: https://github.com/rjsf-team/react-jsonschema-form/workflows/CI/badge.svg
[build-url]: https://github.com/rjsf-team/react-jsonschema-form/actions
[contributors-shield]: https://img.shields.io/github/contributors/rjsf-team/react-jsonschema-form.svg
[contributors-url]: https://github.com/rjsf-team/react-jsonschema-form/graphs/contributors
[license-shield]: https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square
[license-url]: https://choosealicense.com/licenses/apache-2.0/
[npm-shield]: https://img.shields.io/npm/v/@rjsf/semantic-ui/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/semantic-ui
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/semantic-ui.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/semantic-ui
[product-screenshot]: https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/semantic-ui/screenshot.png
