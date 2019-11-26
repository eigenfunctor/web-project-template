# Web Project Template

## TL;DR

- Use `docker-compose -f dev.yml up` to start the development environment.
- Visit `http://localhost:3000`
- Add `ENABLE_ROOT_ACCOUNT=1` and `ROOT_PASSWORD=mypassword` to the `.env` file in the root directory of the project to enable the root account and update its password.
- Edit the client and server image names in `docker-compose.yml`
- Run `docker-compose build` to build the production images.

## Introduction

This repository is a template for containerized client/server applications written in typescript. This README will walk you through each component of the template so you may customize your application accordingly.

The template scaffolds the necessary client and server components required for user authentication, registration, and email verifications. Users may also have their administrator status modified.

You may check your developer environment against this [demo](https://web-project-template.eigenfunctor.io).

The root account for the demo is enabled.
- username: `root`
- password: `root`

## Client
The client is a `nextjs` typescript application generated by `create-next-app`. The code is under the `client` folder.

- Pages are composed of components from the [MaterialUI React library](https://material-ui.com/).
  - [The MaterialUI](https://material-ui.com/customization/default-theme/) theme is under `client/components/theme-provider.ts`.
- [Array notation](https://material-ui.com/system/basics/#array) for [responsive styles](https://styled-system.com/responsive-styles) is used to configure the `Box` component throughout the pages.
- [@emotion/styled](https://emotion.sh/docs/styled) is the recommended library for customizing the CSS of containers.
- [@apollo/react-hooks](https://www.apollographql.com/docs/react/api/react-hooks) is used to query and mutate over the server's Graphql API.
- Routing is implicit by the folder structure under `client/pages`.
  - Internal links use the `Link` component under the `next/link` package for client-side routing.
  - External links use normal `<a>...</a>` tags.
- React hooks are used to manage state and effects elegantly.
  - `client/hooks/index.ts` exports all the application-specific hooks:
    - `client/hooks/auth-check` can be used to redirect the user from a page based on their login status.
    - `client/hooks/admin-check` can be used to redirect the user from a page based on their administrator status.
- `client/public` holds static content specific to the web application's look.

## Server
The server is a typescript microservice generated by [typeorm](https://typeorm.io/#/using-cli/initialize-a-new-typeorm-project). The code is under the `server` folder.

Once the server is up, you may immediately work with the graphql playground under the `/graphql` route.

- You may enable the root account with the `ENABLE_ROOT_ACCOUNT` environment variable set to `1`
- You may override the default root password (`root`) with the `ROOT_PASSWORD` set to any non empty string.
- [express](https://expressjs.com/) is used to run the webserver hosting the GraphQL API and the authorization REST API.
- [apollo-server](https://www.apollographql.com/docs/apollo-server/) is used to define the GraphQL schema.
- [apollo-server-express](https://www.apollographql.com/docs/apollo-server/integrations/middleware/) is used to run the [express middleware](https://expressjs.com/en/guide/using-middleware.html) which binds the GraphQL API endpoint.
- [passport](http://www.passportjs.org/) greatly simplifies authentication logic. The `/auth/provider` route prefixes all authentication provider routes.
  - [Passport authentication strategies](http://www.passportjs.org/) may be added similar to how `server/src/routers/provider/local.ts` is used for local authentication.
  - See [server/src/auth/provider/README.md](server/src/auth/provider/README.md) for instructions on adding more [passport strategies](http://www.passportjs.org).

## Docker Compose
All microservices mentioned in the previous section are wired together using a docker-compose configuration.

You should edit the `docker-compose.yml` and edit image names and tags. Run `docker-compose build` to build production containers.

### Development
- `dev.yml` holds the development environment configuration.
 - Use `docker-compose -f dev.yml up` to start the development environment.
 - [Traefik](https://traefik.io/) will route requests to the correct service from `http://localhost:3000`.
 - [The SMTP container](https://hub.docker.com/r/namshi/smtp) runs as the SMTP service for outgoing emails.
 - [The Postgres container](https://hub.docker.com/_/postgres) hosts a development database under the pg-dev service.
- `docker-compose.yml` only holds the image names and tags for the production docker images.
- Production configurations depend on the deployment environment, and so there is no default configuration.
- You can acquire a shell into both the `client` and `server` containers respectively by running:
  - `docker-compose -f dev.yml exec client bash`
  - `docker-compose -f dev.yml exec server bash`
- You can run tests in watch mode for both the `client` and `server` containers respectively by running:
  - `docker-compose -f dev.yml exec client yarn test:watch`
  - `docker-compose -f dev.yml exec server yarn test:watch`

### Testing
CI/CD pipelines will use the `test.yml` docker-compose configuration to run automated tests across the application. A mock Postgres database and connection is provisioned as a service for each test suite.

