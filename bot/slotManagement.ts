import { Telegraf, Markup } from 'telegraf';
import { getTrainerByTelegramId, getSlotById, bookSlot, cancelSlot, editSlot, deleteSlot, getSlotsByTrainerId, createSlot } from './dbOperations.ts';
import { durationToMinutes, isSlotOverlapping } from './timeUtils.ts';
import { generateNextDates, generateHours, generateMinutes } from './timeUtils.ts';
import { Patterns } from './patterns.ts';
import type { CustomContext } from './clientActions.ts';

export function registerSlotManagement(bot: Telegraf<CustomContext>): void {
  bot.action(new RegExp(Patterns.Duration), (ctx) => {
    const [date, time, durationStr] = [ctx.match![1], ctx.match![2], ctx.match![3]];
    const trainer = getTrainerByTelegramId(ctx.from.id);
    if (!trainer || !trainer.isAdmin) return ctx.reply('Ты не в режиме админа!');

    const duration = durationToMinutes(durationStr);
    const slots = getSlotsByTrainerId(trainer.id);

    if (isSlotOverlapping(slots, date, time, duration)) {
      return ctx.reply('Ошибка: слот пересекается с другим!');
    }

    createSlot(trainer.id, date, time, duration);
    ctx.reply(`Слот ${date} ${time} создан (длительность: ${duration} мин)!`);
  });

  bot.action(new RegExp(Patterns.Book), (ctx) => {
    const slotId = parseInt(ctx.match![1]);
    const slot = getSlotById(slotId);
    if (!slot || slot.status !== 'free') return ctx.reply('Слот занят или не существует.');

    bookSlot(slotId, ctx.from.id);
    ctx.reply(`Слот ${slot.date} ${slot.time} забронирован!`);
    const trainer = getTrainerByTelegramId(slot.trainerId);
    if (trainer) {
      bot.telegram.sendMessage(trainer.telegramId, `Клиент ${ctx.from.first_name} (ID: ${ctx.from.id}) забронировал слот ${slot.date} ${slot.time}`);
    }
  });

  bot.action(new RegExp(Patterns.Cancel), (ctx) => {
    const slotId = parseInt(ctx.match![1]);
    const slot = getSlotById(slotId);
    if (!slot || (slot.userId !== ctx.from.id && !getTrainerByTelegramId(ctx.from.id)?.isAdmin)) return ctx.reply('Этот слот не ваш или вы не тренер!');

    cancelSlot(slotId);
    ctx.reply(`Запись на ${slot.date} ${slot.time} отменена!`);
    const trainer = getTrainerByTelegramId(slot.trainerId);
    if (trainer && ctx.from.id !== trainer.telegramId) {
      bot.telegram.sendMessage(trainer.telegramId, `Клиент ${ctx.from.first_name} (ID: ${ctx.from.id}) отменил слот ${slot.date} ${slot.time}`);
    }
  });

  bot.action(new RegExp(Patterns.Edit), (ctx) => {
    const slotId = parseInt(ctx.match![1]);
    const slot = getSlotById(slotId);
    if (!slot || slot.status === 'booked') return ctx.reply('Слот занят или не существует.');

    const dates = generateNextDates();
    const buttons = dates.map(date => [{ text: date, callback_data: `edit_date_${slotId}_${date}` }]);
    ctx.reply('Выбери новую дату:', Markup.inlineKeyboard(buttons));
  });

  bot.action苗

.action(new RegExp(Patterns.EditDate), (ctx) => {
    const [slotId, date] = [parseInt(ctx.match![1]), ctx.match![2]];
    const hours = generateHours();
    const buttons = hours.map(hour => [{ text: hour, callback_data: `edit_hour_${slotId}_${date}_${hour}` }]).reduce((acc, curr) => [...acc, curr], []);
    ctx.reply(`Выбери новый час для ${date}:`, Markup.inlineKeyboard(buttons, { columns: 4 }));
  });

  bot.action(new RegExp(Patterns.EditHour), (ctx) => {
    const [slotId, date, hour] = [parseInt(ctx.match![1]), ctx.match![2], ctx.match![3]];
    const minutes = generateMinutes();
    const buttons = minutes.map(min => [{ text: min, callback_data: `edit_start_${slotId}_${date}_${hour}:${min}` }]);
    ctx.reply(`Выбери новые минуты для ${hour}:`, Markup.inlineKeyboard(buttons));
  });

  bot.action(new RegExp(Patterns.EditStart), (ctx) => {
    const [slotId, date, time] = [parseInt(ctx.match![1]), ctx.match![2], ctx.match![3]];
    const durationHours = generateHours().map(h => h.split(':')[0]);
    const buttons = durationHours.map(h => [{ text: h, callback_data: `edit_dur_h_${slotId}_${date}_${time}_${h}` }]).reduce((acc, curr) => [...acc, curr], []);
    ctx.reply(`Выбери новую длительность (часы) для ${date} ${time}:`, Markup.inlineKeyboard(buttons, { columns: 4 }));
  });

  bot.action(new RegExp(Patterns.EditDurHours), (ctx) => {
    const [slotId, date, time, durHours] = [parseInt(ctx.match![1]), ctx.match![2], ctx.match![3], ctx.match![4]];
    const minutes = generateMinutes();
    const buttons = minutes.map(min => [{ text: min, callback_data: `edit_dur_${slotId}_${date}_${time}_${durHours}:${min}` }]);
    ctx.reply(`Выбери минуты длительности для ${durHours} ч:`, Markup.inlineKeyboard(buttons));
  });

  bot.action(new RegExp(Patterns.EditDur), (ctx) => {
    const [slotId, date, time, durationStr] = [parseInt(ctx.match![1]), ctx.match![2], ctx.match![3], ctx.match![4]];
    const trainer = getTrainerByTelegramId(ctx.from.id);
    if (!trainer || !trainer.isAdmin) return ctx.reply('Ты не в режиме админа!');

    const duration = durationToMinutes(durationStr);
    const slots = getSlotsByTrainerId(trainer.id);

    if (isSlotOverlapping(slots.filter(s => s.id !== slotId), date, time, duration)) {
      return ctx.reply('Ошибка: слот пересекается с другим!');
    }

    editSlot(slotId, date, time, duration);
    ctx.reply(`Слот ${date} ${time} обновлён (длительность: ${duration} мин)!`);
  });

  bot.action(new RegExp(Patterns.Delete), (ctx) => {
    const slotId = parseInt(ctx.match![1]);
    const slot = getSlotById(slotId);
    if (!slot) return ctx.reply('Слот не существует.');

    const trainer = getTrainerByTelegramId(ctx.from.id);
    if (!trainer || !trainer.isAdmin) return ctx.reply('Ты не в режиме админа!');

    if (slot.status === 'booked' && slot.userId) {
      bot.telegram.sendMessage(slot.userId, `Ваш слот ${slot.date} ${slot.time} был удалён тренером.`);
    }
    deleteSlot(slotId);
    ctx.reply(`Слот ${slot.date} ${slot.time} удалён!`);
  });
}