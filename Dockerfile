# Use official Node.js 24 LTS base image
FROM node:24-bookworm-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and yarn.lock files to the container
COPY package.json yarn.lock ./

# Install project dependencies using Yarn
RUN yarn install --frozen-lockfile

# Copy the entire project directory to the container
COPY . .

# Build the React app
RUN yarn build

# Set the command to run when the container starts
CMD ["yarn", "start"]