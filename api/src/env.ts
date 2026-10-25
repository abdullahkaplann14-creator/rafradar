import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, '..', '..');

const explicitDbPath = process.env.DB_PATH;
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Bozuk/eksik .env varsayılanlarla devam etsin.
  }
}
if (explicitDbPath) process.env.DB_PATH = explicitDbPath;

export const API_PORT = Number(process.env.API_PORT) || 4000;
export const DB_PATH = process.env.DB_PATH
  ? path.resolve(ROOT_DIR, process.env.DB_PATH)
  : path.join(ROOT_DIR, 'api', 'data', 'rafradar.db');
