FROM node:16-alpine

WORKDIR /opt/app

COPY . /opt/app

RUN yarn install

CMD ["node", "index.js"]
