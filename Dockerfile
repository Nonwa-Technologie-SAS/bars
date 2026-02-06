# Base stage
ARG VERSION=18
FROM node:${VERSION}-alpine AS base
LABEL maintainer="Kone Nonwa <konenonwa1998@gmail.com>"
WORKDIR /app
RUN apk add --no-cache git
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage
FROM node:${VERSION}-alpine AS production
COPY --from=base /app .
CMD ["npm", "run", "start"]