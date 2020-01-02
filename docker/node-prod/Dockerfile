FROM node:alpine

RUN apk add build-base python wget curl bash git

ARG DIRECTORY=./no-directory-given

COPY $DIRECTORY /app
COPY ./shared /shared

RUN cd /shared && yarn install && yarn build && cd /app

WORKDIR /app

ENV NODE_ENV=production

RUN yarn install && yarn build

CMD yarn start
