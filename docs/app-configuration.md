---
layout: doc
---

# Application configuration

Any unique instance of `shacl-vue` can be tailored to its specific use case and users through a custom configuration. This includes required instance inputs, such as the URLs to the input sources covered in the [Application Inputs section](./app-inputs), as well as various settings for theming, identifiers, UI behavior, and service API integration.

Configuration is done via a `config.json` file, available at [`shacl-vue/public/config.json`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/public/config.json)

Current configuration options include:

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
- `documentation_url` is the URL of the user documentation for the specific `shacl-vue` instance
- `source_code_url` is the URL of the source code repository for the specific `shacl-vue` instance

The HTML page title is set in [`shacl-vue/src/components/ShaclVue.vue`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/components/ShaclVue.vue) based on values in the configuration file (`config.json`). The app uses the following priority when setting the title:

1. IF `page_title` is defined, use it;
2. ELSE IF `app_name` is defined, use it;
3. ELSE, fallback to "shacl-vue".

URLs should be unique and resolvable online URIs.

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
}
```

- `link_color` is the default link color
- `hover_color` is the link hover color
- `active_color` is the link active state color
- `visited_color` (Optional) is the visited link color
- `panel_color` is the background color of the main left-hand-side UI panel displaying all data types
- `logo` is the path to the logo used in the HTML page header.  The logo path should either be a unique and absolute online URI, or a path relative to `shacl-vue/public` in the case of a file local to the repository.

All colors should be defined using hexadecimal color codes (#RRGGBB).

##  [Application inputs](./app-inputs) sources

```json
{
    "shapes_url": "",
    "use_default_shapes": false,
    "data_url": "",
    "use_default_data": false,
    "class_url": "",
    "use_default_classes": false,
}
```

- `shapes_url` is the URL to fetch the shapes graph from
- `data_url` is the URL to fetch the data graph from
- `class_url` is the URL to fetch the class hierarchy from
- `use_default_shapes`, `use_default_data`, and `use_default_classes` specify using default demo files as fallback config URLs, when `true`

All application input source URLs should either be unique and absolute online URIs, or a path relative to `shacl-vue/public` in the case of a file local to the repository. These URLs should return documents in TTL format.

The defaults for all input source URLs are the repository-local demo files.

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

- `id_iri` is the URI of the property that indicates the persistent identifier of an entity. It is central to the functioning of `shacl-vue` because it allows for the mapping between structured records and the representation of those records as named nodes in RDF graphs. The value of this option is dependent on the SHACL schema driving the `shacl-vue` instance. It defaults to `https://concepts.datalad.org/s/things/v1/pid` since the demo input sources are created from the `https://concepts.datalad.org/s/things/v1/` schema that implements that persistent identifier definition.
- `id_autogenerate` is a dictionary mapping class IRIs to auto-generated identifier rules, and allows the `shacl-vue` instance to auto-generate the value of the `id_iri`-property (i.e. the `PID`) of a manually created record of a particular class. The auto-generated value is determined from two more configuration options, `id_autogenerate_prefix` and `id_autogenerate_prepend`, and a random component. `id_autogenerate_prefix` should be the name of a known prefix in the deployment (which can also be customized via configuration, see `prefixes` below), for example `dlthings`, and `id_autogenerate_prepend` can be any string e.g. '/people'. The construction is then `<resolved-prefix><prepended-string><random-string>`, where the random string part is generated with JavaScripts `crypto.randomUUID()`. For the given example strings, the `pid` field for a new record created manually in a `shacl-vue` instance will be: `https://concepts.datalad.org/s/things/v1/people/<randomUUID>'`.
- `id_resolves_externally` is an array of class URIs for which their PIDs resolve online. Records of this class will have additional UI that allows them to be navigated to both inside the application and externally online.
- `prefixes` is a JSON mapping from prefix to URI for prefixes used throughout a `shacl-vue` instance. While most namespaces known to a `shacl-vue` instance are derived from its input sources (SHACL schema, RDF data, class hierarchy information), this option allows additional prefixes to be supplied in order to support referencing external vocabularies and use-case specific naming conventions

