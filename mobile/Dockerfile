FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG API_URL
ARG SOCKET_URL
ENV API_URL=${API_URL}
ENV SOCKET_URL=${SOCKET_URL}

RUN npx expo export --platform web

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "dist", "-l", "3000", "-s"]
