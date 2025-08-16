
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './appLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, '../logs/availability.log.jsonl');


export function logAvailabilities(entry) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  logger.info(`[LOGGER] Log entry written to ${LOG_FILE}`);
  } catch (error) {
  logger.error(`[LOGGER] Failed to write log entry: ${error.message}`);
  }
}
