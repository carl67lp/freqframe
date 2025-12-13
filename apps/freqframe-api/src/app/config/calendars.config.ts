import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

export default () => {
  const env = process.env.NODE_ENV || 'local';
  // Try multiple paths: Docker container, then development
  const paths = [
    join('/app/config', `calendars.${env}.yaml`),
    join(process.cwd(), `apps/freqframe-api/src/app/config/calendars.${env}.yaml`),
  ];
  
  for (const filePath of paths) {
    try {
      return yaml.load(readFileSync(filePath, 'utf8'));
    } catch (e) {
      // Continue to next path
    }
  }
  
  throw new Error(`No calendars config found for env: ${env}`);
};
