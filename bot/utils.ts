import { Markup } from 'telegraf';
import { getTrainerByTelegramId, getSlotsByTrainerId, getBookedSlotsByTrainerId, getSlotsByUserId } from './dbOperations.ts';
import type { CustomContext } from './clientActions.ts';
import type { Slot } from './db.ts';

export function showTrainerSlots(ctx: CustomContext, trainerId: number): void {
  const slots: Slot[] = getSlotsByTrainerId(trainerId);
  if (!slots.length) {
    ctx.reply('Нет слотов у этого тренера.');
    return;
  }

  const buttons = slots.map(slot => {
    const isBookedByUser = slot.status === 'booked' && slot.userId === ctx.from.id;
    const text = `${slot.date} ${slot.time} (${slot.duration} мин)${isBookedByUser ? ' - Ваш' : ''}`;
    const data = isBookedByUser ? `cancel_${slot.id}` : `book_${slot.id}`;
    return [{
      text,
      callback_data: data,
      hide: slot.status === 'booked' && !isBookedByUser
    }];
  });
  ctx.reply('Слоты тренера:', Markup.inlineKeyboard(buttons));
}

export function showMyBookings(ctx: CustomContext): void {
  const trainer = getTrainerByTelegramId(ctx.from.id);
  
  if (trainer && trainer.isAdmin) {
    const slots = getBookedSlotsByTrainerId(trainer.id);
    if (!slots.length) return ctx.reply('Нет занятых слотов.');
    
    const buttons = slots.map(slot => [{
      text: `${slot.date} ${slot.time} (${slot.duration} мин) - Клиент ${slot.userId}`,
      callback_data: `cancel_${slot.id}`
    }]);
    ctx.reply('Ваши занятые слоты:', Markup.inlineKeyboard(buttons));
  } else {
    const slots = getSlotsByUserId(ctx.from.id);
    if (!slots.length) return ctx.reply('У вас нет записей.');
    
    const buttons = slots.map(slot => [{
      text: `${slot.date} ${slot.time} (${slot.duration} мин)`,
      callback_data: `cancel_${slot.id}`
    }]);
    ctx.reply('Ваши записи:', Markup.inlineKeyboard(buttons));
  }
}

export function showMySlots(ctx: CustomContext): void {
  const trainer = getTrainerByTelegramId(ctx.from.id);
  if (!trainer || !trainer.isAdmin) return ctx.reply('Ты не в режиме админа!');

  const slots = getSlotsByTrainerId(trainer.id);
  if (!slots.length) return ctx.reply('Слотов нет.');

  const buttons = slots.map(slot => {
    const text = `${slot.date} ${slot.time} (${slot.duration} мин)${slot.status === 'booked' ? ` - Клиент ${slot.userId}` : ''}`;
    return [
      { text, callback_data: slot.status === 'booked' ? `cancel_${slot.id}` : `edit_${slot.id}` },
      { text: 'Удалить', callback_data: `delete_${slot.id}` }
    ];
  });
  ctx.reply('Твои слоты:', Markup.inlineKeyboard(buttons));
}