---
layout: doc
---

# Backend integration with `dumpthings`

While `shacl-vue` supports loading data from a static TTL source, it becomes much more powerful when integrated with a backend that allows HTTP-based storage and retrieval of information. The [`dump-things-server`](https://github.com/christian-monch/dump-things-server) tool (or `dumpthings` for short), is such a backend. It has been co-developed with `shacl-vue` from the start, and is straightforward to integrate. The figure depicts how the service is schema-driven (just like `shacl-vue`), which enables autogenerating API endpoints per identifiable class.


<div style="background:white; display:inline-block; padding:0;">
    <img src="./dumpthings_summary.png" alt="alt">
</div>

Further useful features of `dumpthings` (such as collection management, authorization, curation endpoints, and more) can be found at the source code documentation.

In order to integrate `dumpthings` with `shacl-vue`, a deployment has to run first. See how the install, deploy, and configure the service [here](https://github.com/christian-monch/dump-things-server?tab=readme-ov-file#running-the-service).

On the `shacl-vue` side, all the necessary integration steps can be done via configuration. These are explained in the [Application configuration](./app-configuration.md) section. The options relevant to service integration are provided here as well.

### `use_service`

Set this to `true` to activate service integration with a `dumthings` backend.

### `service_base_url`

This tells `shacl-vue` where to make requests to. Multiple base URLs are supported, in support of `dumpthings`'s ability to make data available via multiple collections, all supporting the same endpoints. A real-world use case is access control: users might be allowed by default to read from a collection of data, but might need permission to write data to a different subset. This also shows another requirement when specifying the base URL: the read/write type (note: `write` also implies `read`).

An example:

```json
"service_base_url": [
    {
        "url": "https://pool.v0.edu.datalad.org/api/protected/",
        "type": "write"
    },
    {
        "url": "https://pool.v0.edu.datalad.org/api/public/",
        "type": "read"
    }
]
```

If multiple base URLs are specified, `shacl-vue` will query all of them (depending on the type).

### `service_constrained_search`

`dumpthings` supports a `matching` query parameter to allow constrained searches of data in the backend. This is integrated with `shacl-vue`'s type-to-search functionality. The `min_characters` (default: `4`) sets the minimum amount of characters that a user has to type before a constrained query is made to the backend.

### `service_endpoints`

This option provides templates for constructing full query URLs to specific endpoints. These endpoints are linked very specifically to steps in the application UX, for example:

- When a user selects a class (a.k.a. data type) from the main view: `get-paginated-records`
- When a user scrolls to the bottom of a list of records: `get-paginated-records` (with the next page as parameter)
- When the viewer for a specific record is rendered: `get-record`
- When a user types-to-search in the main view or in the `InstancesSelectEditor` component: `get-paginated-records-constrained`
- When the application should fetch records upfront: `get-records-before` (see below)
- When a record is submitted: `post-record`

The standard set of endpoint templates are:

```json
"service_endpoints":  {
    "post-record": "record/{name}?format=ttl",
    "get-record": "record?pid={curie}&format=ttl",
    "get-records": "records/{name}?format=ttl",
    "get-records-before": "records/{name}?format=ttl",
    "get-paginated-records": "records/p/{name}?format=ttl&size=100&page={page_number}",
    "get-paginated-records-constrained": "records/p/{name}?format=ttl&matching=%25{match_string}%25&size=100&page={page_number}"
}
```

Note: `name` and `curie` define in which format the record IRI is to be filled into the template.

These endpoint templates are tuned to work with `dumpthings` specifically, and would have to change for integration with a different service (i.e. differently structured API endpoints).

### `service_fetch_before`

`shacl-vue` aims to minimize network load and delay (leading to user frustration) by only sending queries when it has to (as driven by the UX), not duplicating queries across a session, and using pagination and constrained queries. However, sometimes specific records or all records of a specific type are useful to have in the app upfront. This `service_fetch_before` option allows class IRIs or record IRIs to be provided, and these will be fetched and made available in the app on startup.