## UI behavior

```json
{
    "show_shapes_wo_id": true,
    "show_all_fields": true,
    "hide_classes": [],
    "no_edit_classes": [],
    "class_name_display": "",
    "class_icons": {
        "": ""
    }
}
```

- `show_shapes_wo_id` shows data types (in the left-hand-side panel) for which the driving SHACL shapes do not have the `id_iri` property defined, when `true`
- `show_all_fields` displays all properties in the form editor when a record is created/edited, when `true`. Properties in the form editor are displayed by default in order of reverse inheritance. For example, if the `Person` class is derived from the `Thing` class, the form editor for a `Person` would display the `Person`-properties in top, and the `Thing`-properties below that. Often, only the top-level properties are of immediate interest or importance to users and UX is improved by hiding other properties. The `show_all_fields` option, when `false`, would hide lower-level properties and display the top-level properties and required properties when a user opens the form editor to add/edit a record. In addition to the configuration option, the UI still allows the user to toggle between showing and hiding lower-level properties.
- `hide_classes` is a list of class URIs to hide from the left-hand-side panel listing all data types (i.e. classes)
- `no_edit_classes` prevents records of specific classes from being created or edited by users. It is a list of class URIs that will firstly be hidden from the left-hand-side panel, which duplicates the functionality of `hide_classes`. In addition:
   - users will not be able to create records of these classes via the `Add New Item` selection in an `InstancesSelectEditor`, i.e. the dropdown that allows users to select a specific record.
   - users will not be able to use URL query parameters to navigate to the main view displaying records of these classes.
- `class_name_display` specifies whether to use the CURIE format or just the latter part of the CURIE for displaying class names in the `shacl-vue` UI. Allowed options are: 'curie' (for the full CURIE, e.g. `prov:Agent`) and 'name' (for the CURIE suffix, e.g. `Agent`) which is the default.
- `class_icons` is a mapping of class URIs to [Material Design Icons](https://pictogrammers.com/library/mdi/). By default, `class_icons` that are not defined will display as empty circles.

## Service API integration

While source data is specified in the [Application Inputs section](./app-inputs) as one of the main inputs to a `shacl-vue` instance, this input does not have to come from a single TTL-document via the `data_url` configuration option. In fact, it is likely beneficial to many `shacl-vue` instances to allow getting data from (and pushing data to) a separately and continuously maintained data source, using standard HTTP. An example of such a source is the [Dump Things Service](https://github.com/christian-monch/dump-things-server), which is supported by `shacl-vue` via the `use_service` and related configuration options.

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

- `use_service` enables back-end API integration with a deployed `dump-things-server`, when `true`. This option is used throughout `shacl-vue` to enable/disable related UI options (such as the `Submit` button) and for internal request-related functionality
- `use-token` allows the use of an authentication token, when `true`. This enables UI components for the user to enter a token, and adds this token to any requests made to the integrated service.
- `token_info` is instructional text about obtaining a token that will be displayed to a user in the application UI
- `token_info_url` is a URL that can be added to the instructional text that will be displayed to a user in the application UI
- `service_base_url` is a list of URLs (minimum 1) of the integrated service. The `url` property's value should be the actual base URL, and the `type` property's value can be either `read` or `write`. This option allows a single `shacl-vue` instance to be integrated with multiple services, for example in curation use cases where user-submitted records should be pushed to a `write` backend, while records that the user should be able to see but not edit will be retrieved from a `read` backend.
- `service_endpoints` is a mapping to endpoint templates, for the custom part of the endpoint URL that will be appended to the base URL before a request is made. These templates are typically useful for encoding query parameters. Template variables are included in curly brackets, and current options are `{name}` and `{curie}`, which follow the same definitions as given above for the `class_name_display` option. The `service_endpoint` options included in the example below are specific to integration with the `dump-things-service`.
- `service_fetch_before` is a list of class URLs indicating from which endpoints records should be fetched upon application startup, i.e. before these classes are actually selected and viewed by the user.

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
        "get-records": ["https://concepts.inm7.de/s/flat-base/unreleased/Person"]
    }
}
```
