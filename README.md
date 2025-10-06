# Atlas - Microservices Architecture

A modular NestJS microservices architecture with independent services and a dynamic API gateway. This repository showcases the monorepo version, however, you may deploy each service separately to their own repository.

## Architecture Overview

```
/atlas
├── services/           # All microservices (including gateway)
│   ├── gateway/        # API Gateway service
│   ├── auth/           # Authentication service
│   └── user/           # User management service
└── shared/             # Shared library used by all services
```

## Features

- 🚀 True microservice architecture with independent services
- 🔄 Dynamic service discovery and management
- 🌐 Centralized API Gateway with versioning support
- 📚 Shared library (`@atlas/shared`) with types, enums, and utilities
- 🔍 Comprehensive logging with service identification
- ⚡ Ready for Railway deployment
- 🛠️ Automated service creation and management
- 💻 Unified development environment with smart orchestration
- 🔨 Independent build and deployment capabilities
- 📦 Service-specific dependency management with shared library linking
- 🧪 Vitest testing configuration for each service

## Shared Library (`@atlas/shared`)

Atlas includes a comprehensive shared library that provides:

- **Type Definitions**: Common interfaces and types used across services
- **Service Enums**: Centralized service names and API versions
- **Registry Types**: Service registration and health check interfaces
- **Utilities**: Common helper functions and utilities

All services automatically link to the shared library via `file:../../shared` dependency, ensuring type safety and consistency across the entire microservices ecosystem.

## Tech Stack

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)

## Running Locally

Get the Atlas microservices running on your local machine in three simple steps:

> [!IMPORTANT]
> This project assumes you have installed [Node.js](https://nodejs.org/en) and [Git](https://git-scm.com/) in your machine. Without these, the following instructions might not make sense.

1. **After cloning the repository, install the dependencies**
   ```bash
   npm install
   ```

2. **Initialize all .env across all services**   
   ```bash
   npm run env
   ```

> [!WARNING]  
> Before running the command below, this project assumes you have installed the Nest.js CLI globally. If not, install it by running the following command. Learn more about Nest.js [here.](https://nestjs.com/)
> ```bash
> npm install -g @nestjs/cli
> ```

3. **Start all services**
   ```bash
   npm run dev
   ```

> [!NOTE]  
> You may also have the option to indicate specific services only by adding them as args in the command. Make sure to separate them with a single 'space'.
> ```bash
> npm run start user   # User Service will only run (along with gateway)
> ```

This will:
- Install dependencies for all services (including gateway)
- Build all projects
- Start the gateway first (Default Port: 3000)
- Wait for gateway to be ready
- Start all other services with proper delays
- Display logs with service identification

## Testing Endpoints
Included in this repository is a Postman collection JSON file that you can import easily. As of this writing, its filename is 

```
atlas.postman_collection.json
```

## Creating New Services

Atlas includes an automated service creation script that generates all the necessary boilerplate:

### Usage

```bash
npm run create-service [service-name] [port]
```

**Example:**
```bash
npm run create-service products 8069
```

### What the script creates:

- ✅ Complete NestJS service structure
- ✅ Controller with CRUD endpoints using `@atlas/shared` types
- ✅ Service class with business logic
- ✅ Module configuration with ConfigModule
- ✅ Vitest testing configuration
- ✅ Updates shared library Services enum
- ✅ Configures proper routing and service registration
- ✅ Environment files (.env and .env.example)

### Generated structure:
```
services/products/
├── src/
│   ├── products.controller.ts    # API endpoints with @atlas/shared types
│   ├── products.service.ts       # Business logic
│   ├── products.module.ts        # Module configuration
│   └── main.ts                   # Application bootstrap with auto-registration
│
├── .env                          # Environment variables
├── .env.example                  # Environment template
│
├── Dockerfile                    # Dockerfile (with .dockerignore)
│
├── package.json                  # Dependencies with @atlas/shared
├── tsconfig.json                 # TypeScript config
├── nest-cli.json                 # NestJS CLI config
│
└── vitest.config.ts              # Testing configuration
```

### Default endpoints created:
- `GET /products/v1` - List all products
- `GET /products/v1/health` - Health check
- `GET /products/v1/:id` - Get specific product
- `POST /products/v1` - Create new product

After creating a service, just run `npm run dev` to start all services including your new one!

**Note:** The script automatically:
- Installs dependencies for all services to ensure `@atlas/shared` is properly linked
- Builds the shared library with the new service enum
- Starts the gateway first, then all other services

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
  host: 'user-service',
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

Atlas uses a centralized Docker approach with docker-compose for orchestration.

### Building and Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```
