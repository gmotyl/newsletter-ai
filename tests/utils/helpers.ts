import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Creates a temporary directory for testing
 */
export async function createTempDir(prefix = 'newsletter-ai-test-'): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  return tempDir;
}

/**
 * Recursively removes a directory and its contents
 */
export async function cleanupDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
}

/**
 * Reads a fixture file
 */
export async function readFixture(filename: string): Promise<string> {
  const fixturePath = path.join(__dirname, '..', 'fixtures', filename);
  return await fs.readFile(fixturePath, 'utf-8');
}

/**
 * Parses a JSON fixture file
 */
export async function loadJsonFixture<T>(filename: string): Promise<T> {
  const content = await readFixture(filename);
  return JSON.parse(content);
}

/**
 * Copies a fixture file to a destination
 */
export async function copyFixture(filename: string, destPath: string): Promise<void> {
  const content = await readFixture(filename);
  await fs.writeFile(destPath, content, 'utf-8');
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads and parses a YAML file
 */
export async function readYaml(filePath: string): Promise<any> {
  const yaml = await import('js-yaml');
  const content = await fs.readFile(filePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Creates a test environment with temporary directories
 */
export async function createTestEnv() {
  const tempDir = await createTempDir();
  const linksYamlPath = path.join(tempDir, 'LINKS.yaml');
  const outputDir = path.join(tempDir, 'output');
  await fs.mkdir(outputDir, { recursive: true });

  return {
    tempDir,
    linksYamlPath,
    outputDir,
    cleanup: async () => await cleanupDir(tempDir),
  };
}
