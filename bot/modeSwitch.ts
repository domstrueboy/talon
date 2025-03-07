import { Telegraf, Markup } from 'telegraf';
import { setAdminMode, setClientMode } from './dbOperations.ts';
import type { CustomContext } from './clientActions.ts';

export function registerModeSwitch(bot: Telegraf<CustomContext>): void {
  bot.hears('Моё расписание', (ctx) => {
    setAdminMode(ctx.from.id);
    ctx.reply('Ты теперь в режиме админа!', {
      reply_markup: { keyboard: [['Создать слот', 'Мои слоты'], ['Мои записи', 'Сгенерировать QR'], ['Вернуться в режим клиента']], resize_keyboard: true }
    });
  });

  bot.hears('Вернуться в режим клиента', (ctx) => {
    setClientMode(ctx.from.id);
    ctx.reply('Ты вернулся в режим клиента!', {
      reply_markup: { keyboard: [['Посмотреть слоты'], ['Мои записи'], ['Моё расписание']], resize_keyboard: true }
    });
  });
}