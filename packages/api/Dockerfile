FROM node:24-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY src ./src

EXPOSE 8080

CMD ["yarn", "start"]