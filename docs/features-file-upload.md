---
layout: doc
---

# File upload

`shacl-vue` supports file upload to an HTTP server using [`git-annex`](https://git-annex.branchable.com/)'s [p2p protocol over http](https://git-annex.branchable.com/design/p2p_protocol_over_http/). And since [`forgejo-aneksajo`](https://codeberg.org/forgejo-aneksajo/forgejo-aneksajo/) is a [`forgejo`](https://forgejo.org/) fork with `git-annex` support, `shacl-vue` can upload files to `git-annex` repositories hosted on `forgejo-aneksajo` deployments. https://hub.datalad.org/ is an example of such a deployment.

## How it works

1. Firstly, `shacl-vue` needs some base configuration options to integrate it with a specific `git-annex` repository
2. On the schema side, a specific field is annotated to indicate that a file uploader should render for it in `shacl-vue`
3. Then, `shacl-vue` needs to be configured to select the `InstancesUploadEditor` when it sees that annotation
4. The `InstancesUploadEditor` handles the upload to the `git-annex` repository and receives all resulting file information, but needs to know what to do with that
5. This is where the required TTL template comes in, to tell `shacl-vue` which records to create and how to link them


## Requirements

The following steps are necessary to enable this feature.

### `shacl-vue` configuration for `git-annex` integration

An example configuration could be:

```json
"use_gitannex_p2phttp": true,
"gitannex_p2phttp_config": {
    "base_url": "https://hub.datalad.org/git-annex-p2phttp/git-annex",
    "annex_uuid": "4freeb00-bfg8-2le4-8c66-71ll03d86453",
    "client_uuid": "shacl-vue",
},
```

- setting `use_gitannex_p2phttp` to true tells the app to allow file uploads
- the `base_url` should point to the `git-annex` `p2phttp` server location
- `annex_uuid` should be the UUID of the `git-annex` repository to which files will be uploaded
- the `client_uuid` is arbitrarily set to `"shacl-vue"`

### Schema annotation

The field/slot in the schema for which `shacl-vue` is supposed to provide a file uploader component should receive the annotation:

```shaclvue:gitAnnexUpload: true```

where the `shaclvue` namespace resolves to: `https://concepts.datalad.org/ns/shaclvue/`.

NOTE: The field can be arbitrary and will most likely be schema- and use-case dependent, but a current requirement is that the range of the field should be a class.

An example in LinkML YAML would be:

```yaml
classes:
  Grant:
    description: >-
      A grant, typically financial or otherwise quantifiable, resources.
    slots:
      - application_document
    slot_usage:
      proposal_document:
        range: Document
        annotations:
          shaclvue:gitAnnexUpload: true
```

Similarly, the node- and property shapes in SHACL could look like:

```ttl
datalad:Grant a sh:NodeShape ;
    sh:closed true ;
    sh:description "A grant, typically financial or otherwise quantifiable, resources." ;
    sh:ignoredProperties ( rdf:type ) ;
    sh:name "Grant" ;
    sh:property [ sh:class datalad:Document ;
            shaclvue:gitAnnexUpload true ;
            sh:description "The proposal document that was submitted and accepted and led to the Person or Organization receiving the Grant" ;
            sh:name "Proposal document" ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI ;
            sh:order 0.0 ;
            sh:path datalad:proposal_document ],
```

### `shacl-vue` configuration for editor selection

The editor component in `shacl-vue` that allows file uploads is the [`InstancesUploadEditor`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/components/InstancesUploadEditor.vue). Internally, it instantiates the [`GitAnnexUploader`](https://github.com/psychoinformatics-de/shacl-vue/blob/main/src/components/GitAnnexUploader.vue) component which does the actual work of uploading a user-provided file.

To ensure that the `InstancesUploadEditor` gets rendered for the slot/field that we annotated in the schema, we can use the `editor_selection` config option, for example:

```json
"editor_selection": {
    "shaclvue:gitAnnexUpload": {
        "true": "InstancesUploadEditor"
    }
}
```

This will tell `shacl-vue` that if it sees a slot with that annotation key (`shaclvue:gitAnnexUpload`) and annotation value (`true`), then it should select and render the `InstancesUploadEditor`. This config-driven approach precedence over `shacl-vue`'s standard [dynamic editor matching approach](./editor-component#component-matching) approach.


### Templates for the `InstancesUploadEditor`

Once a file is uploaded by the `GitAnnexUploader` component, it returns a set of values to the `InstancesUploadEditor`:

```javascript
{
    name // the file name (not full path) with extension
    size // the file size in bytes
    hash // the SHA-256 hash of the file content
    annexKey // the annex key of the file, see https://git-annex.branchable.com/internals/key_format/
    downloadUrl // the constructed download URL
}
```

The `InstancesUploadEditor` will use this, together with provided templates, to create and link RDF triples that are added to the applications graph store. These templates are provided via `shacl-vue` component-specific config as follows:

```json

"component_config": {
    "InstancesUploadEditor": {
        "datalad:Document": {
            "pid_template": "dataladdoc:{_randomUUID}",
            "ttl_template": "content:DocumentUploadTemplate"
        }
    }
}
```

#### The `pid_template`

This is a string template that tells `InstancesUploadEditor` how to construct the PID of the root record that will be created once the upload completes successfully. In the case of the above example, this is a record of type `datalad:Document`.

Any text inside the curly braces will be replaced with actual parameters known in the limited templating scope, which includes all values returned by the `GitAnnexUploader` component, as well as the helper `_randomUUID`, which will use Javascript's `crypto.randomUUID()` to generate a random UUID.

Any prefix used in the `pid_template` should also be included in the TTL template below.

#### The `ttl_template`

This is where the strength of the `InstancesUploadEditor` lies, it will take arbitrary TTL as input and serialize that (after the template parameters have been filled) into RDF triples that can be added to the application's graph store. This means that any level of complexity with regards to class hierarchies and linkage can be accommodated.

The `ttl_template` option can be provided as a serialized TTL string, or using `shacl-vue` [configuration content syntax](./app-configuration#content) to point to a separate TTL file. In the example above, `DocumentUploadTemplate` could point to a `DocumentUploadTemplate.ttl` file in the root directory:

```json
"content": {
    "DocumentUploadTemplate": {
        "url": "DocumentUploadTemplate.ttl"
    }
}
```

An [example TTL template file](./DocumentUploadTemplate.ttl) could look like:

```ttl
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix trr379ra: <https://concepts.trr379.de/s/research-assets/unreleased/> .
@prefix trr379: <https://trr379.de/ns/> .
@prefix trr379doc: <https://trr379.de/ns/document/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dlthings: <https://concepts.datalad.org/s/things/v1/> .
@prefix dcat: <http://www.w3.org/ns/dcat#> .
@prefix dlflatfiles: <https://concepts.datalad.org/s/flat-files/unreleased/> .
@prefix dlidentifiers: <https://concepts.datalad.org/s/identifiers/unreleased/> .
@prefix dldi: <https://pid.datalad.org/distributions/> .
@prefix spdx: <http://spdx.org/rdf/terms#> .
@prefix dlfilesmx: <https://concepts.datalad.org/s/files-mixin/unreleased/> .
@prefix dlcommonmx: <https://concepts.datalad.org/s/common-mixin/unreleased/> .

{pid} a trr379ra:TRR379Document;
    dlcommonmx:title "{name}".
dldi:{annexKey} a trr379ra:TRR379Distribution;
    dlfilesmx:distribution_of {pid};
    dlfilesmx:byte_size "{size}"^^xsd:nonNegativeInteger;
    dlthings:characterized_by _:n0-1.
_:n0-1 a dlthings:Statement;
    rdf:object <{downloadUrl}>;
    rdf:predicate dcat:downloadUrl.
dldi:{annexKey} dlflatfiles:checksums _:n0-2.
_:n0-2 a dlidentifiers:Checksum;
    dlidentifiers:notation "{hash}";
    dlidentifiers:creator "http://spdx.org/rdf/terms#checksumAlgorithm_sha256"^^xsd:anyURI.
```


### And that's that!

Happy uploading :)