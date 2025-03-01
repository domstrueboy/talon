import type { Slot } from './db.ts';

export function generateNextDates(daysAhead: number = 3): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

export function generateHours(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
}

export function generateMinutes(): string[] {
  return ['00', '15', '30', '45'];
}

export function durationToMinutes(durationStr: string): number {
  const [hours, minutes] = durationStr.split(':').map(Number);
  return (hours * 60 + minutes) || 60;
}

export function isSlotOverlapping(slots: Slot[], date: string, time: string, duration: number): boolean {
  const newStart = new Date(`${date}T${time}:00`);
  const newEnd = new Date(newStart.getTime() + duration * 60000);

  return slots.some(slot => {
    const existingStart = new Date(`${slot.date}T${slot.time}:00`);
    const existingEnd = new Date(existingStart.getTime() + slot.duration * 60000);
    return newStart < existingEnd && newEnd > existingStart;
  });
}