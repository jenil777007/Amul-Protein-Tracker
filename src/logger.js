import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, '../logs/availability.log.jsonl');


export function logAvailability(entry) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    console.log(`[LOGGER] Log entry written to ${LOG_FILE}`);
  } catch (error) {
    console.error(`[LOGGER] Failed to write log entry: ${error.message}`);
  }
}
