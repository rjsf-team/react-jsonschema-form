---
title: Fields and templates receive fieldPath and id instead of a fieldPathId object
description: Fields and templates used to get a `fieldPathId` object, and a field's `onChange` took a path list. Read the `fieldPath` and `id` strings instead, pass `fieldPath` to `onChange` and pass string ids to helpers such as `titleId()`.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-fields, custom-templates, typescript]
schema: []
kind: removal
noticed: type-error
related: [tofieldpathid-and-usedeepcomparememo-removed, change-event-has-no-fieldpathid, ids-cant-collide-or-split-an-id-list, onchange-error-schema-is-the-field-own-errors]
---

## Detect

- In your custom fields and templates: `fieldPathId`, `fieldPathId.$id`, `fieldPathId.path` or `fieldPathId.name` read from props.
- In your code: a `childFieldPathId` prop passed to `ObjectField` or `ArrayField`.
- In your code: `titleId()`, `descriptionId()`, `helpId()`, `errorId()`, `examplesId()`, `buttonId()` or `optionalControlsId()` called with a `fieldPathId` object.
- In your custom fields: an `onChange(newValue, fieldPathId.path, …)` call, or any call to a `FieldProps['onChange']` whose second argument is an array of path segments.
- The type checker reports `TS2339: Property 'fieldPathId' does not exist on type 'FieldProps<unknown, JSONSchema7, object>'` (or the template's props type) on the props, and rejects a `FieldPathList` passed where a `FieldPath` is expected. In JavaScript `fieldPathId` is `undefined`, so reading `fieldPathId.$id` throws a `TypeError`.

## Change

Field identity is now two primitive strings.

- `fieldPath` is a `FieldPath` such as `friends[0].firstName` and says where the data lives. It drives `onChange` writes. Property names are separated by `.`, array indexes are bracketed, and `\ . [ ]` inside a property name are backslash-escaped. The root form is the empty string, exported as `ROOT_FIELD_PATH`.
- `id` is the DOM id such as `root_friends_0_firstName` and says what the element is called. It drives `htmlFor`, focus and accessibility attributes. Some ids differ from v6, as [Some rendered ids change so they cannot collide or split an id list](./ids-cant-collide-or-split-an-id-list.md) describes.

`FieldProps` and `FieldTemplateProps` receive both. `ArrayFieldTemplate`, `ArrayFieldTitleTemplate`, `ArrayFieldDescriptionTemplate`, `ArrayFieldItemButtonsTemplate`, `CyclicSchemaExpandTemplate`, `FieldErrorTemplate`, `FieldHelpTemplate`, `ObjectFieldTemplate` and `UnsupportedFieldTemplate` receive `id` instead of `fieldPathId`. The id helpers accept only a `string` id:

```diff
-const { fieldPathId } = props;
-<label htmlFor={fieldPathId.$id}>
-<h2 id={titleId(fieldPathId)}>
+const { id } = props;
+<label htmlFor={id}>
+<h2 id={titleId(id)}>
```

`FieldProps['onChange']` takes the `FieldPath` string instead of a `FieldPathList`. Forward the `fieldPath` prop the field already holds, and its `id`:

```diff
-onChange(newValue, fieldPathId.path, ownErrors, fieldPathId.$id);
+onChange(newValue, fieldPath, ownErrors, id);
```

`ownErrors` stands for the errors the field itself raises, not the `errorSchema` prop it was given. See [The errorSchema passed to onChange holds only the field's own errors](./onchange-error-schema-is-the-field-own-errors.md).

Drop the `childFieldPathId` prop you passed to `ObjectField` or `ArrayField`. The `fieldPath` the child gets already addresses its data.

`FieldPath` is a branded `string`, so the compiler rejects a plain string, such as a DOM id, where a `FieldPath` is expected. A `FieldPath` is still accepted wherever a `string` is. To build or take apart a path yourself, see [toFieldPathId(), the FieldPathId type and useDeepCompareMemo() are removed](./tofieldpathid-and-usedeepcomparememo-removed.md).

## Verify

- The type checker reports no `fieldPathId` or `childFieldPathId` error, and accepts every `onChange` call.
- Your fields' labels, titles and descriptions render the ids RJSF's own fields produce for them. Compare the rendered `id` and `htmlFor` attributes, or your DOM snapshots.
- An edit in a custom field updates the value at that field's place in `formData`.
