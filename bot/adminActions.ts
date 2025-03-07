import { Telegraf, Markup } from 'telegraf';
import { getTrainerByTelegramId } from './dbOperations.ts';
import { generateTrainerQR } from './qr.ts';
import { generateNextDates, generateHours, generateMinutes } from './timeUtils.ts';
import { Patterns } from './patterns.ts';
import type { CustomContext } from './clientActions.ts';

export function registerAdminActions(bot: Telegraf<CustomContext>): void {
  bot.hears('Создать слот', (ctx) => {
    const trainer = getTrainerByTelegramId(ctx.from.id);
    if (!trainer || !trainer.isAdmin) return ctx.reply('Ты не в режиме админа!');
    
    const dates = generateNextDates();
    const buttons = dates.map(date => [{ text: date, callback_data: `date_${date}` }]);
    ctx.reply('Выбери дату:', Markup.inlineKeyboard(buttons));
  });

  bot.hears('Мои слоты', (ctx) => {
    import('./utils.ts').then(({ showMySlots }) => showMySlots(ctx));
  });

  bot.hears('Мои записи', (ctx) => {
    import('./utils.ts').then(({ showMyBookings }) => showMyBookings(ctx));
  });

  bot.hears('Сгенерировать QR', async (ctx) => {
    const trainer = getTrainerByTelegramId(ctx.from.id);
    if (!trainer || !trainer.isAdmin) return ctx.reply('Ты не в режиме админа!');

    await generateTrainerQR(trainer.id);
    ctx.replyWithPhoto({ source: './trainer.png' });
  });

  bot.action(new RegExp(Patterns.Date), (ctx) => {
    const date = ctx.match![1];
    const hours = generateHours();
    const buttons = hours.map(hour => [{ text: hour, callback_data: `hour_${date}_${hour}` }]).reduce((acc, curr) => [...acc, curr], []);
    ctx.reply(`Выбери час начала для ${date}:`, Markup.inlineKeyboard(buttons, { columns: 4 }));
  });

  bot.action(new RegExp(Patterns.Hour), (ctx) => {
    const [date, hour] = [ctx.match![1], ctx.match![2]];
    const minutes = generateMinutes();
    const buttons = minutes.map(min => [{ text: min, callback_data: `start_${date}_${hour}:${min}` }]);
    ctx.reply(`Выбери минуты начала для ${hour}:`, Markup.inlineKeyboard(buttons));
  });

  bot.action(new RegExp(Patterns.StartTime), (ctx) => {
    const [date, time] = [ctx.match![1], ctx.match![2]];
    const durationHours = generateHours().map(h => h.split(':')[0]);
    const buttons = durationHours.map(h => [{ text: h, callback_data: `dur_h_${date}_${time}_${h}` }]).reduce((acc, curr) => [...acc, curr], []);
    ctx.reply(`Выбери часы продолжительности для ${date} ${time}:`, Markup.inlineKeyboard(buttons, { columns: 4 }));
  });

  bot.action(new RegExp(Patterns.DurationHours), (ctx) => {
    const [date, time, durHours] = [ctx.match![1], ctx.match![2], ctx.match![3]];
    const minutes = generateMinutes();
    const buttons = minutes.map(min => [{ text: min, callback_data: `dur_${date}_${time}_${durHours}:${min}` }]);
    ctx.reply(`Выбери минуты продолжительности для ${durHours} ч:`, Markup.inlineKeyboard(buttons));
  });
}