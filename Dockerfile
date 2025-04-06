# Use the official Node.js 20.9.0 image as a base
FROM node:20.9.0-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

# Copy the rest of the application code
COPY . .

RUN yarn prisma generate

# Build the NestJS application
RUN yarn build

# Expose the application port
EXPOSE 8000

# Start the NestJS application
CMD ["yarn", "start:prod"]