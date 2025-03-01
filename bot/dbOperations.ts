import db, { type Trainer, type Slot } from './db.ts';

export function addTrainer(name: string, telegramId: number): void {
  db.prepare('INSERT OR IGNORE INTO trainers (name, telegramId) VALUES (?, ?)').run(name, telegramId);
}

export function getTrainerByTelegramId(telegramId: number): Trainer | undefined {
  return db.prepare('SELECT * FROM trainers WHERE telegramId = ?').get(telegramId) as Trainer | undefined;
}

export function createSlot(trainerId: number, date: string, time: string, duration: number): void {
  db.prepare('INSERT INTO slots (trainerId, date, time, duration) VALUES (?, ?, ?, ?)').run(trainerId, date, time, duration);
}

export function getSlotsByTrainerId(trainerId: number): Slot[] {
  return db.prepare('SELECT * FROM slots WHERE trainerId = ?').all(trainerId) as Slot[];
}

export function getFreeSlotsByTrainerId(trainerId: number): Slot[] {
  return db.prepare('SELECT * FROM slots WHERE trainerId = ? AND status = "free"').all(trainerId) as Slot[];
}

export function getSlotById(slotId: number): Slot | undefined {
  return db.prepare('SELECT * FROM slots WHERE id = ?').get(slotId) as Slot | undefined;
}

export function bookSlot(slotId: number, userId: number): void {
  db.prepare('UPDATE slots SET status = "booked", userId = ? WHERE id = ?').run(userId, slotId);
}