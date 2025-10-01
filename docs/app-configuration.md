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
    "footer_links": [
        {
            "url": "",
            "text": ""
        }
    ]
}
```

- `app_name` is the name of the application displayed in the browser tab and UI
- `page_title` is the title for the HTML page
- `documentation_url` is the URL of the user documentation for the specific `shacl-vue` instance
- `source_code_url` is the URL of the source code repository for the specific `shacl-vue` instance
- `footer_links` is an array of objects, where each object contains the `url` and display `text` for a link that should be included in the application footer

The HTML page title of the main application is set in [`shacl-vue/src/components/ShaclVue.vue`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/components/ShaclVue.vue) based on values in the configuration file (`config.json`). The app uses the following priority when setting the title:

1. IF `page_title` is defined, use it;
2. ELSE IF `app_name` is defined, use it;
3. ELSE, fallback to "shacl-vue".

URLs should be unique and resolvable online URIs.

## Theming settings

```json
{
    "app_theme": {
        "link_color": "",
        "hover_color": "",
        "active_color": "",
        "vistied_color": "",
        "panel_color": "",
        "logo": "",
    },
    "front_page_content": ""
}
```

Colors schemes and application logo can be set via the `app_theme` option:
- `link_color` is the default link color
- `hover_color` is the link hover color
- `active_color` is the link active state color
- `visited_color` (Optional) is the visited link color
- `panel_color` is the background color of the main left-hand-side UI panel displaying all data types
- `logo` is the path to the logo used in the HTML page header.  The logo path should either be a unique and absolute online URI, or a path relative to `shacl-vue/public` in the case of a file local to the repository.

All colors should be defined using hexadecimal color codes (#RRGGBB).

The `front_page_content` option allows the inclusion of arbitrary HTML content as the front page of a `shacl-vue` deployment, which will display when no data type is selected from the left-hand-side panel. The `front_page_content` option should contain the name of the HTML page to be included (e.g. `frontpage.html`), the file content should be standard HTML wrapped in `<html></html>` tags, and the file itself should be placed in the root distribution directory of the deployment.

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
- `id_resolves_externally` is an array of prefix strings. Records for which the PID includes any of these prefixes will resolve online, and additional UI will become visible that allows such records to be navigated to both inside the application and externally online. Included prefixes should be known prefixes in the deployment, i.e. they should arrive via the input sources that drive the application or can be included via configuration (see `prefixes` below).
- `prefixes` is a JSON mapping from prefix to URI for prefixes used throughout a `shacl-vue` instance. While most namespaces known to a `shacl-vue` instance are derived from its input sources (SHACL schema, RDF data, class hierarchy information), this option allows additional prefixes to be supplied in order to support referencing external vocabularies and use-case specific naming conventions.

## UI behavior

```json
{
    "show_shapes_wo_id": true,
    "show_all_fields": true,
    "show_classes": [],
    "show_classes_with_prefix": [],
    "hide_classes": [],
    "hide_classes_with_prefix": [],
    "no_edit_classes": [],
    "allow_edit_instances": [],
    "class_name_display": "",
    "class_icons": {
        "": ""
    },
    "editor_selection": {},
    "editor_config": {},
    "display_name_autogenerate": {},
    "display_name_autogenerate_placeholder": {}
}
```

- `show_shapes_wo_id` shows data types (in the left-hand-side panel) for which the driving SHACL shapes do not have the `id_iri` property defined, when `true`
- `show_all_fields` displays all properties in the form editor when a record is created/edited, when `true`. Properties in the form editor are displayed by default in order of reverse inheritance. For example, if the `Person` class is derived from the `Thing` class, the form editor for a `Person` would display the `Person`-properties in top, and the `Thing`-properties below that. Often, only the top-level properties are of immediate interest or importance to users and UX is improved by hiding other properties. The `show_all_fields` option, when `false`, would hide lower-level properties and display the top-level properties and required properties when a user opens the form editor to add/edit a record. In addition to the configuration option, the UI still allows the user to toggle between showing and hiding lower-level properties.
- `show_classes`, `show_classes_with_prefix`, `hide_classes`, and `hide_classes_with_prefix` are options that together specify which classes to show and hide in the left-hand-side panel listing all data types (i.e. classes):
   - `show_classes`: an array of class URIs that should all be shown
   - `show_classes_with_prefix`: an array of prefixes, all classes containing any of these prefixes should be shown
   - `hide_classes`: an array of class URIs that should be hidden
   - `hide_classes_with_prefix`: an array of prefixes, all classes containing any of these prefixes should be hidden

   If both `show_classes` and `show_classes_with_prefix` are empty arrays, all classes are shown, apart from those in `hide_classes` or those with prefixes in `hide_classes_with_prefix`. Records that end up being hidden/excluded:
   - WILL NOT show up in the left-hand-side panel
   - CANNOT be navigated to using URL query parameters
   - by implication, CAN ALSO NOT be edited via URL query parameters
   - CAN be created via `Add new item` button in `InstancesSelectEditor`, i.e. the dropdown that allows users to select a specific record.
- `no_edit_classes` prevents records of specific classes from being created or edited by users. Records of these classes:
   - WILL show up in the left-hand-side panel, EXCLUDING the option to create new records
   - CAN be navigated to using URL query parameters
   - CANNOT be edited via URL query parameters
   - CANNOT be created via `Add new item` button in `InstancesSelectEditor`
- `allow_edit_instances`, allows an edit button to be added for all instances in an `InstancesSelectEditor`, i.e. the dropdown that allows users to select a specific record. This edit button allows the user to edit the specific record directly, without having to navigate to the record editor via the left-hand-side panel. `allow_edit_instances` can take a boolean value of `true` to apply this setting for all instances of all classes, or alternatively an array with specific class URIs to apply the setting only for instances of specific classes. The edit button will be disabled if the record's class is included in `no_edit_classes`.
- `class_name_display` specifies which format to use when displaying class names in the `shacl-vue` UI. Allowed options are:
   - 'name': the value of the `sh:name` attribute in the class's nodeshape (e.g. `Originating Agent`); this option is the default
   - 'reference': the reference of the class's nodeshape IRI in CURIE format (e.g. `Agent`); this option is used when 'name' is specified but the `sh:name` attribute is not available
   - 'curie': the class's nodeshape IRI in full CURIE format (e.g. `prov:Agent`)
- `class_icons` is a mapping of class URIs to [Material Design Icons](https://pictogrammers.com/library/mdi/). By default, `class_icons` that are not defined will display as empty circles.
- `editor_selection`: this option allows the UI to use config-driven selection of an editor component instead of the [component matching procedure](./editor-component#the-matching-script) that `shacl-vue` uses by default. The object takes keys of a SHACL property shape as its keys in CURIE format (e.g. `sh:datatype`, `sh:path`, or `sh:nodeKind`), and the values are objects themselves. These objects will have the to-be-matched CURIEs as keys, and the corresponding value should be the exact name of the component that will be selected. An example is provided below.
- `editor_config` allows component-specific parameters to be passed to name-identified components. Such parameters allow the customization of behavior or display in `shacl-vue` components. The object has the exact name of any editor component as its keys, and values are key-value parameter pairs that should feed into the associated editor components. An example is provided below.
- `display_name_autogenerate`: by default `shacl-vue` uses the `skos:prefLabel` of a record, if available, as its display label. When not available, the `display_name_autogenerate` provides a means to autogenerate the display label of a record from a string serialization of other properties of the same record. This option should receive an object with class CURIEs as its keys and the values being string templates. Placeholders in such a template should be curly brackets containing the CURIE of a property of the class that should be used instead of the placeholder. See example usage below.
- `display_name_autogenerate_placeholder`: when using the `display_name_autogenerate` option, it is possible that not all parameters in the template string exist as properties of an associated record for which a display label is being autogenerated. For such cases, the missing parameter will be replaced with a missing value placeholder string. This option allows for providing a `default` placeholder to be used for all missing values, or for providing a missing value placeholder per property. See example below.


### Example

In the example below, the `editor_selection` option specifies that, if a SHACL property shape is encountered where the `sh:datatype` is equal to `mydatetime:year`, the `W3CISO8601YearEditor` should be selected and rendered. The `editor_config` option specifies that, for the `W3CISO8601YearEditor`, the `yearStart` and `yearEnd` options should be set to `1925` and `2077`, which for this component defines the starting and ending years that together make up the range of options in the rendered year-picker.

The `editor_config` option also specifies that, for the `InstancesSelectEditor`, the `fetchingsRecordsText` should be set to `Fetching records (this might take a while)...`, which for this component defines the text that a user sees when more records are fetched from a configured service endpoint. This option is useful for providing users with an explanation of why a request might be taking a long time. The text displayed by default is `Fetching records...`.

```json
{
    ...
    "editor_selection": {
        "sh:datatype": {
            "mydatetime:year": "W3CISO8601YearEditor",
        }
    },
    "editor_config": {
        "W3CISO8601YearEditor": {
            "yearStart": 1925,
            "yearEnd": 2077
        },
        "InstancesSelectEditor": {
            "fetchingsRecordsText": "Fetching records (this might take a while)..."
        }
    },
    ...
}
```

In this example `display_name_autogenerate` is used to generate a display label for records of class `myns:TimeDuration`, specifically for cases where such records do not already have an existing `skos:prefLabel`. The display label is generated by concatenating three values: the property `myns:start_date`, the string `" to "`, and the property `myns:end_date`. If for example `myns:start_date` is `2022-09-27` and `myns:end_date` was missing in the data, then the generated display label would be `2022-09-27 to [*END]`. If the same was true, but the `display_name_autogenerate_placeholder` config option did not contain the `"myns:start_date": "[*END]"` key-value pair, then the generated display label would be `2022-09-27 to [X]`.

```json
{
    ...
    "display_name_autogenerate": {
        "myns:TimeDuration": "{myns:start_date} to {myns:end_date}"
    },
    "display_name_autogenerate_placeholder": {
        "default": "[X]",
        "myns:start_date": "[*START]",
        "myns:start_date": "[*END]"
    },
    ...
}
```

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
    },
    "service_constrained_search": {
        "min_characters": 4,
        "typing_debounce": 800,
    },
}
```

