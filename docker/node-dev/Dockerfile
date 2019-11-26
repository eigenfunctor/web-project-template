FROM node:alpine

RUN apk add build-base python wget curl bash git

RUN adduser -D dev-user \ 
  && mkdir /app \
  && chown dev-user:dev-user /app
  
USER dev-user

WORKDIR /app

CMD yarn install && yarn dev
