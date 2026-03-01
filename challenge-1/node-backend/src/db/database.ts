import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'procurement.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS procurement_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requestor_name TEXT NOT NULL,
    title TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    vat_id TEXT NOT NULL,
    commodity_group_id TEXT NOT NULL,
    commodity_group_name TEXT NOT NULL,
    department TEXT NOT NULL,
    total_cost REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    position_description TEXT NOT NULL,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    unit TEXT NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE
  );
`);

export default db;
