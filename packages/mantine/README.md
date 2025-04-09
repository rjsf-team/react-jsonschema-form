[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![Apache 2.0 License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <img src="https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/mantine/logo.png" alt="Logo" width="120" height="120">
  </a>

  <h3 align="center">rjsf-mantine</h3>

  <p align="center">
  Mantine theme, fields and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
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
- [Optional Mantine Theme properties](#optional-mantine-theme-properties)
  - [Mantine Widget Optional Properties](#mantine-widget-optional-properties)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

`Mantine` theme, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [Mantine](https://mantine.dev/)

<!-- GETTING STARTED -->

## Getting Started

- See the [getting started guide](https://mantine.dev/getting-started/) on Mantine documentation.

### Prerequisites

- `@mantine/core >= 7`
- `@mantine/hooks >= 7`
- `@mantine/dates >= 7`
- `dayjs >= 1.8.0`
- `@rjsf/core >= 2.0.0`

```sh
npm install @mantine/core @mantine/hooks @mantine/dates dayjs @rjsf/core
```

### Installation

```sh
npm install @rjsf/mantine
```

<!-- USAGE EXAMPLES -->

## Usage

```javascript
import Form from '@rjsf/mantine';
```

or

```javascript
import { withTheme } from '@rjsf/core';
import { Theme as MantineTheme } from '@rjsf/mantine';

// Make modifications to the theme with your own fields and widgets

const Form = withTheme(MantineTheme);
```

## Optional Mantine Theme properties

- To pass additional properties to widgets, see this [guide](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/objects#additional-properties).

#### Mantine Widget Optional Properties

- [Mantine props for CheckboxWidget](https://mantine.dev/core/checkbox/?t=props)
- [Mantine props for ColorWidget](https://mantine.dev/core/color-input/?t=props)
- [Mantine props for DateWidget](https://mantine.dev/dates/date-input/?t=props)
- [Mantine props for DateTimeWidget](https://mantine.dev/dates/date-input/?t=props)
- [Mantine props for PasswordWidget](https://mantine.dev/core/password-input/?t=props)
- [Mantine props for RadioWidget](https://mantine.dev/core/radio/?t=props)
- [Mantine props for RangeWidget](https://mantine.dev/core/slider/?t=props)
- [Mantine props for SelectWidget](https://mantine.dev/core/select/?t=props)
- [Mantine props for UpDownWidget](https://mantine.dev/core/number-input/?t=props)
- [Mantine props for TextWidget](https://mantine.dev/core/text-input/?t=props)
- [Mantine props for TextAreaWidget](https://mantine.dev/core/textarea/?t=props)
- [Mantine props for TimeWidget](https://mantine.dev/dates/time-input/?t=props)

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
[npm-shield]: https://img.shields.io/npm/v/@rjsf/mantine/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/mantine
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/mantine.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/mantine
[product-screenshot]: https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/mantine/screenshot.png
