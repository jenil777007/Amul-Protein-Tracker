import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, '../logs/availability.log.jsonl');

export function logAvailability(entry) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}
