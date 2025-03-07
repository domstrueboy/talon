import { Telegraf, Markup, Context } from 'telegraf';
import { addTrainer, getTrainerByTelegramId, getSlotsByTrainerId, getFreeSlotsByTrainerId, createSlot, getSlotById, bookSlot } from './dbOperations.ts';
import type { Trainer, Slot } from './db.ts';
import { generateTrainerQR } from './qr.ts';
import { generateNextDates, generateHours, generateMinutes, durationToMinutes, isSlotOverlapping } from './timeUtils.ts';
import { BOT_TOKEN } from './tokens.ts';

interface CustomContext extends Context {
  from: { id: number, is_bot: boolean, first_name: string };
}

const Commands = {
  CreateSlot: 'create_slot',
  MySlots: 'my_slots',
  GenerateQR: 'generate_qr',
}

const Patterns = {
  Date: 'date_(.+)',
  Hour: 'hour_(.+)_(\\d{2}):00',
  StartTime: 'start_(.+)_(\\d{2}:\\d{2})',
  DurationHours: 'dur_h_(.+)_(\\d{2}:\\d{2})_(\\d{2})',
  Duration: 'dur_(.+)_(\\d{2}:\\d{2})_(\\d{2}:\\d{2})',
  Book: 'book_(\\d+)',
}

const botToken = process.env.TALON_BOT_TOKEN || BOT_TOKEN;
if (!botToken) {
  throw Error('Не удалось получить токен');
}

const bot = new Telegraf<CustomContext>(botToken);
const ADMIN_ID = 123456789; // Замени на свой Telegram ID
addTrainer('Тренер 1', ADMIN_ID);

bot.start((ctx) => {
  const payload = ctx.startPayload;
  if (payload?.startsWith('trainer')) {
    const trainerId = parseInt(payload.replace('trainer', ''));
    showTrainerSlots(ctx, trainerId);
  } else {
    ctx.reply(`Привет! Команды: /${Commands.MySlots}, /${Commands.CreateSlot}, /${Commands.GenerateQR}`);
  }
});

bot.command(Commands.CreateSlot, (ctx) => {
  const trainer: Trainer | undefined = getTrainerByTelegramId(ctx.from.id);
  if (!trainer) return ctx.reply('Ты не тренер!');

  const dates = generateNextDates();
  const buttons = dates.map(date => [{ text: date, callback_data: `date_${date}` }]);
  ctx.reply('Выбери дату:', Markup.inlineKeyboard(buttons));
});

bot.action(new RegExp(Patterns.Date), (ctx) => {
  const date = ctx.match![1];
  const hours = generateHours();
  const buttons = hours.map(hour => [{ text: hour, callback_data: `hour_${date}_${hour}` }]).reduce(
    (acc, curr) => [...acc, curr],
    []
  );
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
  const buttons = durationHours.map(h => [{ text: h, callback_data: `dur_h_${date}_${time}_${h}` }]).reduce(
    (acc, curr) => [...acc, curr],
    []
  );
  ctx.reply(`Выбери часы продолжительности для ${date} ${time}:`, Markup.inlineKeyboard(buttons, { columns: 4 }));
});

bot.action(new RegExp(Patterns.DurationHours), (ctx) => {
  const [date, time, durHours] = [ctx.match![1], ctx.match![2], ctx.match![3]];
  const minutes = generateMinutes();
  const buttons = minutes.map(min => [{ text: min, callback_data: `dur_${date}_${time}_${durHours}:${min}` }]);
  ctx.reply(`Выбери минуты продолжительности для ${durHours} ч:`, Markup.inlineKeyboard(buttons));
});

bot.action(new RegExp(Patterns.Duration), (ctx) => {
  const [date, time, durationStr] = [ctx.match![1], ctx.match![2], ctx.match![3]];
  const trainer: Trainer | undefined = getTrainerByTelegramId(ctx.from.id);
  if (!trainer) return ctx.reply('Ты не тренер!');

  const duration = durationToMinutes(durationStr);
  const slots = getSlotsByTrainerId(trainer.id);

  if (isSlotOverlapping(slots, date, time, duration)) {
    return ctx.reply('Ошибка: слот пересекается с другим!');
  }

  createSlot(trainer.id, date, time, duration);
  ctx.reply(`Слот ${date} ${time} создан (длительность: ${duration} мин)!`);
});

bot.command(Commands.MySlots, (ctx) => {
  const trainer: Trainer | undefined = getTrainerByTelegramId(ctx.from.id);
  if (!trainer) return ctx.reply('Ты не тренер!');

  const slots: Slot[] = getSlotsByTrainerId(trainer.id);
  if (!slots.length) return ctx.reply('Слотов нет.');

  const response = slots.map(slot => {
    const status = slot.status === 'free' ? 'Свободен' : `Занят (ID: ${slot.userId})`;
    return `${slot.date} ${slot.time} (${slot.duration} мин) - ${status}`;
  }).join('\n');
  ctx.reply(`Твои слоты:\n${response}`);
});

function showTrainerSlots(ctx: CustomContext, trainerId: number): void {
  const slots: Slot[] = getFreeSlotsByTrainerId(trainerId);
  if (!slots.length) {
    ctx.reply('Нет свободных слотов.');
    return;
  }

  const buttons = slots.map(slot => [{
    text: `${slot.date} ${slot.time} (${slot.duration} мин)`,
    callback_data: `book_${slot.id}`
  }]);
  ctx.reply('Свободные слоты:', Markup.inlineKeyboard(buttons));
}

bot.action(new RegExp(Patterns.Book), (ctx) => {
  const slotId = parseInt(ctx.match![1]);
  const slot: Slot | undefined = getSlotById(slotId);
  if (!slot || slot.status !== 'free') return ctx.reply('Слот занят или не существует.');

  bookSlot(slotId, ctx.from.id);
  ctx.reply(`Слот ${slot.date} ${slot.time} забронирован!`);
});

bot.command(Commands.GenerateQR, async (ctx) => {
  const trainer: Trainer | undefined = getTrainerByTelegramId(ctx.from.id);
  if (!trainer) return ctx.reply('Ты не тренер!');

  await generateTrainerQR(trainer.id);
  ctx.replyWithPhoto({ source: './trainer.png' });
});

bot.launch().then(() => console.log('Бот запущен!'));