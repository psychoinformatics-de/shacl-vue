---
layout: doc
---

# Application configuration

The URLs to the input sources covered in the [Application Inputs section](./app-inputs), as well as various settings for theming, identifiers, UI behavior, and service API integration can all be configured easily in order to customize a `shacl-vue` instance. The current configuration, available at [`shacl-vue/public/config.json`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/config.json) includes the following:

## General app settings

```json
{
    "app_name": "",
    "page_title": "",
    "documentation_url": "",
    "source_code_url": "",
}
```

- `app_name` is the name of the application displayed in the browser tab and UI
- `page_title` is the title for the HTML page
- `documentation_url` is the URL of the user documentation
- `source_code_url` is the URL of the source code repository

The HTML page title is set in [`shacl-vue/src/components/ShaclVue.vue`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/components/ShaclVue.vue) based on values in the configuration file (`config.json`). The app uses the following priority when setting the title:

1. If `page_title` is defined, use it;
2. If `app_name` is defined, use it;
3. Else, fallback to "shacl-vue".

URLs should be unique and absolute online URIs.

## Theming settings (`app_theme`)

```json
{
    "app_theme": {
        "link_color": "",
        "hover_color": "",
        "active_color": "",
        "vistied_color": "",
        "panel_color": "",
        "logo": "",
        "inm7_darkblue": "#002a76",
        "inm7_blue": "#014386",
        "inm7_red": "#eb3822"  
}
```

- `link_color` is the default link color
- `hover_color` is the link hover color
- `active_color` is the link active state color
- `visited_color` (Optional) is the visited link color
- `panel_color` is the background color of UI panels
- `logo` is the path to the logo used in the HTML page header
- `inm7_darkblue`, `inm7_blue`, and `inm7_red` (Optional) are institutional colors for consistency across [INM7](https://www.fz-juelich.de/en/inm/inm-7) apps

All colors should be defined using hexadecimal color codes (#RRGGBB). The logo path should either be a unique and absolute online URI, or a path relative to `shacl-vue/public` in the case of a file local to the repository.

##  [Application inputs](./app-inputs) sources

```json
{
    "shapes_url": "",
    "use_default_shapes": true,
    "data_url": "",
    "use_default_data": true,
    "class_url": "",
    "use_default_classes": true,
    "group_layout": ""
}
```

- `shapes_url` is the URL to fetch the shapes graph from
- `data_url` is the URL to fetch the data graph from
- `class_url` is the URL to fetch the class hierarchy from
- `use_default_shapes`, `use_default_data`, and `use_default_classes` specify using default demo files as fallback config URLs, when `true`
- `group_layout` provides an option to customize the layout of groups in a form. The options include `default`, which is the standard vertically ordered layout, and `tabs`, which displays groups of properties in horizontal tabs.

All URLs should either be unique and absolute online URIs, or a path relative to `shacl-vue/public` in the case of a file local to the repository.

The defaults for all config URLs are the demo files.

## Identifier settings

```json
{
    "id_iri": "https://concepts.datalad.org/s/things/v1/pid",
    "id_autogenerate": {
        "": {
            "id_autogenerate_prefix": "",
            "id_autogenerate_prepend": ""
        }
    },
    "id_resolves_externally": [],
    "prefixes": {
        "": ""
    }
}
```

- `id_iri` is the base IRI for new instance identifiers
- `id_autogenerate` is a dictionary mapping RDF classes to auto-generated identifier rules: <br> `id_autogenerate_prefix`, `id_autogenerate_prepend`
- `id_resolves_externally` is an array of class URIs for which IDs resolve elsewhere
- `prefixes` is a JSON mapping from prefix to URI used throughout shacl-vue and RDF resources to support external vocabularies and local naming conventions

## UI behavior

```json
{
    "show_shapes_wo_id": true,
    "show_all_fields": true,
    "hide_classes": [],
    "class_name_display": "",
    "class_icons": {
        "": ""
    }
}
```

- `show_shapes_wo_id` shows shapes that have no explicit ID defined, when `true`
- `show_all_fields` displays all properties, even if not in SHACL shapes, when `true`
- `hide_classes` is a list of RDF class URIs to hide from the class selector
- `class_name_display` specifies whether to use `name` or `rdfs:label` for displaying class names
- `class_icons` is a mapping of RDF classes to [Material Design Icons](https://pictogrammers.com/library/mdi/)

By default, `class_icons` that are not defined will display as empty circles.

## Service API integration

```json
{
    "use_service": true,
    "use_token": true,
    "token_info": "",
    "token_info_url": "",
    "service_base_url": [
        {
            "url": "",
            "type": ""
        }
    ],
    "service_endpoints":  {
        "": ""
    },
    "service_fetch_before": {
        "": []
    }
}
```
- `use_service` enables back-end API interaction, when `true`
- `use-token` requires an authentication token, when `true`
- `token_info` is instructional text about obtaining a token
- `token_info_url` is a URL with token request information
- `service_base_url` is a list of URL(s) of the API backend (can be an object with `url` and `type=read` or `type=write`)
- `service_endpoints` is a mapping to endpoint templates
- `service_fetch_before` are keys indicating which endpoints need preloading

URLs should be unique and absolute online URIs.

### Example

An example usage of `service endpoints` and `service_fetch_before` is as follows:

```json
{
    "service_endpoints":  {
        "post-record": "record/{name}?format=ttl",
        "get-record": "record?pid={curie}&format=ttl",
        "get-records": "records/{name}?format=ttl",
        "get-paginated-records": "records/p/{name}?format=ttl&size=50&page={page_number}"
    },
    "service_fetch_before": {
        "get-record": [],
        "get-records": []
    }
}
```
