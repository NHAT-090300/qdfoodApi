# Use a lightweight Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /home/app

# Copy only the necessary files for installation
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the TypeScript project
RUN yarn build

# Expose the port the app runs on
EXPOSE 8000

# Start the application
CMD ["yarn", "start"]