- `use_service` enables back-end API integration with a deployed `dump-things-server`, when `true`. This option is used throughout `shacl-vue` to enable/disable related UI options (such as the `Submit` button) and for internal request-related functionality
- `use-token` allows the use of an authentication token, when `true`. This enables UI components for the user to enter a token, and adds this token to any requests made to the integrated service.
- `token_info` is instructional text about obtaining a token that will be displayed to a user in the application UI
- `token_info_url` is a URL that can be added to the instructional text that will be displayed to a user in the application UI
- `service_base_url` is a list of URLs (minimum 1) of the integrated service. The `url` property's value should be the actual base URL, and the `type` property's value can be either `read` or `write`. This option allows a single `shacl-vue` instance to be integrated with multiple services, for example in curation use cases where user-submitted records should be pushed to a `write` backend, while records that the user should be able to see but not edit will be retrieved from a `read` backend.
- `service_endpoints` is a mapping to endpoint templates, for the custom part of the endpoint URL that will be appended to the base URL before a request is made. These templates are typically useful for encoding query parameters. Template variables are included in curly brackets, and current options are `{name}` and `{curie}`, which follow the same definitions as given above for the `class_name_display` option. The `service_endpoint` options included in the example below are specific to integration with the `dump-things-service`.
- `service_fetch_before` is a list of IRIs indicating from which endpoints records should be fetched upon application startup, i.e. before these classes/records are actually selected or viewed by the user. This option should be supplied as an object with at least one of two keys, `get-record` or `get-records`, the value of either being an array of IRIs. `get-record` should contain an array of persistent identifier IRIs, while `get-records` should contain an array of class IRIs. NOTE: for the `get-records` option, the maximum number of records that will be fetched upfront per class IRI is the same as the `page_size` encoded into the `service_constrained_search` endpoint in the `service_endpoints` option.
- `service_constrained_search` supports `shacl-vue`'s type-ahead search functionality in combination with the `get-paginated-records-constrained` service endpoint (see example below). This option is an object with two fields:
   - `min_characters`: the minimum number of characters that a user should type before a constrained query is made using the `get-paginated-records-constrained` service endpoint; defaults to 4.
   - `typing_debounce`: the period (in milliseconds) that qualifies as a pause in typing, triggering the constrained request to be sent; defaults to 800 ms.

URLs should be unique and absolute online URIs.

### Example

An example usage of the `service_fetch_before`, `service_endpoints`, and `service_constrained_search` options is given below. Based on this combination of options, the application will fetch a maximum of 50 records of the `Person` class. Of particular note is the `get-paginated-records-constrained` endpoint, which when used for a request will return paginated records for which the JSON-string representation matches the included query parameter. This is used for `shacl-vue`'s type-ahead search functionality, which is further configurable using the `service_constrained_search` option:

```json
{
    "service_fetch_before": {
        "get-record": [],
        "get-records": ["https://concepts.inm7.de/s/flat-base/unreleased/Person"]
    },
    "service_endpoints":  {
        "post-record": "record/{name}?format=ttl",
        "get-record": "record?pid={curie}&format=ttl",
        "get-records": "records/{name}?format=ttl",
        "get-paginated-records": "records/p/{name}?format=ttl&size=50&page={page_number}",
        "get-paginated-records-constrained": "records/p/{name}?format=ttl&matching=%25{match_string}%25&size=100&page={page_number}"
    },
    "service_constrained_search": {
        "min_characters": 4,
        "typing_debounce": 800,
    }
}
```
