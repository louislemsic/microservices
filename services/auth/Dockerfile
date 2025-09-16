FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy shared library
COPY shared/ ./shared/

# Copy auth service source
COPY services/auth/ ./services/auth/

# Install dependencies
RUN npm ci

# Build shared library
RUN cd shared && npm run build

# Build auth service
RUN cd services/auth && npm run build

# Default service port (can be overridden)
ENV AUTH_SERVICE_PORT=8003

# Expose the service port
EXPOSE 8003

# Start the service
CMD ["node", "services/auth/dist/main.js"]
