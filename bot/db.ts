import Database from 'better-sqlite3';

const db = new Database('slots.db');

export interface Trainer {
  id: number;
  name: string;
  telegramId: number;
}

export interface Slot {
  id: number;
  trainerId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // В минутах
  status: 'free' | 'booked';
  userId: number | null;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    telegramId INTEGER UNIQUE
  );
  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainerId INTEGER,
    date TEXT,
    time TEXT,
    duration INTEGER DEFAULT 60,
    status TEXT DEFAULT 'free',
    userId INTEGER,
    FOREIGN KEY (trainerId) REFERENCES trainers(id)
  );
`);

export default db;