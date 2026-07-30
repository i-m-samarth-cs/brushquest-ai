import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'brushquest.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatarSeed INTEGER NOT NULL
    )`);

    // Create Progress table
    db.run(`CREATE TABLE IF NOT EXISTS progress (
      userId INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`);
  }
});

export default db;
