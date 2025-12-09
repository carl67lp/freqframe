import { readFileSync } from 'fs';
import { join } from 'path';

export default () => {
  const env = process.env.NODE_ENV || 'local';
  const path = join(process.cwd(), `src/app/config/calendars.${env}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
};
