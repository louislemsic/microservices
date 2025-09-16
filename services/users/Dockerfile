FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy shared library
COPY shared/ ./shared/

# Copy users service source
COPY services/users/ ./services/users/

# Install dependencies
RUN npm ci

# Build shared library
RUN cd shared && npm run build

# Build users service
RUN cd services/users && npm run build

# Default service port (can be overridden)
ENV USERS_SERVICE_PORT=8002

# Expose the service port
EXPOSE 8002

# Start the service
CMD ["node", "services/users/dist/main.js"]