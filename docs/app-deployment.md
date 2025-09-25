---
layout: doc
---

# Application deployment and dependencies

The sections below describe the suggested processes involved in:
- Setting up and deploying `shacl-vue` for a specific UI instance
- For developers: publishing `shacl-vue` and its dependencies to `npm`

## 1. `shacl-vue` UI deployment setup

The static files for a `shacl-vue` deployment, such as the one at https://penguins.edu.datalad.org/ui/, can be built from a separate git repository (for the penguin example, this repository is at: https://hub.datalad.org/edu/penguins.edu.datalad.org-ui) that contains the following:

1. Input files to the `shacl-vue` build process:
   - required configuration file (for the penguins example, see [`config.js`](https://hub.datalad.org/edu/penguins.edu.datalad.org-ui/src/branch/main/config.json))
   - optional assets such as a logo or front page HTML file
2. `shacl-vue` as a git submodule
3. A makefile (e.g. [this](https://hub.datalad.org/edu/penguins.edu.datalad.org-ui/src/branch/main/Makefile)) containing the commands necessary for setting up the build environment.

Extra details are provided per repository component:

### Input files

The `config.js` file is required and contains all configuration options to customize the `shacl-vue` deployment. These options are described comprehensively in the [Application configuration section](./app-configuration). Some noteworthy options include:
- `shapes_url` specifies the URL of the SHACL sources that drive the actual UI
- `service_base_url` provides the base URLs and read/write type of the `dumpthings` service endpoints integrated with the specific `shacl-vue` deployment

### `shacl-vue`

This submodule pins a specific version/tag of the `shacl-vue` source code to the UI deployment. It should be kept up to date with the latest commit in the `main` branch if the goal is to support the latest `shacl-vue` features for the deployed UI instance. On the other hand, it is possible that a specific branch or tag is pinned to the repository for a specific reason, for example a production UI instance that should not be changed for consistency. If that is the case, this version/tag should be noted explicitly and adhered to.

### Makefile

This suggested deployment approach uses [make](https://www.gnu.org/software/make/) for environment setup and deployment steps. The Makefile contains commands for
- `install`ing `vite`, `shacl-vue` and dependencies
- `build`ing the `shacl-vue` distribution files
- `deploy`ing the distribution files to a particular server
which can all be used as is or customized for a specific UI deployment and infrastructure setup.

## 2. `shacl-vue` UI deployment steps

Firstly, ensure that your environment has `git` and `nodejs` installed. The latter is typically done through a virtual environment manager.

For the next steps, we use the penguins repository as an example. First, clone the UI source repository:

```bash
git clone https://hub.datalad.org/edu/penguins.edu.datalad.org-ui.git
```

Then, navigate to the repository and ensure the `shacl-vue` submodule is available locally:

```bash
cd penguins.edu.datalad.org-ui
git submodule update --init shacl-vue
```

To install and build `shacl-vue`, you can use `make`:

```bash
make install
make build
```

The `install` and `build` steps are not explicitly necessary to execute separately, because they are also executed via the `deploy` command, which in addition uses `rsync` to move the distribution files to the intended static file server:

```bash
make deploy
```

The `deploy` step will require credentials for the server to be entered.

## 3. Publishing `shacl-vue` and its dependencies to `npm`

Relevant `npm` packages are:
- [shacl-tulip](https://www.npmjs.com/package/shacl-tulip)
- [flatson-js](https://www.npmjs.com/package/flatson-js)
- [shacl-vue](https://www.npmjs.com/package/shacl-vue)

RDF and form data handling functionalities underlying the core `shacl-vue` features are provided by the [`shacl-tulip`](https://github.com/psychoinformatics-de/shacl-tulip) library (like "`shacl-vue`-lib", but flowery), a core dependency of `shacl-vue`. It is completely independent of VueJS, yet class constructors allow passing reactive objects as arguments, which `shacl-tulip` handles seamlessly. It also focuses purely on library-level functionality and contains no frontend code.

For table import and export support, `shacl-vue` uses the [FlatSON specification](https://hub.psychoinformatics.de/datalink/flatson), for which [flatson-js](https://www.npmjs.com/package/flatson-js) provides helper functionality.

Lastly, while the `shacl-vue` deployment steps above describe a git-repository-based process, it is also possible to use the `shacl-vue` package as a dependency in other VueJS projects. For that reason it is also published to `npm`.

Publishing any of these packages to `npm` requires:
- A registered `npm` user
- Maintainer privileges for that user to the relevant `npm` package
- Acquiring a local clone of the package's source code repository 
- Updating the package source code, and in particular bumping the package major/minor version in the `package.json` file (e.g. [here](https://github.com/psychoinformatics-de/shacl-tulip/blob/main/package.json#L3))
- A local environment with `nodejs` installed
- Running: `npm publish` from the local root directory of the git clone

_Note that 2FA might be involved in the authentication step_

If the published version of either `shacl-tulip` or `flatson-js` is changed, the dependency in `shacl-vue` also needs to be updated (e.g. [here](https://github.com/psychoinformatics-de/shacl-vue/blob/971c949e6c1a095b4ebfda67ac5459438ed3950c/package.json#L60)), which in turn will require a new commit to the `shacl-vue` repository and an updated version published to `npm`. This will in turn require projects using `shacl-vue` to pin the latest version, either by updating the submodule described in the git-repository-based process above or by accessing the latest `shacl-vue` package version from `npm`.