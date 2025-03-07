import { Telegraf } from 'telegraf';
import { registerClientActions } from './clientActions.ts';
import { registerAdminActions } from './adminActions.ts';
import { registerSlotManagement } from './slotManagement.ts';
import { registerModeSwitch } from './modeSwitch.ts';
import type { CustomContext } from './clientActions.ts'; // Импорт типа из одного из модулей
import { BOT_TOKEN } from './tokens.ts';

const botToken = process.env.TALON_BOT_TOKEN || BOT_TOKEN;
if (!botToken) throw Error('Не удалось получить токен');

const bot = new Telegraf<CustomContext>(botToken);

// Регистрация модулей
registerClientActions(bot);
registerAdminActions(bot);
registerSlotManagement(bot);
registerModeSwitch(bot);

// Старт бота
bot.start((ctx) => {
  const payload = ctx.startPayload;
  if (payload?.startsWith('trainer')) {
    const trainerId = parseInt(payload.replace('trainer', ''));
    import('./utils.ts').then(({ showTrainerSlots }) => showTrainerSlots(ctx, trainerId));
  } else {
    ctx.reply('Привет! Ты в режиме клиента. Выбери действие:', {
      reply_markup: { keyboard: [['Посмотреть слоты'], ['Мои записи'], ['Моё расписание']], resize_keyboard: true }
    });
  }
});

bot.launch().then(() => console.log('Бот запущен!'));