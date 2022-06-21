# IndraLab Vue Tools

## Vue version

This is the Vue3 compatible version of this repository. 

## Project setup
```shell
npm install
```

### Compiles and hot-reloads for development
```shell
npm run serve
```

### Compiles and minifies for production
```shell
npm run build
```

### Lints and fixes files
```shell
npm run lint
```

### Packs the project for local install
```shell
npm pack
```
this will create a .tgz, e.g. `indralab-vue-0.1.1.tgz`, file in the current directory which can be pointed to by npm 
for local install.

### Deploys build to remote host on s3.
```shell
npm run deploy -- <deployment>
```
where deployment is either "dev", "latest", or "stable". Note that
`deploy` does not run `build`, which must be run separately.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
