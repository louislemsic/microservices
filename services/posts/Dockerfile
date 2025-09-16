FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy shared library
COPY shared/ ./shared/

# Copy posts service source
COPY services/posts/ ./services/posts/

# Install dependencies
RUN npm ci

# Build shared library
RUN cd shared && npm run build

# Build posts service
RUN cd services/posts && npm run build

# Default service port (can be overridden)
ENV POSTS_SERVICE_PORT=8001

# Expose the service port
EXPOSE 8001

# Start the service
CMD ["node", "services/posts/dist/main.js"]