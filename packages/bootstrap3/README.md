<!-- PROJECT LOGO -->
<br />
<p align="center">
  <h3 align="center">@rjsf/bootstrap3</h3>

  <p align="center">
  Bootstrap 3 theme for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
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

> **Deprecated.** `@rjsf/bootstrap3` is the Bootstrap 3 markup `@rjsf/core` rendered through v6, kept so an app on it
> can upgrade to v7 without restyling. It gets no new features and is removed in v8. Bootstrap 3 itself reached end of
> life in 2019; move to [another theme](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/themes), such as
> `@rjsf/react-bootstrap` for Bootstrap 5.

## About The Project

Exports the Bootstrap 3 theme for `react-jsonschema-form`: a [class map](https://rjsf-team.github.io/react-jsonschema-form/docs/advanced-customization/custom-themes#class-map)
of Bootstrap 3 class names for the elements `@rjsf/core` renders, plus the templates whose markup is Bootstrap 3's
rather than a class name: the glyphicon buttons, `OptionalDataControlsTemplate` which renders them,
`ArrayFieldItemTemplate`, `WrapIfAdditionalTemplate` and `TitleField`. Everything else is `@rjsf/core`'s own component.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [Bootstrap 3](https://getbootstrap.com/docs/3.4/)
- [TypeScript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

- `@rjsf/core >= 7`
- `@rjsf/utils >= 7`
- `@rjsf/validator-ajv8 >= 7`

```bash
npm install @rjsf/core @rjsf/utils @rjsf/validator-ajv8
```

### Installation

```bash
npm install @rjsf/bootstrap3
```

Load the Bootstrap 3 stylesheet on the page yourself; this package ships none.

## Usage

```js
import Form from '@rjsf/bootstrap3';
```

or

```js
import { withTheme } from '@rjsf/core';
import { Theme as Bootstrap3Theme } from '@rjsf/bootstrap3';

const Form = withTheme(Bootstrap3Theme);
```

## Contributing

Read our [contributors' guide](https://rjsf-team.github.io/react-jsonschema-form/docs/contributing/) to get started.

## Contact

rjsf team: [https://github.com/orgs/rjsf-team/people](https://github.com/orgs/rjsf-team/people)

GitHub repository: [https://github.com/rjsf-team/react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)
