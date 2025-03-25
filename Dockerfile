FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .


RUN npm run build

# Set environment variables
ENV PORT=1212

# Expose port
EXPOSE 1212

# Start the application
CMD ["npm", "start"]