import { readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

// Constants
const ROOT_DIR = resolve(__dirname, '..');
const SERVICES_DIR = join(ROOT_DIR, 'services');
const GATEWAY_DIR = join(SERVICES_DIR, 'gateway');
const SHARED_DIR = join(ROOT_DIR, 'shared');
const GATEWAY_HEALTH_URL = 'http://localhost:3000/health';
const SERVICE_START_DELAY = 500; // ms between service starts

/**
 * Enhanced development script for Atlas microservices
 * Supports selective service startup with argument parsing and validation
 */
async function main() {
  try {
    const command = parseCommand();
    const requestedServices = parseServiceArguments();
    const availableServices = discoverServices();
    
    console.log('🚀 Starting Atlas Development Environment\n');
    
    // Validate requested services
    validateServices(requestedServices, availableServices);
    
    // Determine which services to start and install/build dependencies only for those
    const servicesToStart = requestedServices.length > 0 
      ? requestedServices 
      : availableServices.filter(name => name !== 'gateway');
    
    // Always include gateway and shared in dependency installation and building
    const servicesToInstall = ['gateway', 'shared', ...servicesToStart];
    const servicesToBuild = ['gateway', 'shared', ...servicesToStart];
    
    // Install dependencies for selected services
    await installServiceDependencies(servicesToInstall);
    
    // Build selected services
    await buildServices(servicesToBuild);
    
    // Start services
    const processes = await startServices(requestedServices, command);
    
    // Setup graceful shutdown
    setupGracefulShutdown(processes);
    
    console.log('\n🎉 All services started! Press Ctrl+C to stop all services.\n');
    
  } catch (error) {
    console.error('💥 Failed to start development environment:', error);
    process.exit(1);
  }
}

/**
 * Parses the command from process arguments
 * @returns The command to run (start:dev, start:prod, build, test)
 */
function parseCommand(): string {
  const args = process.argv.slice(2);
  const command = args.find(arg => 
    ['start:dev', 'start:prod', 'build', 'test'].includes(arg)
  );
  
  if (!command) {
    console.error('❌ No valid command provided. Available commands: start:dev, start:prod, build, test');
    process.exit(1);
  }
  
  return command;
}

/**
 * Parses service arguments from command line
 * Deduplicates and sorts services alphabetically
 * @returns Array of unique service names
 */
function parseServiceArguments(): string[] {
  const args = process.argv.slice(2);
  const serviceArgs = args.filter(arg => 
    !arg.startsWith('--') && 
    !['start:dev', 'start:prod', 'build', 'test'].includes(arg)
  );
  
  // Remove duplicates and sort alphabetically
  const uniqueServices = [...new Set(serviceArgs)].sort();
  
  // If no services specified, return empty array (will start all)
  return uniqueServices;
}

/**
 * Discovers all available services in the services directory
 * @returns Array of available service names
 */
function discoverServices(): string[] {
  if (!existsSync(SERVICES_DIR)) {
    console.warn('⚠️  Services directory not found');
    return [];
  }

  return readdirSync(SERVICES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => existsSync(join(SERVICES_DIR, name, 'package.json')))
    .sort(); // Sort for consistent output
}

/**
 * Validates that all requested services exist
 * @param requestedServices - Services requested by user
 * @param availableServices - Services discovered in filesystem
 */
function validateServices(requestedServices: string[], availableServices: string[]): void {
  if (requestedServices.length === 0) {
    return; // No specific services requested, will start all
  }
  
  const invalidServices = requestedServices.filter(service => 
    !availableServices.includes(service)
  );
  
  if (invalidServices.length > 0) {
    console.error(`❌ Invalid services: ${invalidServices.join(', ')}`);
    console.log(`📋 Available services: ${availableServices.join(', ')}`);
    process.exit(1);
  }
}

/**
 * Builds specified services
 * @param services - Array of service names to build
 */
async function buildServices(services: string[]): Promise<void> {
  if (services.length === 0) {
    return;
  }
  
  console.log(`🔧 Building ${services.length} service(s): ${services.join(', ')}...`);
  
  const buildPromises = services.map(serviceName => {
    const servicePath = serviceName === 'shared' 
      ? SHARED_DIR 
      : join(SERVICES_DIR, serviceName);
    
    console.log(`🔧 Building ${serviceName}...`);
    return runCommand('npm', ['run', 'build'], servicePath);
  });
  
  await Promise.all(buildPromises);
  console.log('✅ Services built!\n');
}

/**
 * Installs dependencies for specified services
 * @param services - Array of service names to install dependencies for
 */
async function installServiceDependencies(services: string[]): Promise<void> {
  if (services.length === 0) {
    return;
  }
  
  console.log(`📦 Installing dependencies for ${services.length} service(s): ${services.join(', ')}...`);
  
  const installPromises = services.map(serviceName => {
    const servicePath = serviceName === 'shared' 
      ? SHARED_DIR 
      : join(SERVICES_DIR, serviceName);
    
    console.log(`📦 Installing dependencies for ${serviceName}...`);
    return runCommand('npm', ['install'], servicePath);
  });
  
  await Promise.all(installPromises);
  console.log('✅ Service dependencies installed!\n');
}

/**
 * Starts all requested services
 * @param requestedServices - Services to start (empty = all services)
 * @param command - Command to run (start:dev, start:prod, etc.)
 * @returns Array of started processes
 */
async function startServices(requestedServices: string[], command: string): Promise<ChildProcess[]> {
  const processes: ChildProcess[] = [];
  const availableServices = discoverServices();
  
  // Determine which services to start
  const servicesToStart = requestedServices.length > 0 
    ? requestedServices 
    : availableServices.filter(name => name !== 'gateway');
  
  // Log what services will be started
  if (servicesToStart.length > 0) {
    console.log('Running the following services:');
    console.log(`[${servicesToStart.join(', ')}]\n`);
  } else {
    console.log('📂 Found services:', availableServices.join(', '));
    console.log('🔧 Starting all services...\n');
  }
  
  // Always start gateway first
  console.log('📡 Starting gateway...');
  const gatewayProcess = startService('gateway', GATEWAY_DIR, command);
  processes.push(gatewayProcess);
  
  // Wait for gateway to be ready
  console.log('⏳ Waiting for gateway to be ready...');
  await waitForGateway();
  console.log('✅ Gateway is ready!\n');
  
  // Start other services
  for (const serviceName of servicesToStart) {
    console.log(`🔧 Starting ${serviceName} service...`);
    const servicePath = join(SERVICES_DIR, serviceName);
    const serviceProcess = startService(serviceName, servicePath, command);
    processes.push(serviceProcess);
    
    // Small delay to avoid registration race conditions
    await new Promise(resolve => setTimeout(resolve, SERVICE_START_DELAY));
  }
  
  return processes;
}

/**
 * Starts a single service
 * @param serviceName - Name of the service
 * @param servicePath - Path to the service directory
 * @param command - Command to run
 * @returns The spawned process
 */
function startService(serviceName: string, servicePath: string, command: string): ChildProcess {
  const npmCommand = command === 'start:prod' ? 'start:prod' : 'start:dev';
  
  const process = spawn('npm', ['run', npmCommand], {
    cwd: servicePath,
    stdio: 'pipe',
    shell: true
  });

  // Setup logging with service prefix
  setupServiceLogging(process, serviceName);
  
  // Handle service crashes
  process.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`💥 [${serviceName}] Service crashed with exit code ${code}`);
    }
  });

  return process;
}

