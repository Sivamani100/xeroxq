import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * QA Reliability Script: Environment Integrity Sync
 * Purpose: Ensures local developer environments match MNC production requirements.
 * This prevents deployment failures due to missing configuration keys.
 */

const projectRoot = join(__dirname, '..');
const examplePath = join(projectRoot, '.env.example');
const localPath = join(projectRoot, '.env.local');

console.log('🔍 Starting QA Environment Integrity Audit...');

if (!existsSync(examplePath)) {
  console.error('❌ FAILED: .env.example is missing. This violates MNC documentation standards.');
  process.exit(1);
}

if (!existsSync(localPath)) {
  console.warn('⚠️ WARNING: .env.local is missing. Local development may be unstable.');
  process.exit(0);
}

const exampleContent = readFileSync(examplePath, 'utf-8');
const localContent = readFileSync(localPath, 'utf-8');

const getKeys = (content: string) => {
  return content
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim());
};

const requiredKeys = getKeys(exampleContent);
const localKeys = new Set(getKeys(localContent));

const missingKeys = requiredKeys.filter(key => !localKeys.has(key));

if (missingKeys.length > 0) {
  console.error('\n❌ QA ALERT: Your .env.local is missing required keys:');
  missingKeys.forEach(key => console.log(`   - ${key}`));
  console.log('\nPlease sync your environment with .env.example before proceeding.');
  process.exit(1);
} else {
  console.log('✅ QA SUCCESS: Environment integrity verified. All required keys are present.');
}
