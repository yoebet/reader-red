// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  apiBase: 'http://localhost:3000/api-b',
  staticBase: 'http://localhost:3000',
  // apiBase: 'http://18.139.41.36:3000/api-b',
  // staticBase: 'http://18.139.41.36:2025',
  httpHeaders: {
    'X-XS': 'grMmqX5wDJsQKDs2oF7KxK'
  }
};
