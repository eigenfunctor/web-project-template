FROM node:alpine

RUN apk add build-base python wget curl

ARG DIRECTORY=./no-directory-given

COPY $DIRECTORY /app

WORKDIR /app

RUN yarn install && yarn build

CMD yarn start
