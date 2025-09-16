# Atlas - Microservices Architecture

A modular NestJS microservices architecture with independent services and a dynamic API gateway.

## Architecture Overview

```
/atlas
├── gateway/              # API Gateway service
├── services/            # Independent microservices
│   ├── auth/           # Authentication service
│   ├── posts/          # Posts service
│   └── users/          # Users service
└── shared/             # Shared library used by all services
```

## Features

- 🚀 True microservice architecture with independent services
- 🔄 Dynamic service discovery and management
- 🌐 Centralized API Gateway with versioning support
- 📚 Shared type definitions and constants
- 🔍 Comprehensive logging with service identification
- ⚡ Ready for Railway deployment
- 🛠️ Automated service creation and management
- 💻 Flexible development modes (monorepo or individual)
- 🔨 Independent build and deployment capabilities
- 📦 Service-specific dependency management

## Tech Stack

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)

## Running Locally

Get the Atlas microservices running on your local machine in three simple steps:

> [!IMPORTANT]
> This project assumes you have installed [Node.js](https://nodejs.org/en) and [Git](https://git-scm.com/) in your machine. Without these, the following instructions might not make sense.


### Quick Start

1. **Clone the repository**
   ```bash
   git clone git@github.com:louislemsic/atlas.git
   cd atlas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install all service dependencies**
   ```bash
   npm run install:all
   # Yes, this is a different command from npm install
   ```

4. **Start all services**
   ```bash
   npm run dev
   ```

This will:
- Build the shared library
- Install dependencies for gateway and all services
- Start the gateway (Default Port: 3000) and all services
- Display logs with service identification

## Creating New Services

Atlas includes an automated service creation script that generates all the necessary boilerplate:

### Usage

```bash
npm run create-service [service-name] [port]
```

**Example:**
```bash
npm run create-service products 8004
```

### What the script creates:

- ✅ Complete NestJS service structure
- ✅ Controller with CRUD endpoints
- ✅ Service class with business logic
- ✅ Module configuration
- ✅ Dockerfile for containerization
- ✅ Railway deployment configuration
- ✅ Updates shared library constants
- ✅ Configures proper routing

### Generated structure:
```
services/products/
├── src/
│   ├── products.controller.ts    # API endpoints
│   ├── products.service.ts       # Business logic
│   ├── products.module.ts        # Module configuration
│   └── main.ts                   # Application bootstrap
├── Dockerfile                    # Container configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── nest-cli.json                 # NestJS CLI config
└── railway.json                  # Railway deployment config
```

### Default endpoints created:
- `GET /products/v1` - List all products
- `GET /products/v1/health` - Health check
- `GET /products/v1/:id` - Get specific product
- `POST /products/v1` - Create new product

After creating a service, just run `npm run dev` to start all services including your new one!

## Design

Atlas is architected around a **dynamic gateway** that operates as a living service registry. Rather than static configuration, services self-register and self-discover, creating a truly plug-and-play microservices ecosystem.

### Dynamic Service Discovery

At the heart of Atlas lies the **Registry Service** - a sophisticated service discovery mechanism that enables:

**🔌 Plug-and-Play Architecture**
- Services automatically register themselves on startup
- No manual gateway configuration required
- New services are instantly discoverable and routable

**💓 Health Monitoring & Self-Healing**
- Continuous health checks with configurable heartbeat intervals
- Automatic deregistration of unhealthy services
- Real-time service status monitoring

**🎯 Zero-Configuration Routing**
- Services declare their own routes and versions
- Gateway dynamically builds routing tables
- Intelligent request forwarding based on service availability

### Service Registration Flow

```typescript
// Each service automatically registers itself
const registration = {
  name: 'users',
  port: 8002,
  version: 'v1',
  healthEndpoint: '/users/v1/health',
  metadata: { description: 'User management service' }
};

// POST to gateway/registry/register
await gateway.register(registration);
```

**What makes this profound:**

1. **Services are autonomous** - They know who they are, what they do, and how to connect
2. **Gateway is reactive** - It adapts to the services that exist, not the other way around  
3. **Zero downtime deployments** - Services can register/deregister without affecting others
4. **Infinite scalability** - Add new services by simply starting them, no configuration changes needed

This design transforms traditional microservices from static, pre-configured networks into **living, breathing ecosystems** that grow and adapt organically. Each service carries its own identity and automatically integrates into the larger system - making Atlas truly greater than the sum of its parts.


## Docker Deployment

Atlas services are containerized and ready for deployment.

### Building Individual Services

Each service has its own Dockerfile for independent deployment:

```bash
# Build gateway
docker build -f gateway/Dockerfile -t atlas-gateway .
docker run -p 3000:3000 atlas-gateway

# Build auth service
docker build -f services/auth/Dockerfile -t atlas-auth .
docker run -p 8003:8003 atlas-auth

# Build posts service
docker build -f services/posts/Dockerfile -t atlas-posts .
docker run -p 8001:8001 atlas-posts

# Build users service
docker build -f services/users/Dockerfile -t atlas-users .
docker run -p 8002:8002 atlas-users
```

### Docker Compose (Coming Soon)

For local development with Docker, a docker-compose.yml will orchestrate all services together.

### Railway Deployment

Atlas is optimized for Railway with smart deployments:

1. **Automatic Service Detection**: New services are automatically configured for deployment
2. **Smart Deployments**: Only changed services are redeployed  
3. **Independent Scaling**: Each service can be scaled independently
4. **Environment Management**: Service-specific environment variables

**Setup Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link services
railway login
cd gateway && railway link
cd ../services/auth && railway link
# Repeat for each service
```

Each service deploys independently with its own logs, metrics, and scaling configuration.