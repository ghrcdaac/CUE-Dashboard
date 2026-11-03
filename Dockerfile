# Pin to a Node.js release containing the fix for CVE-2026-111497.
FROM node:26.12.1-alpine

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