/**
 * Sets up logging for a service process
 * @param process - The service process
 * @param serviceName - Name of the service
 */
function setupServiceLogging(process: ChildProcess, serviceName: string): void {
  // Pipe stdout with service prefix
  process.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`[${serviceName}] ${line}`);
      }
    });
  });

  // Pipe stderr with service prefix
  process.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`[${serviceName}] ${line}`);
      }
    });
  });
}

/**
 * Waits for the gateway to be ready
 * @param maxRetries - Maximum number of retry attempts
 * @param retryInterval - Interval between retries in ms
 */
async function waitForGateway(maxRetries = 30, retryInterval = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(GATEWAY_HEALTH_URL, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Gateway returned status ${res.statusCode}`));
          }
        });
        
        req.on('error', reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      
      return; // Gateway is ready
    } catch (error) {
      if (i === maxRetries - 1) {
        console.warn('⚠️  Gateway health check failed, but continuing anyway...');
        return;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
}

/**
 * Sets up graceful shutdown handling
 * @param processes - Array of processes to shutdown
 */
function setupGracefulShutdown(processes: ChildProcess[]): void {
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down all services...');
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
      }
    });
    console.log('✅ All services stopped. Goodbye!');
    process.exit(0);
  });
}

/**
 * Runs a command in a specific directory
 * @param command - Command to execute
 * @param args - Command arguments
 * @param cwd - Working directory
 * @returns Promise that resolves when command completes
 */
async function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

// Start the application
main();