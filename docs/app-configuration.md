---
layout: doc
---

# Application configuration

The URLs to the input sources covered in the [Application Inputs section](./app-inputs), as well as various settings for theming, identifiers, UI behavior, and service API integration can all be configured easily in order to customize a `shacl-vue` instance. The current configuration, available at [`shacl-vue/public/config.json`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/config.json) includes the following:

```json
{
    "shapes_url": "",
    "data_url": "",
    "class_url": "",
    "group_layout": ""
}
```

- `shapes_url` is the URL to fetch the shapes graph from
- `data_url` is the URL to fetch the data graph from
- `class_url` is the URL to fetch the class hierarchy from
- `group_layout` provides an option to customize the layout of groups in a form. The options include `default`, which is the standard vertically ordered layout, and `tabs`, which displays groups of properties in horizontal tabs.

All URLs should either be unique and absolute online URIs, or a path relative to `shacl-vue/src` in the case of a file local to the repository.

The defaults for all config URLs are the demo files.
