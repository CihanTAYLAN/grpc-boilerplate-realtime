FROM --platform=linux/amd64 node:22-bullseye AS dev

WORKDIR /usr/src/app
COPY --chown=node:node package.json .

RUN yarn install
COPY --chown=node:node . .

FROM --platform=linux/amd64 node:22-bullseye AS build

ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --chown=node:node package.json ./

# Install protoc compiler in build stage
RUN apt-get update && apt-get install -y protobuf-compiler
COPY --chown=node:node --from=DEV /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
RUN yarn build

FROM --platform=linux/amd64 node:22-bullseye AS production
WORKDIR /app
COPY --chown=node:node --from=BUILD /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=BUILD /usr/src/app/dist ./dist
COPY --chown=node:node ./public ./public
COPY --chown=node:node ./src/views ./dist/views
COPY --from=BUILD /usr/src/app/package.json ./package.json

EXPOSE 80
CMD ["sh", "-c", "yarn start:prod"]
