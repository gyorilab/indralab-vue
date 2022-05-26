# IndraLab Vue Tools

## A note on Bootstrap and jQuery

This is the Vue3 compatible version of this repository. Because Vue.js and jQuery interfere with each other 
(see e.g. [here](https://stackoverflow.com/questions/65547199/using-bootstrap-5-with-vue-3) and
[here](https://vuejsdevelopers.com/2017/05/20/vue-js-safely-jquery-plugin/)), this project assumes the use of 
BootStrap 5.x, since that is the first BootStrap version that does not rely on jQuery. 

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Deploys build to remote host on s3.
```
npm run deploy -- <deployment>
```
where deployment is either "dev", "latest", or "stable". Note that
`deploy` does not run `build`, which must be run separately.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
