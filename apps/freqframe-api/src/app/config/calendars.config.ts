import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

export default () => {
  const env = process.env.NODE_ENV || 'local';
  const path = join(process.cwd(), `apps/freqframe-api/src/app/config/calendars.${env}.yaml`);
  return yaml.load(readFileSync(path, 'utf8'));
};
