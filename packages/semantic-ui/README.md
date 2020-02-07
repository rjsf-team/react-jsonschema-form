<!--
*** Thanks for checking out this README Template. If you have a suggestion that would
*** make this better please fork the repo and create a pull request or simple open
*** an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
-->

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for build-url, contributors-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Build Status](https://travis-ci.org/mozilla-services/react-jsonschema-form.svg?branch=master)](https://travis-ci.org/mozilla-services/react-jsonschema-form)
![Contributors][contributors-shield]
![MIT License][license-shield]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://react.semantic-ui.com/">
    <img src="https://react.semantic-ui.com/logo.png" alt="Logo" width="140" height="120">
  </a>

  <h3 align="center">rjsf-semantic-ui</h3>

  <p align="center">
  Semantic-UI theme, fields and widgets for <a href="https://github.com/mozilla-services/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
    <br />
    <a href="https://github.com/rjsf-team/react-jsonschema-form/tree/master/packages/semantic-ui/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://rjsf-team.github.io/react-jsonschema-form/">View Playground</a>
    ·
    <a href="https://github.com/Semantic-Org/Semantic-UI-React/issues/new?template=Bug_report.md">Report Bug</a>
       ·
       <a href="https://github.com/Semantic-Org/Semantic-UI-React/issues/new?template=Feature_request.md">Request Feature</a>
  </p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [optional semantic ui properties](#optional-semntic-ui-properties) 
- [Road map](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

Exports `semantic-ui` theme, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form/)
- [Semantic-UI](https://react.semantic-ui.com/)

<!-- GETTING STARTED -->

## Getting Started

- see [getting started guide](https://react.semantic-ui.com/usage) on react-semantic-ui

### Prerequisites

- `@semantic-ui-react >= 0.83.0` ([V0.83.0](https://github.com/Semantic-Org/Semantic-UI-React/releases/tag/v0.83.0))
- `@semantic-ui-css >= 2.4.1` ([default theme for semantic-ui](https://github.com/Semantic-Org/Semantic-UI-CSS))
- see [theming guide](https://react.semantic-ui.com/theming) if you wish to customize
- `react-jsonschema-form >= 1.6.0` ([in 1.6.0, the `withTheme` HOC was added](https://github.com/mozilla-services/react-jsonschema-form/pull/1226))

```sh
yarn add semantic-ui-css add semantic-ui-react react-jsonschema-form
```

### Installation

```sh
yarn add semantic-ui-react
```

<!-- USAGE EXAMPLES -->

## Usage

```javascript
import { withTheme } from 'react-jsonschema-form';
import { Theme as SemanticUITheme } from 'rjsf-semanitc-ui';

const Form = withTheme(SemanticUITheme);
```

or

```javascript
import SemanticUIForm from 'rjsf-semantic-ui';
```

##Optional Semantic-UI Theme properties
- To pass additional properties to widgets see [guide](https://react-jsonschema-form.readthedocs.io/en/latest/form-customization/#object-additional-properties).
 
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
 - ``displayError`` - hides error or validation message below field.
```javascript
const uiSchema = {
  "ui:options":  {
    semanticProps: {
      fluid: true,
      inverted: false,
    },
    displayError: false
  }
};
```
Below is the current default options for all widgets
```json5
{
  "ui:options":  {
   semanticProps: {
     fluid: true,
     inverted: false,
   },
   displayError: false
 }
}
````

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/rjsf-team/react-jsonschema-form/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Read our [contributors' guide](https://react-jsonschema-form.readthedocs.io/en/latest/#contributing) to get started.

<!-- CONTACT -->

## Contact

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[build-url]: https://travis-ci.org/mozilla-services/react-jsonschema-form
[contributors-shield]: https://img.shields.io/badge/contributors-1-orange.svg?style=flat-square
[license-shield]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: https://choosealicense.com/licenses/mit
