import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

const TEMPLATES_DIR = join(__dirname, 'templates');
const ROOT_DIR = resolve(__dirname, '..');

/**
 * Converts a hyphenated service name to PascalCase
 * @param str - The string to convert (e.g., "test-improved" -> "TestImproved")
 * @returns The PascalCase string
 */
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Converts a hyphenated service name to camelCase
 * @param str - The string to convert (e.g., "test-improved" -> "testImproved")
 * @returns The camelCase string
 */
function toCamelCase(str: string): string {
  const pascalCase = toPascalCase(str);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * Updates the Services enum for type safety
 * @param serviceName - The name of the service to add to the Services enum
 */
function updateSharedConstants(serviceName: string) {
  const servicesEnumPath = join(ROOT_DIR, 'shared/enums/services.enum.ts');
  let content = readFileSync(servicesEnumPath, 'utf-8');
  
  // Check if service already exists in enum
  const serviceConstant = serviceName.toUpperCase().replace(/-/g, '_');
  if (content.includes(`${serviceConstant} = '${serviceName}'`)) {
    console.log(`Service ${serviceName} already exists in Services enum`);
    return;
  }
  
  // Add new service to Services enum before the closing brace
  const lastBrace = content.lastIndexOf('}');
  const serviceEntry = `    ${serviceConstant} = '${serviceName}',\n`;
  content = content.slice(0, lastBrace) + serviceEntry + content.slice(lastBrace);
  
  writeFileSync(servicesEnumPath, content);
  console.log(`✅ Added ${serviceName} to Services enum`);
}

/**
 * Creates the service files
 * @param serviceName - The name of the service to create the files for
 * @param port - The port of the service to create the files for
 */
function createServiceFiles(serviceName: string, port: number) {
  const serviceDir = join(ROOT_DIR, 'services', serviceName);
  const srcDir = join(serviceDir, 'src');
  
  // Create directories
  mkdirSync(srcDir, { recursive: true });
  
  // Get REG_KEY from gateway .env file if it exists
  const gatewayEnvPath = join(ROOT_DIR, 'gateway/.env');
  let regKey = 'your_registry_key_here'; // Default for .env.example
  let actualRegKey = 'your_registry_key_here'; // Default for .env
  
  if (existsSync(gatewayEnvPath)) {
    try {
      const gatewayEnvContent = readFileSync(gatewayEnvPath, 'utf-8');
      const regKeyMatch = gatewayEnvContent.match(/REG_KEY=(.+)/);
      if (regKeyMatch && regKeyMatch[1]) {
        actualRegKey = regKeyMatch[1].trim();
        console.log(`📋 Copying REG_KEY from gateway .env file`);
      }
    } catch (error) {
      console.warn('⚠️  Could not read gateway .env file, using default REG_KEY');
    }
  }

  // Create service files from templates
  const templates = {
    'controller.ts': readFileSync(join(TEMPLATES_DIR, 'controller.template.ts'), 'utf-8'),
    'service.ts': readFileSync(join(TEMPLATES_DIR, 'service.template.ts'), 'utf-8'),
    'module.ts': readFileSync(join(TEMPLATES_DIR, 'module.template.ts'), 'utf-8'),
    'main.ts': readFileSync(join(TEMPLATES_DIR, 'main.template.ts'), 'utf-8'),
    'package.json': readFileSync(join(TEMPLATES_DIR, 'package.template.json'), 'utf-8'),
    'tsconfig.json': readFileSync(join(TEMPLATES_DIR, 'tsconfig.template.json'), 'utf-8'),
    'nest-cli.json': readFileSync(join(TEMPLATES_DIR, 'nest-cli.template.json'), 'utf-8'),
    'vitest.config.ts': readFileSync(join(TEMPLATES_DIR, 'vitest.config.template.ts'), 'utf-8'),
    'Dockerfile': readFileSync(join(TEMPLATES_DIR, 'Dockerfile.template'), 'utf-8'),
    '.env': readFileSync(join(TEMPLATES_DIR, 'env.template'), 'utf-8'),
    '.env.example': readFileSync(join(TEMPLATES_DIR, 'env.template'), 'utf-8'),
  };
  
  // Replace placeholders and write files
  Object.entries(templates).forEach(([filename, content]) => {
    // Use different REG_KEY values for .env vs .env.example
    const regKeyValue = filename === '.env' ? actualRegKey : regKey;
    
    let processedContent = content
      .replace(/{{service}}/g, serviceName)
      .replace(/{{serviceCamel}}/g, toCamelCase(serviceName))
      .replace(/{{ServiceName}}/g, toPascalCase(serviceName))
      .replace(/{{SERVICE_NAME}}/g, serviceName.toUpperCase())
      .replace(/{{SERVICE_PORT}}/g, port.toString())
      .replace(/{{REG_KEY}}/g, regKeyValue);
      
    const targetPath = ['package.json', 'tsconfig.json', 'nest-cli.json', 'Dockerfile', '.env', '.env.example'].includes(filename)
      ? join(serviceDir, filename)
      : filename === 'main.ts'
        ? join(srcDir, 'main.ts')
        : join(srcDir, `${serviceName}.${filename}`);
      
    writeFileSync(targetPath, processedContent);
  });
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npm run create-service <service-name> <port>');
    console.error('Example: npm run create-service raffle 8004');
    process.exit(1);
  }

  const serviceName = args[0];
  const port = parseInt(args[1]);

  if (isNaN(port) || port < 1024 || port > 65535) {
    console.error('Port must be a valid number between 1024 and 65535');
    process.exit(1);
  }

  // Check if port is already defined in .env or .env.example
  try {
    const envPath = join(ROOT_DIR, '.env');
    const envExamplePath = join(ROOT_DIR, '.env.example');
    const portRegex = new RegExp(`_SERVICE_PORT=${port}\\b`);

    // Check .env
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      if (portRegex.test(envContent)) {
        console.error(`Port ${port} is already used by another service in .env`);
        process.exit(1);
      }
    }

    // Check .env.example
    if (existsSync(envExamplePath)) {
      const envExampleContent = readFileSync(envExamplePath, 'utf-8');
      if (portRegex.test(envExampleContent)) {
        console.error(`Port ${port} is already used by another service in .env.example`);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error checking port availability in environment files:', error);
    process.exit(1);
  }

  // Check if port is actively in use
  try {
    execSync(`lsof -i :${port} -P -n`, { stdio: 'ignore' });
    console.error(`Port ${port} is currently in use by another process`);
    process.exit(1);
  } catch (error) {
    // Port is available (lsof command failed which means no process is using this port)
  }

  console.log(`Creating new service: ${serviceName} on port ${port}`);

  try {
    createServiceFiles(serviceName, port);
    updateSharedConstants(serviceName);

    // Rebuild shared library to make new enum available
    console.log('🔄 Rebuilding shared library...');
    execSync('cd shared && npm run build', { stdio: 'inherit' });

    console.log('✅ Service created successfully!');
    console.log(`\nTo start working with your new service:
1. npm install
2. npm run build
3. npm start

Your service will be available at:
http://localhost:3000/${serviceName}/v1 (via gateway)
http://localhost:${port}/${serviceName}/v1 (direct)
`);
  } catch (error) {
    console.error('Error creating service:', error);
    process.exit(1);
  }
}

main();
