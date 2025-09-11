# Backend Microservices Template
A public template for a Modular Microservices Hub with dynamic service loading. Built with TypeScript, Nest.js, and Vitest. Features plug-and-play service architecture and versioned API endpoints.

## 🚀 Features

- **Plug-and-Play Architecture**: Add new services simply by creating a folder in `/services`
- **Automatic Service Discovery**: Gateway automatically discovers and mounts services at `/{service-slug}/v1`
- **Modern Stack**: Built with Node.js ≥20, TypeScript, Nest.js, and Vitest
- **Development Ready**: ESLint, Prettier, and hot reload configured
- **Deployment Ready**: Dockerfile with Railway PORT support included
- **Type Safe**: Full TypeScript support across all services

## 📁 Project Structure

```
microservices/
├── src/                          # Gateway application
│   ├── app.module.ts            # Main application module
│   ├── app.controller.ts        # Root controller (/, /health)
│   ├── app.service.ts           # Application service
│   ├── main.ts                  # Application entry point
│   └── service-loader/          # Dynamic service loading
│       ├── service-loader.module.ts
│       └── service-loader.service.ts
├── services/                    # Modular services
│   └── users/                   # Example users service
│       ├── users.module.ts      # Service module
│       ├── users.controller.ts  # Service controller
│       ├── users.service.ts     # Service implementation
│       ├── users.controller.spec.ts  # Controller tests
│       └── users.service.spec.ts     # Service tests
├── Dockerfile                   # Container deployment
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🛠️ Getting Started

### Prerequisites

- Node.js ≥20 (LTS recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:louislemsic/microservices.git # or your actual repo link
cd microservices

# Install dependencies
npm install

# Start development server
npm run start:dev
```

The gateway will start on `http://localhost:3000` and automatically discover services.

### Available Endpoints

- **`GET /`** - Atlas information and available services
- **`GET /health`** - Health check endpoint
- **`GET /users/v1`** - Example users service (auto-discovered)

## 🔌 Adding New Services

Atlas automatically discovers and mounts any service placed in the `/services` directory. Each service should follow this structure:

### 1. Create Service Directory

```bash
mkdir services/your-service
```

### 2. Create Service Files

**`services/your-service/your-service.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { YourServiceController } from './your-service.controller';
import { YourServiceService } from './your-service.service';

@Module({
  controllers: [YourServiceController],
  providers: [YourServiceService],
  exports: [YourServiceService],
})
export class YourServiceModule {}
```

**`services/your-service/your-service.controller.ts`**
```typescript
import { Controller, Get } from '@nestjs/common';
import { YourServiceService } from './your-service.service';

@Controller('your-service/v1')
export class YourServiceController {
  constructor(private readonly yourService: YourServiceService) {}

  @Get()
  findAll() {
    return this.yourService.findAll();
  }
}
```

**`services/your-service/your-service.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class YourServiceService {
  findAll() {
    return { message: 'Hello from your service!' };
  }
}
```

### 3. Register Service (Manual)

Currently, services need to be manually imported in `src/service-loader/service-loader.module.ts`:

```typescript
import { YourServiceModule } from '../../services/your-service/your-service.module';

@Module({})
export class ServiceLoaderModule {
  static forRoot(): DynamicModule {
    const imports = [UsersModule, YourServiceModule]; // Add your module here
    // ...
  }
}
```

### 4. Restart Development Server

The service will be automatically available at `/your-service/v1`!

## 🧪 Testing

Atlas uses Vitest for testing (Jest has been completely removed).

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Each service should include:
- `*.service.spec.ts` - Service unit tests
- `*.controller.spec.ts` - Controller unit tests

## 🎨 Code Quality

### Linting
```bash
npm run lint        # Check and fix linting issues
```

### Formatting
```bash
npm run format      # Format code with Prettier
```

## 🚢 Deployment

### Local Production Build
```bash
npm run build       # Build the application
npm run start:prod  # Start production server
```

### Docker Deployment
```bash
# Build image
docker build -t atlas .

# Run container
docker run -p 3000:3000 atlas
```

### Railway Deployment
The application is configured to work with Railway out of the box:
- PORT environment variable support
- Health check endpoint at `/health`
- Production-ready Dockerfile

## 🔧 Configuration

### Environment Variables

Atlas supports a flexible environment configuration system with both root-level and service-specific variables:

#### Root Configuration
Place your core environment variables in the root `.env` file:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/atlas
# ... other core variables
```

#### Service-Specific Configuration
Each service can have its own `.env` file in its directory (`services/your-service/.env`):
```env
# Override root variables or add service-specific ones
DATABASE_URL=postgresql://localhost:5432/your_service_db
SERVICE_SPECIFIC_VAR=value
```

#### Configuration Priority
1. Service-specific variables override root variables
2. Root `.env` provides default values
3. Environment variables take precedence over file configurations

#### Core Variables
- `PORT` - Server port (default: 3000, Railway compatible)
- `NODE_ENV` - Environment (development/production)

### TypeScript Configuration

- Modern ES2022 target
- Decorator support enabled
- Strict type checking configured
- Path aliases for clean imports

### ESLint & Prettier

- TypeScript-first configuration
- Automatic code formatting
- Import organization
- Consistent code style

## 🤝 Contributing

1. Create a new service in `/services`
2. Follow the established patterns
3. Add comprehensive tests
4. Ensure linting passes
5. Update documentation

## 📝 Architecture Notes

**Service Discovery**: Atlas uses a simple but effective service loader that scans the `/services` directory and automatically imports/mounts service modules.

**Routing Convention**: All services are mounted at `/{service-name}/v1` to provide consistent versioning.

**Modular Design**: Each service is completely self-contained with its own module, controller, service, and tests.

**Type Safety**: Full TypeScript support ensures type safety across service boundaries.

**Testing Strategy**: Each service includes unit tests for both controllers and services using Vitest.

---
