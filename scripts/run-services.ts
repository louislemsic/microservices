import { readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { spawn } from 'child_process';
import * as http from 'http';

const ROOT_DIR = resolve(__dirname, '..');
const SERVICES_DIR = join(ROOT_DIR, 'services');
const GATEWAY_DIR = join(SERVICES_DIR, 'gateway');
const SHARED_DIR = join(ROOT_DIR, 'shared');

/**
 * Simplified development script for Atlas microservices
 * Starts gateway first, then auto-discovers and starts all services in /services folder
 */

async function startDevelopmentEnvironment() {
  console.log('🚀 Starting Atlas Development Environment\n');

  // 0. Ensure shared library is built first
  console.log('🔧 Building shared library...');
  await runSharedBuild();
  console.log('✅ Shared library built!\n');

  // 0.5. Install dependencies for all services to ensure @atlas/shared is properly linked
  console.log('📦 Installing dependencies for all services...');
  await installServiceDependencies();
  console.log('✅ All service dependencies installed!\n');

  const processes: any[] = [];

  // 1. Start Gateway first
  console.log('📡 Starting gateway...');
  const gatewayProcess = startService('gateway', GATEWAY_DIR);
  processes.push(gatewayProcess);

  // 2. Wait for gateway to be ready
  console.log('⏳ Waiting for gateway to be ready...');
  await waitForGateway();
  console.log('✅ Gateway is ready!\n');

  // 3. Auto-discover services in /services folder (excluding gateway since it's already started)
  const serviceNames = discoverServices();
  const otherServices = serviceNames.filter(name => name !== 'gateway');
  console.log(`📂 Found ${serviceNames.length} services: ${serviceNames.join(', ')}`);
  console.log(`🔧 Starting ${otherServices.length} additional services: ${otherServices.join(', ')}\n`);

  // 4. Start each service (excluding gateway)
  for (const serviceName of otherServices) {
    console.log(`🔧 Starting ${serviceName} service...`);
    const servicePath = join(SERVICES_DIR, serviceName);
    const serviceProcess = startService(serviceName, servicePath);
    processes.push(serviceProcess);
    
    // Small delay to avoid registration race conditions
    await new Promise(resolve => setTimeout(resolve, 700));
  }

  console.log('\n🎉 All services started! Press Ctrl+C to stop all services.\n');

  // 5. Handle graceful shutdown
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

function discoverServices(): string[] {
  if (!existsSync(SERVICES_DIR)) {
    console.warn('⚠️  Services directory not found');
    return [];
  }

  return readdirSync(SERVICES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => {
      // Make sure it has a package.json
      return existsSync(join(SERVICES_DIR, name, 'package.json'));
    });
}

function startService(serviceName: string, servicePath: string) {
  const process = spawn('npm', ['run', 'start:dev'], {
    cwd: servicePath,
    stdio: 'pipe',
    shell: true
  });

  // Pipe stdout with service prefix
  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`[${serviceName}] ${line}`);
      }
    });
  });

  // Pipe stderr with service prefix
  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`[${serviceName}] ${line}`);
      }
    });
  });

  // Handle service crashes
  process.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`💥 [${serviceName}] Service crashed with exit code ${code}`);
    }
  });

  return process;
}

async function waitForGateway(maxRetries = 30, retryInterval = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000/ping', (res) => {
          if (res.statusCode === 200) {
            resolve(true);
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

async function runSharedBuild(): Promise<void> {
  return runCommand('npm', ['run', 'build'], SHARED_DIR);
}

async function installServiceDependencies(): Promise<void> {
  const serviceNames = discoverServices();
  
  // Install dependencies for all services in parallel
  const installPromises = serviceNames.map(serviceName => {
    const servicePath = join(SERVICES_DIR, serviceName);
    console.log(`📦 Installing dependencies for ${serviceName}...`);
    return runCommand('npm', ['install'], servicePath);
  });
  
  await Promise.all(installPromises);
}

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

// Start the development environment
startDevelopmentEnvironment().catch(error => {
  console.error('💥 Failed to start development environment:', error);
  process.exit(1);
});
