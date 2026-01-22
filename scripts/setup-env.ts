#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

// Service configurations with their ports
const SERVICES_DIR = path.join(__dirname, '..', 'services');

// Default Values
const HOSTNAME = "localhost";
const REGISTRY_PORT = 3001;
const REG_KEY = 'your_registry_key_here';

/**
 * Reads an environment file
 * @param filePath - The path to the environment file
 * @returns The environment variables
 */
function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const envVars: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

/**
 * Reads the service-specific environment variables
 * @param servicePath - The path to the service
 * @returns The service-specific environment variables
 */
function readServiceSpecificVars(servicePath: string): string {
  const serviceEnvExamplePath = path.join(servicePath, '.env.example');
  
  if (!fs.existsSync(serviceEnvExamplePath)) {
    return '# Add any service-specific environment variables here\n';
  }
  
  const content = fs.readFileSync(serviceEnvExamplePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find the start of service-specific configuration
  let serviceSpecificStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('# Service-specific Configuration')) {
      serviceSpecificStart = i;
      break;
    }
  }
  
  if (serviceSpecificStart === -1) {
    return '# Add any service-specific environment variables here\n';
  }
  
  // Extract service-specific variables (skip the comment line)
  const serviceSpecificLines = lines.slice(serviceSpecificStart + 1);
  return serviceSpecificLines.join('\n').trim() + '\n';
}

/**
 * Gets the host and port for a service
 * @param servicePath - The path to the service
 * @returns The host and port for the service
 */
function getHostAndPort(servicePath: string): { host: string, port: string } {
  const serviceEnvPath = path.join(servicePath, '.env.example');
  const serviceEnv = readEnvFile(serviceEnvPath);
  return { host: serviceEnv.HOSTNAME || HOSTNAME, port: serviceEnv.PORT || "3000" };
}

/**
 * Generates the environment content for a service
 * @param serviceName - The name of the service
 * @param gatewayEnv - The gateway environment variables
 * @param servicePath - The path to the service
 * @returns The environment content for the service
 */
function generateEnvContent(serviceName: string, gatewayEnv: Record<string, string>, servicePath: string): string {
  const capitalizedServiceName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
  const { host, port } = getHostAndPort(servicePath);
  const serviceSpecificVars = readServiceSpecificVars(servicePath);
  
  return `# ${capitalizedServiceName} Service Configuration
HOSTNAME=${host || HOSTNAME}
PORT=${port}

# Gateway Configuration
GATEWAY_HOSTNAME=${gatewayEnv.HOSTNAME || HOSTNAME}
GATEWAY_PORT=${gatewayEnv.GATEWAY_PORT || '3000'}

# Registry Configuration
REGISTRY_PORT=${gatewayEnv.REGISTRY_PORT || REGISTRY_PORT}
REGISTRY_KEY=${gatewayEnv.REGISTRY_KEY || REG_KEY}

# Service-specific Configuration
${serviceSpecificVars}`;
}

/**
 * Sets up the gateway environment
 * @returns The gateway environment variables
 */
function setupGatewayEnv(): Record<string, string> {
  const gatewayPath = path.join(__dirname, '..', 'services', 'gateway');
  const gatewayEnvPath = path.join(gatewayPath, '.env');
  const gatewayEnvExamplePath = path.join(gatewayPath, '.env.example');
  
  // Check if gateway has .env.example - abort if not
  if (!fs.existsSync(gatewayEnvExamplePath)) {
    console.error('❌ Gateway service MUST have a .env.example file!');
    console.error(`   Expected file: ${gatewayEnvExamplePath}`);
    process.exit(1);
  }
  
  console.log(`✅ Found gateway .env.example`);
  
  // Create .env for gateway if it doesn't exist (from .env.example)
  if (!fs.existsSync(gatewayEnvPath)) {
    const gatewayEnvExampleContent = fs.readFileSync(gatewayEnvExamplePath, 'utf-8');
    fs.writeFileSync(gatewayEnvPath, gatewayEnvExampleContent);
    console.log(`✅ Created .env for gateway from .env.example`);
  } else {
    console.log(`✅ Gateway .env already exists`);
  }
  
  // Read gateway's .env file
  const gatewayEnv = readEnvFile(gatewayEnvPath);
  console.log(`📖 Read gateway configuration`);
  
  return gatewayEnv;
}

/**
 * Sets up the service environment
 * @param serviceName - The name of the service
 * @param gatewayEnv - The gateway environment variables
 * @returns void
 */
function setupServiceEnv(serviceName: string, gatewayEnv: Record<string, string>): void {
  const servicePath = path.join(__dirname, '..', 'services', serviceName);
  const serviceEnvPath = path.join(servicePath, '.env');
  const serviceEnvExamplePath = path.join(servicePath, '.env.example');
  
  // Skip service if it doesn't have .env.example
  if (!fs.existsSync(serviceEnvExamplePath)) {
    console.log(`⏭️  Skipping ${serviceName} - no .env.example found`);
    return;
  }
  
  // Create .env for service
  const serviceEnvContent = generateEnvContent(serviceName, gatewayEnv, servicePath);
  fs.writeFileSync(serviceEnvPath, serviceEnvContent);
  console.log(`✅ Created .env for ${serviceName}`);
}

/**
 * Main function
 * @returns void
 */
function main(): void {
  // Check if a specific service was provided as argument
  const targetService = process.argv[2];
  
  try {
    // First, setup gateway and get its configuration
    const gatewayEnv = setupGatewayEnv();
    
    console.log(`🚀 Setting up environment file for ${targetService || 'all'} service/s.\n`);

    if (targetService) {
      // Setup only the target service
      const servicePath = path.join(SERVICES_DIR, targetService);
      
      if (!fs.existsSync(servicePath)) {
        console.error(`❌ Service '${targetService}' not found in services directory!`);
        process.exit(1);
      }
      
      if (targetService === 'gateway') {
        console.log('✅ Gateway environment already set up');
        return;
      } 

      // Setup the target service
      setupServiceEnv(targetService, gatewayEnv);
      
      console.log('\n🎉 Environment setup completed successfully!');
      console.log(`\nGenerated .env file:`);
      console.log(`  - services/${targetService}/.env`);
      
    } else {
      // Get all services from services directory
      const services = fs.readdirSync(SERVICES_DIR);

      // Then setup all other services
      services.forEach(service => {
        if (service !== 'gateway') {
          setupServiceEnv(service, gatewayEnv);
        }
      });
      
      console.log('\n🎉 Environment setup completed successfully!');
      console.log('\nGenerated .env files:');

      services.forEach(service => {
        console.log(`  - services/${service}/.env`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error setting up environment files:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
