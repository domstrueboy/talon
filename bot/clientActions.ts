import { Telegraf, Markup, Context } from 'telegraf';
import { getAllTrainers } from './dbOperations.ts';
import { showTrainerSlots } from './utils.ts';
import { Patterns } from './patterns.ts';

export interface CustomContext extends Context {
  from: { id: number, is_bot: boolean, first_name: string };
}

export function registerClientActions(bot: Telegraf<CustomContext>): void {
  bot.hears('Посмотреть слоты', (ctx) => {
    const trainers = getAllTrainers();
    if (!trainers.length) return ctx.reply('Тренеров пока нет.');
    
    const buttons = trainers.map(trainer => [{ text: trainer.name, callback_data: `set_trainer_${trainer.id}` }]);
    ctx.reply('Выбери тренера:', Markup.inlineKeyboard(buttons));
  });

  bot.action(new RegExp(Patterns.SetTrainer), (ctx) => {
    const trainerId = parseInt(ctx.match![1]);
    showTrainerSlots(ctx, trainerId);
  });

  bot.hears('Мои записи', (ctx) => {
    import('./utils.ts').then(({ showMyBookings }) => showMyBookings(ctx));
  });
}