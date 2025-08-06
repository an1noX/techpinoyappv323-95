# Use official Node.js image
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app code
COPY . .

# Build the React app
RUN npm run build

# ------------------------

# Use 'serve' in a separate lightweight image
FROM node:18-alpine

# Install 'serve' globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built React files from previous stage
COPY --from=build /app/dist ./dist

# Expose the port used by 'serve'
EXPOSE 8084

# Start the app
CMD ["serve", "-s", "dist", "-l", "8084"]
