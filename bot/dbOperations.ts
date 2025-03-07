import { db, type Trainer, type Slot } from './db.ts';

export function addTrainer(name: string, telegramId: number, isAdmin: boolean = false): void {
  db.prepare('INSERT OR IGNORE INTO trainers (name, telegramId, isAdmin) VALUES (?, ?, ?)').run(name, telegramId, isAdmin ? 1 : 0);
}

export function setAdminMode(telegramId: number): void {
  const trainer = getTrainerByTelegramId(telegramId);
  if (!trainer) {
    addTrainer(`Тренер_${telegramId}`, telegramId, true);
  } else {
    db.prepare('UPDATE trainers SET isAdmin = 1 WHERE telegramId = ?').run(telegramId);
  }
}

export function setClientMode(telegramId: number): void {
  const trainer = getTrainerByTelegramId(telegramId);
  if (trainer) {
    db.prepare('UPDATE trainers SET isAdmin = 0 WHERE telegramId = ?').run(telegramId);
  }
}

export function getTrainerByTelegramId(telegramId: number): Trainer | undefined {
  return db.prepare('SELECT * FROM trainers WHERE telegramId = ?').get(telegramId) as Trainer | undefined;
}

export function getAllTrainers(): Trainer[] {
  return db.prepare('SELECT * FROM trainers').all() as Trainer[];
}

export function createSlot(trainerId: number, date: string, time: string, duration: number): void {
  db.prepare('INSERT INTO slots (trainerId, date, time, duration) VALUES (?, ?, ?, ?)').run(trainerId, date, time, duration);
}

export function editSlot(slotId: number, date: string, time: string, duration: number): void {
  db.prepare('UPDATE slots SET date = ?, time = ?, duration = ? WHERE id = ?').run(date, time, duration, slotId);
}

export function deleteSlot(slotId: number): void {
  db.prepare('DELETE FROM slots WHERE id = ?').run(slotId);
}

export function cancelSlot(slotId: number): void {
  db.prepare('UPDATE slots SET status = "free", userId = NULL WHERE id = ?').run(slotId);
}

export function getSlotsByTrainerId(trainerId: number): Slot[] {
  return db.prepare('SELECT * FROM slots WHERE trainerId = ?').all(trainerId) as Slot[];
}

export function getFreeSlotsByTrainerId(trainerId: number): Slot[] {
  return db.prepare('SELECT * FROM slots WHERE trainerId = ? AND status = "free"').all(trainerId) as Slot[];
}

export function getBookedSlotsByTrainerId(trainerId: number): Slot[] {
  return db.prepare('SELECT * FROM slots WHERE trainerId = ? AND status = "booked"').all(trainerId) as Slot[];
}

export function getSlotsByUserId(userId: number): Slot[] {
  return db.prepare('SELECT * FROM slots WHERE userId = ?').all(userId) as Slot[];
}

export function getSlotById(slotId: number): Slot | undefined {
  return db.prepare('SELECT * FROM slots WHERE id = ?').get(slotId) as Slot | undefined;
}

export function bookSlot(slotId: number, userId: number): void {
  db.prepare('UPDATE slots SET status = "booked", userId = ? WHERE id = ?').run(userId, slotId);
}