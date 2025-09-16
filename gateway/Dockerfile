FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy shared library
COPY shared/ ./shared/

# Copy gateway source
COPY gateway/ ./gateway/

# Install dependencies
RUN npm ci

# Build shared library
RUN cd shared && npm run build

# Build gateway
RUN cd gateway && npm run build

# Default gateway port (can be overridden)
ENV GATEWAY_PORT=3000

# Expose the gateway port
EXPOSE 3000

# Start the gateway
CMD ["node", "gateway/dist/main.js"]