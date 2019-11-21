FROM node:alpine

RUN apk add build-base python wget curl

ARG DIRECTORY=./no-directory-given

COPY $DIRECTORY /app

WORKDIR /app

ENV NODE_ENV=production

RUN yarn install && yarn build

CMD yarn start
